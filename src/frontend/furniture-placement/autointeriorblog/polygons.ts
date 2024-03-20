// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for defining polygon operations for this furniture placement algorithm.
import * as log from 'ts-app-logger';

import { IVector2D, IPolygon2D } from '../iface';
import * as vectors from './vectors';

export const fromEdgePositions = (edgePositions: [number, number][]): IPolygon2D => {
  log.trace('polygons.fromEdgePositions', edgePositions);
  
  return { edgePositions: edgePositions.map(edgePosition => ({ x: edgePosition[0], z: edgePosition[1] }) as IVector2D) };
}

export const createAxisOrientedRectangleAroundOrigin = (width: number, depth: number): IPolygon2D => {
  log.trace('polygons.createAxisOrientedRectangleAroundOrigin', width, depth);
  
  const edgePositions: IVector2D[] = [];
  edgePositions.push({ x: -width / 2, z: depth / 2 });
  edgePositions.push({ x: width / 2, z: depth / 2 });
  edgePositions.push({ x: width / 2, z: -depth / 2 });
  edgePositions.push({ x: -width / 2, z: -depth / 2 });

  return { edgePositions };
}

export const createAxisOrientedRectangle = (width: number, depth: number, centerPosition: IVector2D): IPolygon2D => {
  log.trace('polygons.createAxisOrientedRectangle', width, depth, centerPosition);

  const polygon = createAxisOrientedRectangleAroundOrigin(width, depth);
  
  offset(polygon, centerPosition);

  return polygon;
}

const offset = (polygon: IPolygon2D, offset: IVector2D) => {
  log.trace('polygons.offset', polygon, offset);

  for (let i = 0; i < polygon.edgePositions.length; i++) {
    polygon.edgePositions[i] = (vectors.add(polygon.edgePositions[i], offset));
  }
}

export const createRotatedRectangle = (width: number, depth: number, centerPosition: IVector2D, rotationCounterClockwise: number): IPolygon2D => {
  log.trace('polygons.createRotatedRectangle', width, depth, centerPosition, rotationCounterClockwise);

  const polygon = createAxisOrientedRectangle(width, depth, centerPosition);
  
  rotate(polygon, rotationCounterClockwise, centerPosition);
  
  return polygon;
}

const rotate = (polygon: IPolygon2D, rotation: number, rotationCenterPosition: IVector2D) => {
  log.trace('polygons.rotate', polygon, rotation, rotationCenterPosition);

  for (let i = 0; i < polygon.edgePositions.length; i++) {
    polygon.edgePositions[i] = counterClockwiserRotationVector(polygon.edgePositions[i], rotation, rotationCenterPosition);
  }
}

const counterClockwiserRotationVector = (edgePosition: IVector2D, counterClockwiseRotationInRadians: number, rotationCenterPosition: IVector2D): IVector2D => {
  log.trace('polygons.counterClockwiserRotationVector', edgePosition, counterClockwiseRotationInRadians, rotationCenterPosition);

  const sin = Math.sin(counterClockwiseRotationInRadians);
  const cos = Math.cos(counterClockwiseRotationInRadians);

  return {
    x: (edgePosition.x - rotationCenterPosition.x) * cos - (edgePosition.z - rotationCenterPosition.z) * sin + rotationCenterPosition.x,
    z: (edgePosition.x - rotationCenterPosition.x) * sin + (edgePosition.z - rotationCenterPosition.z) * cos + rotationCenterPosition.z
  };
}

export const clone = (polygon: IPolygon2D): IPolygon2D => {
  log.trace('polygons.clone', polygon);

  const clonedPolygon: IPolygon2D = { edgePositions: JSON.parse(JSON.stringify(polygon.edgePositions)) };
  
  return clonedPolygon;
}

export const area = (polygon: IPolygon2D): number => {
  log.trace('polygons.area', polygon);

  let area = 0;

  const n = polygon.edgePositions.length;
  for (let i = 0; i < n; i += 2) {
    log.trace('i=', i, 'n=', n, '(i + 1) % n=', (i + 1) % n);

    const x1 = polygon.edgePositions[(i + 1) % n].x;
    const y1 = polygon.edgePositions[(i + 2) % n].z - polygon.edgePositions[i].z;
    const y2 = polygon.edgePositions[(i + 1) % n].z;
    const x2 = polygon.edgePositions[i].x - polygon.edgePositions[(i + 2) % n].x;

    area += (x1 * y1) + (y2 * x2);
  }

  area = Math.abs(area / 2);

  return area;
}

// FIXME Consider using https://www.npmjs.com/package/point-in-polygon
export const isPointInside = (point: IVector2D, polygon: IPolygon2D): boolean => {
  log.trace('polygons.isPointInside', point, polygon);

  let closestDistance = 1.7976931348623157E+308; // FIXME What is this constant in Javascript?

  for (let i = 0; i < polygon.edgePositions.length; i++) {
    const startPoint = polygon.edgePositions[i];
    const endPoint = polygon.edgePositions[(i + 1) % polygon.edgePositions.length];

    const segmentVector = vectors.subtract(endPoint, startPoint);
    const pointVector = vectors.subtract(point, startPoint);

    const dotproduct = vectors.dot(segmentVector, pointVector);
    const projectionDistance = dotproduct / vectors.lengthSquared(segmentVector);

    let distance;
    if (projectionDistance < 0) {
      distance = vectors.distance(startPoint, point);
    } else if (projectionDistance > 1) {
      distance = vectors.distance(endPoint, point);
    } else {
      distance = vectors.distance(vectors.scale(projectionDistance, segmentVector), pointVector);
    }

    if (distance < closestDistance) {
      closestDistance = distance;

      // Check if point is inside polygon
      // i.e. if position is to the right of a polygon line segment vector pointing in the clockwise direction
      if (0 > Math.sign((endPoint.x - startPoint.x) * (point.z - startPoint.z) - (endPoint.z - startPoint.z) * (point.x - startPoint.x))) {
        return true;
      }
    }
  }

  return false;
}

