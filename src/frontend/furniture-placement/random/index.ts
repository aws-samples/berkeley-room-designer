// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for providing a random furniture placement algorithm.
import * as log from 'ts-app-logger';
import * as turf from '@turf/turf';

import * as fileUtils from '../../utils.file';

import { IRoomCreationArgs, fittingCategories } from '../iface';

import { IRoom, IFittingModels, IFittingPriority, IFittingModel, IFittingLayout } from '../autointeriorblog/iface';
import { Room } from '../autointeriorblog/room';
import { generateFittingSemantics as generateDefaultFittingSemantics } from '../autointeriorblog/fitting-semantics.default';
import { importance } from '../autointeriorblog/fitting-priority';
import * as fittingModels from '../autointeriorblog/fitting-models';
import { FittingLayout } from '../autointeriorblog/fitting-layout';

export const generateRoomConfiguration = async (roomCreationArgs: IRoomCreationArgs): Promise<string> => {
  log.debug('generateRoomConfiguration', roomCreationArgs.roomDescription);

  const fittingSemantics = await generateDefaultFittingSemantics(roomCreationArgs);

  const room = Room.fromFittingSemanticsAndDescription(fittingSemantics, roomCreationArgs.roomDescription);
  roomCreationArgs.visualizer?.tryRender(roomCreationArgs.roomDescription, 'room description');

  const roomFurnisher = new RandomRoomFurnisher(fittingSemantics, roomCreationArgs, room);
  const fittingLayout = roomFurnisher.generateFittingLayout();
  log.debug('fittingLayout', fittingLayout);
  
  roomCreationArgs.visualizer?.tryRender(fittingLayout, 'final fitting layout');

  return fileUtils.convertJSONToYAML(fittingLayout.toRoomConfiguration());
}

export class RandomRoomFurnisher {
  private readonly fittingSemantics: IFittingModels;
  private readonly roomCreationArgs: IRoomCreationArgs;
  private readonly room: IRoom;

  constructor(fittingSemantics: IFittingModels, roomCreationArgs: IRoomCreationArgs, room: IRoom) {
    this.fittingSemantics = fittingSemantics;
    this.roomCreationArgs = roomCreationArgs;
    this.room = room;
  }

  generateFittingLayout(): FittingLayout {
    log.debug('RandomRoomFurnisher.generateFittingLayout');

    const fittingModelsToBePlaced = this.selectFittingModels();
    log.debug('fittingModelsToBePlaced', fittingModelsToBePlaced.length);

    // Initialize initial solution.
    // The fittings may be out of bounds (of the room) since the bounding boxes may overlap, so we'll need to adjust.
    const fittingLayout = FittingLayout.withFittingsAtRandomPosition(this.room, fittingModelsToBePlaced, this.fittingSemantics);
    this.roomCreationArgs.visualizer?.tryRender(fittingLayout, 'initial fitting layout');

    this.ensureAllFittingsInRoomBounds(fittingLayout);
    this.ensureAllFittingsProperlyPlaced(fittingLayout);

    return fittingLayout;
  }

  private selectFittingModels(): IFittingModel[] {
    log.trace('RandomRoomFurnisher.selectFittingModels');

    const selectedFittingModels: IFittingModel[] = [];

    const areaToBeOccupied = this.room.area() * this.roomCreationArgs.fillTarget;
   
    let areaOccupied = 0, selectedCount = 0;
    while (areaOccupied < areaToBeOccupied) {
      log.trace('areaOccupied', areaOccupied, 'areaToBeOccupied', areaToBeOccupied);

      const fittingPriorities = this.getFittingPrioritiesForRoomType();
      const totalImportance = this.getTotalImportance(areaToBeOccupied, fittingPriorities);

      let result = Math.random() * totalImportance;
      let importanceCounter = 0;

      for (const fittingPriority of fittingPriorities) { 
        importanceCounter += importance(fittingPriority, areaToBeOccupied, selectedCount);

        if (result < importanceCounter) {
          log.debug('fittingModel priority to select', fittingPriority.fittingCategory);
          const fittingModelsForCurrentPriorityFittingType = this.fittingSemantics.fittingModels.filter(fittingModel => fittingModel.fittingCategory === fittingPriority.fittingCategory);
          
          const modelFittingToBeAdded = fittingModelsForCurrentPriorityFittingType[Math.floor(Math.random() * fittingModelsForCurrentPriorityFittingType.length)];
          if (!modelFittingToBeAdded) { throw Error(`No fitting model found for fitting priority with fitting category: ${fittingPriority.fittingCategory}`); }
          
          //log.debug('modelFittingToBeAdded', modelFittingToBeAdded);
          selectedFittingModels.push(modelFittingToBeAdded);
          areaOccupied += fittingModels.baseArea(modelFittingToBeAdded);
          selectedCount += 1;

          break; // A fitting has been selected.
        }
      }
    }

    return selectedFittingModels;
  }

