// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for defining room operations for this furniture placement algorithm.
import * as log from 'ts-app-logger';

import { IPolygon2D, IDoor, IWindow, ISimpleRoomDescription, RoomCategoryType } from '../iface';

import { IRoom, IRoomSemantics, IFittingModels } from './iface';

import * as polygonsGeometry from './polygons';

export class Room implements IRoom {
  description: ISimpleRoomDescription;
  height: number;
  wallPolygon: IPolygon2D;
  doors: IDoor[] = [];
  windows: IWindow[] = [];

  constructor(
    description: ISimpleRoomDescription,
    height: number,
    wallPolygon: IPolygon2D
  ) {
    this.description = description;
    this.height = height;
    this.wallPolygon = wallPolygon;
  }

  static fromFittingSemanticsAndDescription(fittingSemantics: IFittingModels, roomDescription: ISimpleRoomDescription): IRoom {
    log.trace('Room.fromDescription', fittingSemantics, roomDescription);

    const wallPolygon = polygonsGeometry.createAxisOrientedRectangleAroundOrigin(roomDescription.widthInMeters, roomDescription.depthInMeters);

    // Validation step.
    Room.getRoomType(fittingSemantics, roomDescription.roomCategory);

    return new Room(roomDescription, roomDescription.heightInMeters, wallPolygon);
  }

  static getRoomType(fittingSemantics: IFittingModels, roomCategory: RoomCategoryType): IRoomSemantics {
    // Room types are configured by semantics. These semantics are rules the furnisher should furnish by.
    // Semantics _may_ not have specific room types defined, so validate the fitting semantics can furnish our room's category.
    const roomType = fittingSemantics.roomSemantics.find(roomType => roomType.roomCategory === roomCategory);
    if (!roomType) { throw Error(`Fitting semantics does not include room type: ${roomCategory}`); }
    
    return roomType;
  }

  clone(): IRoom { 
    log.trace('Room.clone');

    return new Room(this.description, this.height, polygonsGeometry.clone(this.wallPolygon)); 
  }

  area(): number { 
    log.trace('Room.area');

    return polygonsGeometry.area(this.wallPolygon); 
  }
}