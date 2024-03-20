// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for providing a room configuration exporter.
import * as log from 'ts-app-logger';

import { IExport, ISaveArgs } from '../iface';
import { appState } from '../state';
import * as fileUtils from '../utils.file';

import { IRoomDesignerListing, IRoomConfiguration, IRoomObject } from './iface';
import * as constants from './constants';

export const exportRoomAsYAML = (roomListings: IRoomDesignerListing[], saveArgs: ISaveArgs, importedRoom?: IRoomConfiguration): IExport => {
  log.debug('exportRoomAsYAML', importedRoom?.name);

  const roomConfiguration = toRoomConfiguration(roomListings, importedRoom);

  return roomConfigurationToExport(roomConfiguration, saveArgs);
}

export const toRoomConfiguration = (roomListings: IRoomDesignerListing[], importedRoom?: IRoomConfiguration): IRoomConfiguration => {
  log.debug('toRoomConfiguration', importedRoom?.name);

  const state = appState.get();

  const roomConfiguration: IRoomConfiguration = {
    id: new Date().getTime().toString(), // crypto.randomUUID()
    imported_room_configuration: JSON.stringify(importedRoom),
    prompt: importedRoom?.prompt,
    name: state.roomName || importedRoom?.name || state.prompt || 'Unnamed room',
    area_size_x: constants.externalRoomWidthInCm,
    area_size_z: constants.externalRoomLengthInCm, 
    objects: []
  }; 

  roomConfiguration.objects = roomListings.map(internalRoomListing => {
    log.debug('export room item', internalRoomListing.renderId, internalRoomListing.listing.id, internalRoomListing.listing.name);
    //log.debug(`x calc: ${internalRoomListing.meshPositionState.distanceFromRoomOrigin.x} * (1 / ${constants.unitsInInch}) * ${constants.cmInInches}`);
    //log.debug(`z calc: ${internalRoomListing.meshPositionState.distanceFromRoomOrigin.z} * (1 / ${constants.unitsInInch}) * ${constants.cmInInches}`);

    const roomObject: IRoomObject = {
      id: internalRoomListing.id,
      model_id: internalRoomListing.listing.id,
      model_location: 'berkeley',
      name: internalRoomListing.importedRoomObject?.name || internalRoomListing.listing.searchText || internalRoomListing.listing.name,
      category: internalRoomListing.importedRoomObject?.category || internalRoomListing.listing.keywords.split('|')[0],
      colors: internalRoomListing.importedRoomObject?.colors || internalRoomListing.listing.colors.split('|'),
      x: Math.ceil(internalRoomListing.meshPositionState.distanceFromRoomOrigin.x * (1 / constants.unitsInInch) * constants.cmInInches),
      y: Math.ceil(internalRoomListing.meshPositionState.distanceFromRoomOrigin.y * (1 / constants.unitsInInch) * constants.cmInInches),
      z: Math.ceil(internalRoomListing.meshPositionState.distanceFromRoomOrigin.z * (1 / constants.unitsInInch) * constants.cmInInches),
      orientation: internalRoomListing.meshPositionState.rotation
    };
    
    return roomObject;
  });

  return roomConfiguration;
}

const roomConfigurationToExport = (roomConfiguration: IRoomConfiguration, saveArgs: ISaveArgs): IExport => {
  return fileUtils.exportJSONAsYAML(roomConfiguration, saveArgs);
}