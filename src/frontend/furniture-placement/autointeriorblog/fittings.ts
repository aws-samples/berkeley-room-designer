// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
import * as log from 'ts-app-logger';

import { IPolygon2D, IVector2D } from '../iface';

import { FittingLayout } from './fitting-layout';
import { IFitting, SideType, back, front, left, right } from './iface';
import * as vectors from './vectors';
import * as polygonGeometry from './polygons';
import * as fittingModels from './fitting-models';

export const getCost = (fittingLayout: FittingLayout, fitting: IFitting): number => {
  log.trace('fittings.getCost', fittingLayout, fitting);

  let fittingCost = 0;

  const overlapCost = calculateFittingOverlapCost(fittingLayout, fitting);
  const clearanceOverlapCost = calculateClearanceAreaOverlaps(fittingLayout, fitting);
  const [wallOverlapCost, wallDistanceCost, wallOrientationCost, isCenterInsideRoom] = calculateWallOverlapAndWallDistance(fittingLayout, fitting);
  const lowestSpatialRelationCost = calculateLowestSpatialRelationCost(fittingLayout, fitting, isCenterInsideRoom);

  // Fitting evaulation feature weighting.
  const overlapWeighting = 0.2;
  const wallOverlapWeighting = 0.8;
  const wallOrientationWeighting = 0.1;
  
  let wallDistanceWeighting = 0;
  if (fitting.fittingModel.fittingCategorySpatialSemantics.hasIdealWallContact) { wallDistanceWeighting = 0.2; }

  const clearanceOverlapWeighting = 0.1 * (fitting.fittingModel.clearanceAreas.length / 4);

  let relationWeighting = 0;
  if (fitting.fittingModel.fittingCategorySpatialSemantics.spatialRelations.length! > 0) { relationWeighting = 0.2; }

  // Weighting adjustment for only applicable fitting evaluation features.
  const applicableWeightingsSum = overlapWeighting 
    + wallOverlapWeighting 
    + wallOrientationWeighting 
    + wallDistanceWeighting 
    + clearanceOverlapWeighting 
    + relationWeighting;

  fittingCost = (1 / applicableWeightingsSum) * (
    overlapWeighting * overlapCost +
    wallOverlapWeighting * wallOverlapCost +
    wallOrientationWeighting * wallOrientationCost +
    wallDistanceWeighting * wallDistanceCost +
    clearanceOverlapWeighting * clearanceOverlapCost +
    relationWeighting * lowestSpatialRelationCost
  );

  return fittingCost;
}

const calculateFittingOverlapCost = (fittingLayout: FittingLayout, fitting: IFitting): number => {
  let overlapCost = 0, overlappingFittingsCount = 0;

  fittingLayout.placedFittings.filter(otherFitting => !isDeeplyEqual(fitting, otherFitting)).forEach(otherFitting => {
    const overlapEstimate = getOverlapEstimate(fitting, otherFitting);

    if (overlapEstimate > 0) {
      const otherFittingPolygon: IPolygon2D = polygonFromFitting(otherFitting);

      if (polygonGeometry.isPointInside(fitting.position, otherFittingPolygon)) {
        overlappingFittingsCount++;
        overlapCost += overlapEstimate;
      } else {
        const fittingPolygon = polygonFromFitting(otherFitting);

        if (doPolygonsOverlap(fittingPolygon, otherFittingPolygon)) {
          overlappingFittingsCount++;
          overlapCost += overlapEstimate;
        }
      }
    }
  });

  // Calculate average fitting overlap.
  if (overlappingFittingsCount > 0) { overlapCost /= overlappingFittingsCount; }

  if (!isFinite(overlapCost) || isNaN(overlapCost)) { overlapCost = 0; }

  log.trace('fittings.calculateFittingOverlapCost', 'overlapCost', overlapCost);

  return overlapCost;
}

