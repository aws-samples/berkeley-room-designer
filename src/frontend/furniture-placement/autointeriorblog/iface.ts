// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for defining interfaces used purely in this furniture placement algorithm.
import { IListing } from '../../room-designer/iface';
import { FittingCategoryType, IDoor, IPolygon2D, ISimpleRoomDescription, IVector2D, IWindow, RoomCategoryType } from '../iface';

export interface IFittingModels {
  fittingCategorySpatialSemantics: Map<FittingCategoryType, IFittingCategorySpatialSemantics>;
  fittingModels: IFittingModel[];
  roomSemantics: IRoomSemantics[];
}

export interface IFittingCategorySpatialSemantics {
  fittingCategory: FittingCategoryType;
  orientedness: OrientednessType;
  hasIdealWallContact: boolean;
  idealOrientationToWall: number;
  spatialRelations: ISpatialRelation[];
}

export type OrientednessType = 'oriented' | 'symmetrical' | 'equilateral' | 'equilateral';

export interface ISpatialRelation {
  relatedFittingCategory: FittingCategoryType;
  idealDistance: number;
  idealOrientation: number;
  rightSidePropability: number;
  backSidePropability: number;
  leftSidePropability: number;
  frontSidePropability: number;
}

export interface IFittingLayout {
  room: IRoom;
  fittingModelsToBePlaced: IFittingModel[]; // fitting model with placement info.
  fittingSemantics: IFittingModels;
  placedFittings: IFitting[]; // fitting model with placement info.
}

export interface IRoom {
  description: ISimpleRoomDescription;
  height: number;
  wallPolygon: IPolygon2D;
  doors: IDoor[];
  windows: IWindow[];
  clone(): IRoom;
  area(): number;
}

export interface IFitting {
  position: IVector2D;
  orientation: number;
  fittingModel: IFittingModel;
}

export interface IFittingModel {
  listing: IListing;
  fittingCategory: FittingCategoryType;
  boundingBox: IBoundingBox3D;
  clearanceAreas: IClearanceArea[];
  halfDiagonal: number;
  fittingCategorySpatialSemantics: IFittingCategorySpatialSemantics;
}

export interface IBoundingBox3D {
  width: number;
  depth: number;
  height: number;
}

export interface IClearanceArea {
  side: SideType;
  perpendicularLength: number;
}

export type SideType = 'back' | 'front' | 'left' | 'right';
export const back: SideType = 'back';
export const front: SideType = 'front';
export const left: SideType = 'left';
export const right: SideType = 'right';

export interface IRoomSemantics {
  roomCategory: RoomCategoryType;
  fittingPriorities: IFittingPriority[];
}

export interface IFittingPriority {
  fittingCategory: FittingCategoryType;
  initialImportance: number;
  subsequentImportanceFactor: number;
}