// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for defining room designer constants.
export const unitsInInch = .025414244512494; // I arrived at this by imported Berkeley listings into Babylon, but it's probably just .0254 :)
export const cmInInches = 2.54;

export const externalRoomWidthInCm = 700;
export const externalRoomLengthInCm = 1000;

export const roomWidth = externalRoomWidthInCm * (1 / cmInInches) * unitsInInch;
export const roomLength = externalRoomLengthInCm * (1 / cmInInches) * unitsInInch;

export const moveIncrementInInches = 6;
export const rotationIncrementInDegrees = 15;

export const cameraDistanceInUnits = 5.5;
export const cameraHeightInUnits = 2;

export const defaultCameraPosition = [0, cameraHeightInUnits, cameraDistanceInUnits];
export const rearCameraPosition = [0, cameraHeightInUnits, -cameraDistanceInUnits];
export const leftCameraPosition = [cameraDistanceInUnits + 1, cameraHeightInUnits, 0];
export const rightCameraPosition = [-cameraDistanceInUnits + -1, cameraHeightInUnits, 0];

export const defultCameraTarget = [0, 0, 0];
//export const defultCameraTarget = [0, 1.5, -5];

export const adjustControlsForCameraView = true;