const calculateClearanceAreaOverlaps = (fittingLayout: FittingLayout, fitting: IFitting): number => {
  let clearanceOverlapCost = 0;

  const clearanceAreas: IPolygon2D[] = [];

  const rightSideClearanceAreaPolygon = tryGetPolygonForClearanceArea(fitting, right, { x: Math.cos(fitting.orientation), z: Math.sin(fitting.orientation) });
  if (rightSideClearanceAreaPolygon) { clearanceAreas.push(rightSideClearanceAreaPolygon); }

  const backSideClearanceAreaPolygon = tryGetPolygonForClearanceArea(fitting, back, { x: Math.cos(fitting.orientation + Math.PI / 2), z: Math.sin(fitting.orientation + Math.PI / 2) });
  if (backSideClearanceAreaPolygon) { clearanceAreas.push(backSideClearanceAreaPolygon); }

  const leftSideClearanceAreaPolygon = tryGetPolygonForClearanceArea(fitting, left, { x: Math.cos(fitting.orientation + Math.PI), z: Math.sin(fitting.orientation + Math.PI) });
  if (leftSideClearanceAreaPolygon) { clearanceAreas.push(leftSideClearanceAreaPolygon); }

  const frontSideClearanceAreaPolygon = tryGetPolygonForClearanceArea(fitting, front, { x: Math.cos(fitting.orientation - Math.PI / 2), z: Math.sin(fitting.orientation - Math.PI / 2) });
  if (frontSideClearanceAreaPolygon) { clearanceAreas.push(frontSideClearanceAreaPolygon); }

  let clearanceOverlappingFittingsCount = 0;

  clearanceAreas.forEach(clearanceArea => {
    fittingLayout.placedFittings.filter(otherFitting => !isDeeplyEqual(fitting, otherFitting)).forEach(otherFitting => {
      const overlapEstimate = getOverlapEstimate(fitting, otherFitting);

      if (overlapEstimate > 0) {
        const otherFittingPolygon = polygonFromFitting(otherFitting);

        if (doPolygonsOverlap(clearanceArea, otherFittingPolygon)) {
          clearanceOverlappingFittingsCount++;
          clearanceOverlapCost += overlapEstimate;
        }
      }
    });
  });

  // Calculate average clearance overlap.
  if (clearanceOverlappingFittingsCount > 0) {
    clearanceOverlapCost /= clearanceOverlappingFittingsCount * clearanceAreas.length;
  }

  if (!isFinite(clearanceOverlapCost) || isNaN(clearanceOverlapCost)) { clearanceOverlapCost = 0; }

  log.trace('fittings.calculateClearanceAreaOverlaps', 'clearanceOverlapCost', clearanceOverlapCost);

  return clearanceOverlapCost;
}

