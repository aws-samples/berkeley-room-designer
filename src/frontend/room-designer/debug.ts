// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for providing some debugging utilities.
import * as log from 'ts-app-logger';

import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';

 export const logListingPosition = (mesh: AbstractMesh) => {
  log.debug('listing position', mesh.getPositionData());
  log.debug('listing world center', mesh.getBoundingInfo().boundingBox.center);
}

export const logListingRotation = (mesh: AbstractMesh) => {
  log.debug('listing rotation (euler)', mesh.rotationQuaternion?.toEulerAngles());
  log.debug('listing rotation (quaternion)', mesh.rotationQuaternion);
}

export const logListingDimensions = (mesh: AbstractMesh) => {
  const xLength = Math.abs(mesh.getBoundingInfo().boundingBox.minimumWorld._x) + Math.abs(mesh.getBoundingInfo().boundingBox.maximumWorld._x);
  const zLength = Math.abs(mesh.getBoundingInfo().boundingBox.minimumWorld._z) + Math.abs(mesh.getBoundingInfo().boundingBox.maximumWorld._z);
  const yLength = Math.abs(mesh.getBoundingInfo().boundingBox.minimumWorld._y) + Math.abs(mesh.getBoundingInfo().boundingBox.maximumWorld._y);
  log.debug('listing dimensions', xLength, yLength, zLength);
}