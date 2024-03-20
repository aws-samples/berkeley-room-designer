// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for providing mesh position and orientation utilities.
import * as log from 'ts-app-logger';
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { Axis } from '@babylonjs/core';

import { appState } from '../state';

import { IRoomDesignerListing, IExportMeshPositionState, IMeshPositionState } from './iface';
import * as constants from './constants';

export const moveMeshNegativeX = (mesh: AbstractMesh, selectedRoomListing?: IRoomDesignerListing) => {
  if (!selectedRoomListing) { return; }

  log.debug('moveMeshNegativeX');

  log.debug('mesh -x before', mesh.position.x);
  mesh.position.x = mesh.position.x - (constants.moveIncrementInInches * constants.unitsInInch);
  log.debug('mesh -x after', mesh.position.x);

  selectedRoomListing.meshPositionState.distanceFromRoomOrigin.x = mesh.position.x;

  // Updates our state to reflect scene change.
  appState.upsertRoomListing(selectedRoomListing);
}

export const moveMeshPositiveX = (mesh: AbstractMesh, selectedRoomListing?: IRoomDesignerListing) => {
  if (!selectedRoomListing) { return; }

  log.debug('moveMeshPositiveX');

  log.debug('mesh +x before', mesh.position.x);
  mesh.position.x = mesh.position.x + (constants.moveIncrementInInches * constants.unitsInInch);
  log.debug('mesh +x after', mesh.position.x);
  
  selectedRoomListing.meshPositionState.distanceFromRoomOrigin.x = mesh.position.x;

  // Updates our state to reflect scene change.
  appState.upsertRoomListing(selectedRoomListing);
}

export const moveMeshNegativeZ = (mesh: AbstractMesh, selectedRoomListing?: IRoomDesignerListing) => {
  if (!selectedRoomListing) { return; }

  log.debug('moveMeshNegativeZ');

  log.debug('mesh -z before', mesh.position.z);
  mesh.position.z = mesh.position.z - (constants.moveIncrementInInches * constants.unitsInInch);
  log.debug('mesh -z after', mesh.position.z);

  selectedRoomListing.meshPositionState.distanceFromRoomOrigin.z = mesh.position.z;

  // Updates our state to reflect scene change.
  appState.upsertRoomListing(selectedRoomListing);
}

export const moveMeshPositiveZ = (mesh: AbstractMesh, selectedRoomListing?: IRoomDesignerListing) => {
  if (!selectedRoomListing) { return; }

  log.debug('moveMeshPositiveZ');

  log.debug('mesh +z before', mesh.position.z);
  mesh.position.z = mesh.position.z + (constants.moveIncrementInInches * constants.unitsInInch);
  log.debug('mesh +z after', mesh.position.z);

  selectedRoomListing.meshPositionState.distanceFromRoomOrigin.z = mesh.position.z;

  // Updates our state to reflect scene change.
  appState.upsertRoomListing(selectedRoomListing);
}

export const updateMeshWithModifiedRotation = (mesh: AbstractMesh, rotationIncrementInDegrees: number, roomListing?: IRoomDesignerListing) => {
  if (!roomListing) { throw Error('Can not find roomListing to updateMeshWithModifiedRotation for'); }

  rotateMesh(mesh, rotationIncrementInDegrees);

  roomListing.meshPositionState.rotation = roomListing.meshPositionState.rotation + constants.rotationIncrementInDegrees;

  // Reset to 0 for external export mapping.
  if (roomListing.meshPositionState.rotation === 360) { roomListing.meshPositionState.rotation = 0; }

  // Updates our state to reflect scene change.
  appState.upsertRoomListing(roomListing);
}

export const rotateMesh = (mesh: AbstractMesh, rotationIncrementInDegrees: number) => {
  const radians = rotationIncrementInDegrees * (Math.PI / 180);
  
  // Updates scene.
  mesh.rotate(Axis.Y, radians);
}

export const setPositionAndOrientationForRoomListingMesh = (meshForListing: AbstractMesh, meshPositionStateIn: IExportMeshPositionState): IMeshPositionState => {
  log.trace('setPositionAndOrientationForRoomListingMesh');
  // cm -> inches -> babylonjs units
  const xPosition = (meshPositionStateIn.distanceFromRoomOriginInCm.x * (1 / constants.cmInInches)) * constants.unitsInInch;
  //const yPosition = (meshPositionStateIn.distanceFromRoomOriginInCm.y * (1 / constants.cmInInches)) * constants.unitsInInch;
  const zPosition = (meshPositionStateIn.distanceFromRoomOriginInCm.z * (1 / constants.cmInInches)) * constants.unitsInInch;
  log.debug('new x pos', xPosition, 'new z pos', zPosition);

  meshForListing.position.x = xPosition;
  //meshForListing.position.y = yPosition; // Not handling y at the moment.
  meshForListing.position.z = zPosition;

  rotateMesh(meshForListing, meshPositionStateIn.rotationInDegrees);

  return {
    distanceFromRoomOrigin: { x: meshForListing.position.x, y: 0, z: meshForListing.position.z },
    rotation: meshPositionStateIn.rotationInDegrees
  }
}