const calculateWallOverlapAndWallDistance = (fittingLayout: FittingLayout, fitting: IFitting): [number, number, number, boolean] => {
  log.trace('fittings.calculateWallOverlapAndWallDistance');

  let wallOverlapCost = 0, wallDistanceCost = 0, wallOrientationCost = 0; // Wall distance only evaluated for wall contact fittings.

  const wallPolygon = fittingLayout.room.wallPolygon;
  let closestWallDistanceCenter = 1.7976931348623157E+308; // FIXME What is this constant in Javscript?
  let isCenterInsideRoom = false;

  let angleToClosestWall = 0;

  for (let i = 0; i < wallPolygon.edgePositions.length; i++) {
    const startPoint = wallPolygon.edgePositions[i];
    const endPoint = wallPolygon.edgePositions[(i + 1) % wallPolygon.edgePositions.length];

    const wallVector = vectors.subtract(endPoint, startPoint);
    const wallDistance = polygonGeometry.distanceToLineSegment(fitting.position, startPoint, endPoint);

    if (wallDistance < closestWallDistanceCenter) {
      closestWallDistanceCenter = wallDistance;

      // Check if fitting position is inside room polygon,
      //  i.e. if position is to the right of a wall vector pointing in the clockwise direction.
      if (0 > Math.sign((endPoint.x - startPoint.x) * (fitting.position.z - startPoint.z) - (endPoint.z - startPoint.z) * (fitting.position.x - startPoint.x))) {
        isCenterInsideRoom = true;
      }

      // Calculate orientation to wall
      angleToClosestWall = Math.acos(vectors.dot(vectors.normalize(wallVector), { x: Math.cos(fitting.orientation), z: Math.sin(fitting.orientation) }));
    }
  }

  let wallPenetration = Math.max(0, (fitting.fittingModel.halfDiagonal + (isCenterInsideRoom ? -1 : 1) * closestWallDistanceCenter) / (2 * fitting.fittingModel.halfDiagonal));

  if (wallPenetration > 0 && isCenterInsideRoom || fitting.fittingModel.fittingCategorySpatialSemantics.hasIdealWallContact) {
    // Calculate accurate distance from fitting bounding rectangle to wall.
    const fittingPolygon = polygonFromFitting(fitting);
    
    let closestWallDistance = 1.7976931348623157E+308; // FIXME What is this constant in Javascript?

    for (let i = 0; i < wallPolygon.edgePositions.length; i++) {
      const startPointWall = wallPolygon.edgePositions[i];
      const endPointWall = wallPolygon.edgePositions[(i + 1) % wallPolygon.edgePositions.length];

      for (let j = 0; j < 4; j++) {
        const startPointFitting = fittingPolygon.edgePositions[j];
        const endPointFitting = fittingPolygon.edgePositions[(j + 1) % 4];

        const wallDistance = polygonGeometry.distanceBetweenLineSegments(startPointWall, endPointWall, startPointFitting, endPointFitting);
        if (wallDistance < closestWallDistance) {
          closestWallDistance = wallDistance;

          // Update wall orientation angle to closest wall to bounding rectangle
          angleToClosestWall = Math.acos(vectors.dot(vectors.normalize(vectors.subtract(endPointWall, startPointWall)), { x: Math.cos(fitting.orientation), z: Math.sin(fitting.orientation) }));
        }
      }
    }

    // Calculate wall distance cost.
    if (fitting.fittingModel.fittingCategorySpatialSemantics.hasIdealWallContact) {
      let relativeWallDistance;
      if (closestWallDistance > 0 && isCenterInsideRoom) {
        relativeWallDistance = closestWallDistance / (2 * fitting.fittingModel.halfDiagonal);
      } else {
        relativeWallDistance = Math.max(0, (fitting.fittingModel.halfDiagonal + (isCenterInsideRoom ? -1 : 1) * closestWallDistanceCenter) / (2 * fitting.fittingModel.halfDiagonal));
      }

      wallDistanceCost = relativeWallDistance / (0.1 + relativeWallDistance);
    }

    // Correct wall penetration if fitting bounding rectangle did not penetrate.
    if (closestWallDistance > 0 && isCenterInsideRoom) {
      wallPenetration = 0;
    }
  }

  // Calculate wall overlap cost.
  wallOverlapCost = wallPenetration / (wallPenetration + 0.5);

  // Calculate wall orientation cost.
  if (isCenterInsideRoom) {
    wallOrientationCost = angleToClosestWall / Math.PI;
  } else {
    wallOrientationCost = 1;
  }

  return [wallOverlapCost, wallDistanceCost, wallOrientationCost, isCenterInsideRoom];
}

