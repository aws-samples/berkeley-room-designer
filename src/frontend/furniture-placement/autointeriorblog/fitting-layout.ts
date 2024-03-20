// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for defining fitting layout utilities.
import * as log from 'ts-app-logger';

import { IRoomConfiguration, IRoomObject } from '../../room-designer/iface';

import { IRoom, IFittingLayout, IFitting, IFittingModel, IFittingModels } from './iface';
import * as fittings from './fittings';

export class FittingLayout implements IFittingLayout {
  room: IRoom;
  fittingModelsToBePlaced: IFittingModel[]; 
  fittingSemantics: IFittingModels;
  placedFittings: IFitting[] = [];

  constructor(
    room: IRoom,
    fittingModelsToBePlaced: IFittingModel[],
    fittingSemantics: IFittingModels,
  ) {
    this.room = room;
    this.fittingModelsToBePlaced = fittingModelsToBePlaced;
    this.fittingSemantics = fittingSemantics;
  }

  static withFittingsPlacedAtOrigin(
    room: IRoom,
    fittingModelsToBePlaced: IFittingModel[],
    fittingSemantics: IFittingModels,
  ) {
    const placedFittings: IFitting[] = [];
    const fittingLayout = new FittingLayout(room, fittingModelsToBePlaced, fittingSemantics);

    fittingModelsToBePlaced.forEach(fittingModel => { // Place the model.
      const fitting = { position: { x: 0, z: 0 }, orientation: 0, fittingModel };
      
      placedFittings.push(fitting);
    });

    fittingLayout.placedFittings = placedFittings;

    return fittingLayout;
  }

  static withFittingsAtRandomPosition(
    room: IRoom,
    fittingModelsToBePlaced: IFittingModel[],
    fittingSemantics: IFittingModels,
  ) {
    const placedFittings: IFitting[] = [];
    const fittingLayout = new FittingLayout(room, fittingModelsToBePlaced, fittingSemantics);

    fittingModelsToBePlaced.forEach(fittingModel => { // Place the model.
      const x = randomNumberInRange(-(room.description.widthInMeters / 2), (room.description.widthInMeters / 2));
      const z = randomNumberInRange(-(room.description.depthInMeters / 2), (room.description.depthInMeters / 2));
      
      const rotationIncrementInDegrees = randomNumberInRange(0, 359);
      const orientation = rotationIncrementInDegrees * (Math.PI / 180);

      const fitting = { position: { x, z }, orientation, fittingModel };
      
      placedFittings.push(fitting);
    });

    fittingLayout.placedFittings = placedFittings;

    return fittingLayout;
  }

  getCost(): number {
    let totalCost = 0;

    log.trace('placedFittings', this.placedFittings.length);
    
    this.placedFittings.forEach(fitting => { 
      const costOfFitting = fittings.getCost(this, fitting);
      log.trace(fitting.fittingModel.listing.id, 'costOfFitting', costOfFitting);

      totalCost += costOfFitting;
    });

    let averageCost = (totalCost / this.placedFittings.length);

    if (!isFinite(averageCost) || isNaN(averageCost)) { averageCost = 0 }
    log.trace('FittingLayout.getCost', 'totalCost', totalCost, '# placedFittings', this.placedFittings.length, 'averageCost', averageCost);

    return averageCost;
  }

  clone(): FittingLayout {
    log.trace('FittingLayout.clone');

    const placedFittings = JSON.parse(JSON.stringify(this.placedFittings));

    const fittingLayout = new FittingLayout(this.room.clone(), this.fittingModelsToBePlaced, this.fittingSemantics);
    fittingLayout.placedFittings = placedFittings;

    return fittingLayout;
  }

  getRandomFitting(): IFitting {
    log.trace('FittingLayout.getRandomFitting');

    return this.placedFittings[Math.floor(Math.random() * this.placedFittings.length)];
  }

  toRoomConfiguration(): IRoomConfiguration {
    return {
      id: new Date().getTime().toString(),
      area_size_x: this.room.description.widthInMeters,
      area_size_z: this.room.description.depthInMeters,
      objects: this.placedFittings.map(placedFitting => {
        const roomObject: IRoomObject = {
          id: new Date().getTime().toString(),
          model_location: 'berkeley',
          model_id: placedFitting.fittingModel.listing.id,
          name: placedFitting.fittingModel.fittingCategorySpatialSemantics.fittingCategory.toString()!,
          category: placedFitting.fittingModel.fittingCategorySpatialSemantics.fittingCategory.toString()!,
          colors: placedFitting.fittingModel.listing.colors.split('|'),
          x: placedFitting.position.x,
          y: 0, // This algorithm doesn't handle height.
          z: placedFitting.position.z,
          orientation: placedFitting.orientation * (180 / Math.PI)
        };

        return roomObject;
      })
    }
  }
}

const randomNumberInRange = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
}