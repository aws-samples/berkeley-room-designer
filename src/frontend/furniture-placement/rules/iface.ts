// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This algorithm is not in use! I left it here for consideration later.
export interface IFittingRule {
  name: string;
  description: string;
  roomSemantics: RoomType[];
  spaceType: SpaceType[];
  fittingType: FittingType[];
  apply: CallableFunction;
}

export type RoomType = '*' | 'living room' | 'bedroom';
export type SpaceType = '*' | 'small' | 'large';
export type SpaceShapeType = '*' | 'square' | 'rectangle';
export type SpaceClassificationType = '*' | 'long and narrow';
export type FittingType = '*' | 'chair' | 'sofa' | 'floor lamp';