const calculateLowestSpatialRelationCost = (fittingLayout: FittingLayout, fitting: IFitting, isCenterInsideRoom: boolean): number => {
  log.trace('fittings.calculateLowestSpatialRelationCost');

  let lowestSpatialRelationCost = 0;
  const relationCosts: number[] = [];

  fittingLayout.placedFittings.filter(otherFitting => !isDeeplyEqual(fitting, otherFitting)).forEach(otherFitting => {
    otherFitting.fittingModel.fittingCategorySpatialSemantics.spatialRelations.forEach(spatialRelation => {
      if (otherFitting.fittingModel.fittingCategorySpatialSemantics.fittingCategory !== spatialRelation.relatedFittingCategory) { return; }

      let positionalDelta = vectors.subtract(fitting.position, otherFitting.position);

      // To avoid calculation problems in special case.
      if (vectors.equalTo(positionalDelta, vectors.zero2D)) { positionalDelta = vectors.unitX; }

      // Rotate to related base-orientation.
      let sin = Math.sin(-otherFitting.orientation);
      let cos = Math.cos(-otherFitting.orientation);

      let initPositionalDeltaR: IVector2D = {
        x: positionalDelta.x * cos - positionalDelta.z * sin,
        z: positionalDelta.x * sin + positionalDelta.z * cos
      };

      // Stretch against related fitting proportions.
      let positionalDeltaR = { 
        x: initPositionalDeltaR.x / otherFitting.fittingModel.boundingBox.width, 
        z: initPositionalDeltaR.z / otherFitting.fittingModel.boundingBox.depth 
      };
      positionalDeltaR = vectors.normalize(positionalDeltaR);

      const angleToRelatedFittingRightSide = Math.atan2(positionalDeltaR.z, positionalDeltaR.x) + 2 * Math.PI;

      const relatedFittingSide = (((angleToRelatedFittingRightSide - (Math.PI / 4)) / (Math.PI / 2)) + 1) % 4;

      // Rotate to this fitting's base-orientation
      sin = Math.sin(-fitting.orientation);
      cos = Math.cos(-fitting.orientation);

      const initPositionalDeltaT: IVector2D = {
        x: -positionalDelta.x * cos + positionalDelta.z * sin,
        z: -positionalDelta.x * sin - positionalDelta.z * cos
      };

      // Stretch against this fitting's proportions.
      let positionalDeltaT = { 
        x: initPositionalDeltaT.x / otherFitting.fittingModel.boundingBox.width, 
        z: initPositionalDeltaT.z / otherFitting.fittingModel.boundingBox.depth 
      };
      positionalDeltaT = vectors.normalize(positionalDeltaT);

      const angleToFittingRightSide = Math.atan2(positionalDeltaT.z, positionalDeltaT.x) + 2 * Math.PI;

      const fittingFacingSide = (((angleToFittingRightSide - (Math.PI / 4)) / (Math.PI / 2)) + 1) % 4;

      let sideIdealness = 0;
      let sideNormal: IVector2D = vectors.zero2D;

      if (relatedFittingSide == 0) {
        sideIdealness = spatialRelation.rightSidePropability;
        sideNormal = vectors.unitX;
      } else if (relatedFittingSide == 1) {
        sideIdealness = spatialRelation.backSidePropability;
        sideNormal = vectors.unitY;
      } else if (relatedFittingSide == 2) {
        sideIdealness = spatialRelation.leftSidePropability;
        sideNormal = vectors.scale(-1, vectors.unitX);
      } else if (relatedFittingSide == 3) {
        sideIdealness = spatialRelation.frontSidePropability;
        sideNormal = vectors.scale(-1, vectors.unitY);
      }

      const alignmentIdealness = 1 - (Math.acos(vectors.dot(sideNormal, positionalDeltaR)) / (Math.PI / 4));
      
      let orientationDifference = Math.abs(((fitting.orientation + Math.PI / 2) - (otherFitting.orientation + Math.PI / 2 * relatedFittingSide)) % (2 * Math.PI));
      orientationDifference = orientationDifference > Math.PI ? Math.PI - orientationDifference : orientationDifference;
      const orientationIdealness = isCenterInsideRoom ? 1 - orientationDifference / Math.PI : 0;

      // Calculate distance to furniture.
      const fittingPolygon = polygonFromFitting(fitting);
      const relatedFittingPolygon = polygonFromFitting(otherFitting);

      //const fittingFacingSide = ((int)(angleToRelatedFittingRightSide + Math.PI - Orientation - Math.PI / 4) + 4) % 4;
          //((int)((otherFitting.Orientation - Orientation - (Math.PI / 4)) / (Math.PI / 2)) + 8) % 4;

      const distanceDelta = Math.abs(spatialRelation.idealDistance - polygonGeometry.distanceBetweenLineSegments(
        fittingPolygon.edgePositions[(1 - fittingFacingSide + 4) % 4], 
        fittingPolygon.edgePositions[(2 - fittingFacingSide + 4) % 4], 
        relatedFittingPolygon.edgePositions[(1 - relatedFittingSide + 4) % 4], 
        relatedFittingPolygon.edgePositions[(2 - relatedFittingSide + 4) % 4])
      );

      const distanceIdealness = 1 - distanceDelta / (distanceDelta + 0.25 * spatialRelation.idealDistance + 0.0001);

      relationCosts.push(1 - (0.2 * sideIdealness + 0.2 * orientationIdealness + 0.2 * alignmentIdealness + 0.4 * distanceIdealness));
    });
  });

  if (relationCosts.length > 0) {
    lowestSpatialRelationCost = 1.7976931348623157E+308; // To become lowest found relation cost
    
    relationCosts.forEach(relationCost => {
      if (relationCost < lowestSpatialRelationCost) {
        lowestSpatialRelationCost = relationCost;
      }
    });
  }

  return lowestSpatialRelationCost;
}