export const doLineSegmentsIntersect = (
  startPointLine1: IVector2D, 
  endPointLine1: IVector2D, 
  startPointLine2: IVector2D, 
  endPointLine2: IVector2D
): boolean => {
  log.trace('polygons.doLineSegmentsIntersect', startPointLine1, endPointLine1, startPointLine2, endPointLine2);

  const line1Delta: IVector2D = vectors.subtract(endPointLine1, startPointLine1);
  const line2Delta: IVector2D =vectors.subtract(endPointLine2, startPointLine2);

  const deltaDeterminant = line2Delta.z * line1Delta.x - line2Delta.x * line1Delta.z;

  if (deltaDeterminant == 0) { return false; }

  const line1IntersectionDistance = (line2Delta.x * (startPointLine1.z - startPointLine2.z) - line2Delta.z * (startPointLine1.x - startPointLine2.x)) / deltaDeterminant;
  const line2IntersectionDistance = (line1Delta.x * (startPointLine1.z - startPointLine2.z) - line1Delta.z * (startPointLine1.x - startPointLine2.x)) / deltaDeterminant;

  return (line1IntersectionDistance >= 0 && line1IntersectionDistance <= 1 && line2IntersectionDistance >= 0 && line2IntersectionDistance <= 1);
}

export const getLineSectionsIntersectionPoint = (
  startPointLine1: IVector2D, 
  endPointLine1: IVector2D, 
  startPointLine2: IVector2D, 
  endPointLine2: IVector2D, 
  line1IntersectionDistance: number = 0
): IVector2D | undefined => {
  log.trace('polygons.getLineSectionsIntersectionPoint', startPointLine1, endPointLine1, startPointLine2, endPointLine2, line1IntersectionDistance);

  const line1Delta: IVector2D = vectors.subtract(endPointLine1, startPointLine1);
  const line2Delta: IVector2D = vectors.subtract(endPointLine2, startPointLine2);

  const deltaDeterminant = line2Delta.z * line1Delta.x - line2Delta.x * line1Delta.z;

  if (deltaDeterminant == 0) {
    line1IntersectionDistance = -1;
    
    return;
  }

  line1IntersectionDistance = (line2Delta.x * (startPointLine1.z - startPointLine2.z) - line2Delta.z * (startPointLine1.x - startPointLine2.x)) / deltaDeterminant;
  const line2IntersectionDistance = (line1Delta.x * (startPointLine1.z - startPointLine2.z) - line1Delta.z * (startPointLine1.x - startPointLine2.x)) / deltaDeterminant;

  if (line1IntersectionDistance >= 0 && line1IntersectionDistance <= 1 && line2IntersectionDistance >= 0 && line2IntersectionDistance <= 1) {
    return (vectors.add(startPointLine1, vectors.scale(line1IntersectionDistance , line1Delta)));
  }

  line1IntersectionDistance = -1;

  return;
}

export const distanceToLineSegment = (point: IVector2D, lineStartPoint: IVector2D, lineEndPoint: IVector2D): number => {
  log.trace('polygons.distanceToLineSegment', point, lineStartPoint, lineEndPoint);

  const lineVector: IVector2D = vectors.subtract(lineEndPoint, lineStartPoint);
  const pointVector: IVector2D = vectors.subtract(point, lineStartPoint);

  const dotproduct = vectors.dot(lineVector, pointVector);
  const projectionDistance = dotproduct / vectors.lengthSquared(lineVector);

  let distanceLength;
  if (projectionDistance < 0) {
    distanceLength = vectors.distance(lineStartPoint, point);
  } else if (projectionDistance > 1) {
    distanceLength = vectors.distance(lineEndPoint, point);
  } else {
    distanceLength = vectors.distance(vectors.scale(projectionDistance, lineVector), pointVector);
  }

  return distanceLength;
}

export const distanceBetweenLineSegments = (
  startPointLine1: IVector2D,
  endPointLine1: IVector2D, 
  startPointLine2: IVector2D, 
  endPointLine2: IVector2D
): number => {
  log.trace('polygons.distanceBetweenLineSegments', startPointLine1, endPointLine1, startPointLine2, endPointLine2);

  if (doLineSegmentsIntersect(startPointLine1, endPointLine1, startPointLine2, endPointLine2)) {
    return 0;
  }

  const distance1 = distanceToLineSegment(startPointLine1, startPointLine2, endPointLine2);
  const distance2 = distanceToLineSegment(endPointLine1, startPointLine2, endPointLine2);
  const distance3 = distanceToLineSegment(startPointLine2, startPointLine1, endPointLine1);
  const distance4 = distanceToLineSegment(endPointLine2, startPointLine1, endPointLine1);

  return Math.min(distance1, Math.min(distance2, Math.min(distance3, distance4)));
}
