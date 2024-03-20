// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for defining fitting model utilities.
import { IListing } from '../../room-designer/iface';

import { FittingCategoryType } from '../iface';

import { IFittingModel, IBoundingBox3D, IClearanceArea, IFittingCategorySpatialSemantics } from './iface';

export const createFromListingAndSemantics = (args: { listing: IListing, fittingCategory: FittingCategoryType, boundingBox: IBoundingBox3D, clearanceAreas: IClearanceArea[], fittingCategorySpatialSemantics: IFittingCategorySpatialSemantics }): IFittingModel => {
  if (args.clearanceAreas.length !== 4) { throw Error('There should be 4 clearance areas!'); }
  return { listing: args.listing, fittingCategory: args.fittingCategory, boundingBox: args.boundingBox, clearanceAreas: args.clearanceAreas, halfDiagonal: calculateHalfDiagonol(args.boundingBox), fittingCategorySpatialSemantics: args.fittingCategorySpatialSemantics };
}

const calculateHalfDiagonol = (boundingBox: IBoundingBox3D): number => {
  return Math.sqrt(boundingBox.depth * boundingBox.depth + boundingBox.width * boundingBox.width) / 2;
}

export const baseArea = (fittingModel: IFittingModel): number => {
  return fittingModel.boundingBox.width * fittingModel.boundingBox.depth;
}