// Calculates overlap of two circles maximized to containing each fitting's bounding box (for faster calculation speed).
const getOverlapEstimate = (fitting: IFitting, otherFitting: IFitting): number => {
  const distance = vectors.distance(fitting.position, otherFitting.position);
  const overlapLength = fitting.fittingModel.halfDiagonal + otherFitting.fittingModel.halfDiagonal - distance;

  const overlapEstimate = Math.max(0, overlapLength / (fitting.fittingModel.halfDiagonal + otherFitting.fittingModel.halfDiagonal))
  log.trace('fittings.getOverlapEstimate', fitting.fittingModel.listing.id, 'overlapEstimate', overlapEstimate);

  return overlapEstimate;
}

const doPolygonsOverlap = (firstPolygon: IPolygon2D, secondPolygon: IPolygon2D): boolean => {
  log.trace('fittings.doPolygonsOverlap');

  const edgeCount1 = firstPolygon.edgePositions.length;
  const edgeCount2 = secondPolygon.edgePositions.length;

  for (let i = 0; i < edgeCount1; i++) {
    const startPoint1 = firstPolygon.edgePositions[i];
    const endPoint1 = firstPolygon.edgePositions[(i + 1) % edgeCount1];

    for (let j = 0; j < edgeCount2; j++) {
      const startPoint2 = secondPolygon.edgePositions[j];
      const endPoint2 = secondPolygon.edgePositions[(j + 1) % edgeCount2];

      if (polygonGeometry.doLineSegmentsIntersect(startPoint1, endPoint1, startPoint2, endPoint2)) {
        return true;
      }
    }
  }

  return false;
}

const polygonFromFitting = (fitting: IFitting): IPolygon2D => {
  return polygonGeometry.createRotatedRectangle(
    fitting.fittingModel.boundingBox.width, 
    fitting.fittingModel.boundingBox.depth, 
    fitting.position, 
    fitting.orientation
  );
}

// X-axis-based direction in floor plane in radians</param>
export const moveInDirection = (fitting: IFitting, stepLength: number, direction: number) => {
  log.trace('fittings.moveInDirection', 'fitting', fitting, stepLength, direction);

  const positionVector = { x: (stepLength * Math.cos(direction)), z: (stepLength * Math.sin(direction)) };

  const newPosition = vectors.add(fitting.position, positionVector);
  fitting.position = newPosition;
}

export const rotateCounterClockwiseInRadians = (fitting: IFitting, angle: number) => {
  const newOrientation = (fitting.orientation + angle) % Math.PI;
  fitting.orientation = newOrientation;
}

const tryGetPolygonForClearanceArea = (fitting: IFitting, side: SideType, scalar: IVector2D): IPolygon2D | undefined => {
  log.trace('fittings.tryGetPolygonForClearanceArea');

  const clearanceArea = fitting.fittingModel.clearanceAreas.find(clearanceArea => clearanceArea.side === side);

  if (clearanceArea && clearanceArea?.perpendicularLength > 0) {
    const otherWhat = (fitting.fittingModel.boundingBox.width / 2) + (clearanceArea.perpendicularLength / 2);
    const clearanceAreaOffset = vectors.add(fitting.position, vectors.scale(otherWhat, scalar));
      
    const polygon = polygonGeometry.createRotatedRectangle(
      clearanceArea.perpendicularLength, 
      fitting.fittingModel.boundingBox.depth, 
      clearanceAreaOffset, 
      fitting.orientation
    );

    return polygon;
  }

  return;
}