  private getTotalImportance(areaToBeOccupied: number, fittingPriorities: IFittingPriority[]): number {
    log.trace('RandomRoomFurnisher.getTotalImportance');

    let totalImportance = 0;

    fittingPriorities.forEach(fittingPriority => { totalImportance += importance(fittingPriority, areaToBeOccupied); });
    
    return totalImportance;
  }

  private getFittingPrioritiesForRoomType(): IFittingPriority[] {
    log.trace('RandomRoomFurnisher.getFittingPrioritiesForRoomType');

    const roomType = Room.getRoomType(this.fittingSemantics, this.room.description.roomCategory);

    return roomType.fittingPriorities;
  }

  private ensureAllFittingsInRoomBounds(fittingLayout: IFittingLayout) {
    const halfRoomWidth = fittingLayout.room.description.widthInMeters / 2;
    const halfRoomDepth = fittingLayout.room.description.depthInMeters / 2;
    log.debug('halfRoomWidth', halfRoomWidth, 'halfRoomDepth', halfRoomDepth);

    const roomBoundingBox = turf.polygon([[ // TL, TR, BR, BL
      [-halfRoomWidth, halfRoomDepth],
      [halfRoomWidth, halfRoomDepth],
      [halfRoomWidth, -halfRoomDepth],
      [-halfRoomWidth, -halfRoomDepth],
      [-halfRoomWidth, halfRoomDepth] // End at start to close.
    ]]);
    log.debug('roomBoundingBox', roomBoundingBox);

    fittingLayout.placedFittings.map(fitting => {
      fittingModels.baseArea(fitting.fittingModel);

      const halfFittingWidth = fitting.fittingModel.boundingBox.width / 2;
      const halfFittingDepth = fitting.fittingModel.boundingBox.depth / 2;

      // FIXME Take into account orientation.

      /*
      FIXME Take into account clearances.
      const frontClearanceArea = fitting.fittingModel.clearanceAreas.find(clearanceArea => clearanceArea.side === 'front');
      const backClearanceArea = fitting.fittingModel.clearanceAreas.find(clearanceArea => clearanceArea.side === 'back');
      const leftClearanceArea = fitting.fittingModel.clearanceAreas.find(clearanceArea => clearanceArea.side === 'left');
      const rightClearanceArea = fitting.fittingModel.clearanceAreas.find(clearanceArea => clearanceArea.side === 'right');
      */

      const fittingBoundingBox = turf.polygon([[ // TL, TR, BR, BL
        [fitting.position.x - halfFittingWidth, fitting.position.z + halfFittingDepth],
        [fitting.position.x + halfFittingWidth, fitting.position.z + halfFittingDepth],
        [fitting.position.x + halfFittingWidth, fitting.position.z - halfFittingDepth],
        [fitting.position.x - halfFittingWidth, fitting.position.z - halfFittingDepth],
        [fitting.position.x - halfFittingWidth, fitting.position.z + halfFittingDepth] // End at start to close.
      ]]);

      if (!turf.booleanContains(roomBoundingBox, fittingBoundingBox)) {
        log.warn('fittting model needs adjustment', fitting.fittingModel.listing.id, fitting.position);
      } else {
        log.debug('fittting model ok', fitting.fittingModel.listing.id, fitting.position);
      }

      return fitting;
    });
  }

  private ensureAllFittingsProperlyPlaced(fittingLayout: IFittingLayout) {
    const halfRoomWidth = fittingLayout.room.description.widthInMeters / 2;
    const halfRoomDepth = fittingLayout.room.description.depthInMeters / 2;
    log.debug('halfRoomWidth', halfRoomWidth, 'halfRoomDepth', halfRoomDepth);

    const roomBoundingBox = turf.polygon([[ // TL, TR, BR, BL
      [-halfRoomWidth, halfRoomDepth],
      [halfRoomWidth, halfRoomDepth],
      [halfRoomWidth, -halfRoomDepth],
      [-halfRoomWidth, -halfRoomDepth],
      [-halfRoomWidth, halfRoomDepth] // End at start to close.
    ]]);
    log.debug('roomBoundingBox', roomBoundingBox);

    fittingLayout.placedFittings.map(fitting => {
      //const baseArea = fittingModels.baseArea(fitting.fittingModel);

      // Get fitting placement info.
      const fittingCategory = fittingCategories.find(fittingCategory => fittingCategory.name === fitting.fittingModel.fittingCategory);

      switch (fittingCategory?.fittingPlacementLocation) {
        case 'floor': 
          // FIXME Place on floor.
          //fitting.position.y = 0;
          break;
        case 'wall':
          // FIXME Place on nearest wall.
          //fitting.position.x = 
          //fitting.position.y =
          break;
        case 'ceiling': 
          // FIXME Place on ceiling.
          //fitting.position.y = this.room.height;
          break;
      }

      return fitting;
    });
  }
}