// FIXME This was commented out in original implementation and isn't in use. Needed? Consider using https://stackoverflow.com/questions/30970107/calculating-the-percent-overlap-of-two-polygons-in-javascript
export const getRelativeOverlap = (fitting: IFitting, otherFitting: IFitting) => {
  log.trace('fittings.getRelativeOverlap');

  let overlap: IPolygon2D = { edgePositions: [] };

  const fittingPolygon = polygonFromFitting(fitting);
  const otherFittingPolygon = polygonFromFitting(otherFitting);

  let checkingOtherFitting = false;
  
  let checkIndex = 0;
  let previousWasInside = polygonGeometry.isPointInside(fittingPolygon.edgePositions[3], otherFittingPolygon);
  let previouslyCheckedPoint = fittingPolygon.edgePositions[3];

  let checkPolygon = fittingPolygon;
  let checkAgainstPolygon = otherFittingPolygon;

  while (!(previouslyCheckedPoint == fittingPolygon.edgePositions[3] && overlap.edgePositions.length == 0) || overlap.edgePositions.length < 8) {
    // Update rectangle to check against and check if edge Point is inside.
    let thisInside;
    if (checkingOtherFitting) {
      thisInside = polygonGeometry.isPointInside(otherFittingPolygon.edgePositions[checkIndex], fittingPolygon);
      checkPolygon = otherFittingPolygon;
      checkAgainstPolygon = fittingPolygon;
    } else {
      thisInside = polygonGeometry.isPointInside(fittingPolygon.edgePositions[checkIndex], otherFittingPolygon);
      checkPolygon = fittingPolygon;
      checkAgainstPolygon = otherFittingPolygon;
    }

    // Evaluate line and add overlap polygon edges
    if (thisInside) {
      if (previousWasInside) {
        overlap.edgePositions.push(checkPolygon.edgePositions[checkIndex]);

        // Proceed.
        previouslyCheckedPoint = checkPolygon.edgePositions[checkIndex];
        checkIndex = (checkIndex + 1) % 4;
        previousWasInside = true;
      } else {
        let intersectionPoint: IVector2D = vectors.zero2D;

        for (let i = 0; i < checkAgainstPolygon.edgePositions.length; i++) {
          const startPoint = checkAgainstPolygon.edgePositions[(i - 1 + 4) % 4];
          const endPoint = checkAgainstPolygon.edgePositions[i % 4];

          const intersectedPoint = polygonGeometry.getLineSectionsIntersectionPoint(
            checkPolygon.edgePositions[(checkIndex - 1 + 4) % 4], 
            checkPolygon.edgePositions[checkIndex], 
            startPoint, 
            endPoint
          );

          if (intersectedPoint) { 
            intersectionPoint = intersectedPoint;

            break; 
          }
        }

        overlap.edgePositions.push(intersectionPoint);
        overlap.edgePositions.push(checkPolygon.edgePositions[checkIndex]);

        // Proceed.
        previouslyCheckedPoint = checkPolygon.edgePositions[checkIndex];
        checkIndex = (checkIndex + 1) % 4;
        previousWasInside = true;
      }
    } else {
      if (previousWasInside) {
        // Find and add 1 intersection point, switch checkpolygon, and set checkindex to after intersection line.
        let intersectionPoint: IVector2D = vectors.zero2D;

        for (let i = 0; i < checkAgainstPolygon.edgePositions.length; i++) {
          const startPoint = checkAgainstPolygon.edgePositions[(i - 1 + 4) % 4];
          const endPoint = checkAgainstPolygon.edgePositions[i % 4];

          const intersectedPoint = polygonGeometry.getLineSectionsIntersectionPoint(
            previouslyCheckedPoint, 
            checkPolygon.edgePositions[checkIndex],
            startPoint, 
            endPoint
          );

          if (intersectedPoint) {
            intersectionPoint = intersectedPoint;

            overlap.edgePositions.push(intersectionPoint);

            // Switch rectangle to follow.
            previouslyCheckedPoint = intersectionPoint;
            checkingOtherFitting = !checkingOtherFitting;
            checkIndex = i;
            previousWasInside = true;

            break;
          }
        }
      } else {
        // Check for eventual double intersection points, in that case add them and switch checkpolygon and checkindex to after them (?)
        let firstFoundIntersectionPoint;
        let firstFoundIntersectionDistance = 0, firstFoundEdgeIndexAfter = 0;

        for (let edgeIndexAfter = 0; edgeIndexAfter < checkAgainstPolygon.edgePositions.length; edgeIndexAfter++) {
          const startPoint = checkAgainstPolygon.edgePositions[(edgeIndexAfter - 1 + 4) % 4];
          const endPoint = checkAgainstPolygon.edgePositions[edgeIndexAfter % 4];

          const intersectionDistance = 0;

          const intersectedPoint = polygonGeometry.getLineSectionsIntersectionPoint(
            checkPolygon.edgePositions[(checkIndex - 1 + 4) % 4], 
            checkPolygon.edgePositions[checkIndex],
            startPoint, 
            endPoint, 
            intersectionDistance
          );

          if (intersectedPoint) {
            if (!firstFoundIntersectionPoint) {
              firstFoundIntersectionDistance = intersectionDistance;
              firstFoundIntersectionPoint = intersectedPoint;
              firstFoundEdgeIndexAfter = edgeIndexAfter;
            } else {
              if (intersectionDistance >= firstFoundIntersectionDistance) {
                // Add first found intersection Point first, as last found is further along.
                overlap.edgePositions.push(firstFoundIntersectionPoint);
                overlap.edgePositions.push(intersectedPoint);

                // Switch to follow other rectangle.
                previouslyCheckedPoint = intersectedPoint;
                checkingOtherFitting = !checkingOtherFitting;
                checkIndex = edgeIndexAfter;
                previousWasInside = true;
              } else {
                // Add first found intersection Point last, as last found is further along.
                overlap.edgePositions.push(intersectedPoint);
                overlap.edgePositions.push(firstFoundIntersectionPoint);

                // Switch to follow other rectangle.
                previouslyCheckedPoint = firstFoundIntersectionPoint;
                checkingOtherFitting = !checkingOtherFitting;
                checkIndex = firstFoundEdgeIndexAfter;
                previousWasInside = true;
              }

              // Both intersection points have been found.
              break;
            }
          }
        }

        // No intersection found.
        if (!firstFoundIntersectionPoint) {
          // Proceed.
          previouslyCheckedPoint = checkPolygon.edgePositions[checkIndex];
          checkIndex = (checkIndex + 1) % 4;
          previousWasInside = false;
        }
      }
    }
  }

  dedupeOverlappingEdgePositions(overlap);

  return calculateRelativeOverlap(overlap, fitting);
}

const dedupeOverlappingEdgePositions = (overlap: IPolygon2D) => {
  log.trace('fittings.dedupeOverlappingEdgePositions');

  for (let i = 0; i < overlap.edgePositions.length; i++) {
    if (overlap.edgePositions[i] == overlap.edgePositions[0]) {
      const overlapTrimmed: IPolygon2D = { edgePositions: [] };

      for (let j = 0; j < i; j++) {
        overlapTrimmed.edgePositions.push(overlap.edgePositions[j]);
      }

      overlap = overlapTrimmed;
    }
  }
}

const calculateRelativeOverlap = (overlap: IPolygon2D, fitting: IFitting): number => {
  log.trace('fittings.calculateRelativeOverlap');

  if (overlap.edgePositions.length >= 3) {
    return polygonGeometry.area(overlap) / fittingModels.baseArea(fitting.fittingModel);
  }

  return 0;
}

// See: https://gist.github.com/jsdevtom/36ba2ddaab5e612188ec09daca750371
const isArray = Array.isArray;
const keyList = Object.keys;
const hasProp = Object.prototype.hasOwnProperty;

export function isDeeplyEqual<T extends any>(a: T, b: T): boolean {
  //log.trace('isDeeplyEqual');

  if (a === b) { return true; }

  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const arrA = isArray(a)
      , arrB = isArray(b);
    let i
      , length
      , key;

    if (arrA && arrB) {
      length = a.length;
      if (length !== b.length) { return false; }
      for (i = length; i-- !== 0;) {
        if (!isDeeplyEqual(a[i], b[i])) { return false;
      } }
      return true;
    }

    if (arrA !== arrB) { return false; }

    const dateA = a instanceof Date
      , dateB = b instanceof Date;
    if (dateA !== dateB) { return false; }
    if (dateA && dateB) { return a.getTime() === b.getTime(); }

    const regexpA = a instanceof RegExp
      , regexpB = b instanceof RegExp;
    if (regexpA !== regexpB) { return false; }
    if (regexpA && regexpB) { return a.toString() === b.toString(); }

    const keys = keyList(a);
    length = keys.length;

    if (length !== keyList(b).length) {
      return false;
    }

    for (i = length; i-- !== 0;) {
      if (!hasProp.call(b, keys[i])) { return false;
    } }

    for (i = length; i-- !== 0;) {
      key = keys[i];
      // @ts-ignore
      if (!isDeeplyEqual(a[key], b[key])) { return false; }
    }

    return true;
  }

  return a !== a && b !== b;
}