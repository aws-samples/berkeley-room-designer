// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for defining our default fitting - or furniture placement - semantics.
// Go ahead and make your own, or adjust these!
import * as log from 'ts-app-logger';

import { findListing } from '../../berkeley-search/search';
import { IListing } from '../../room-designer/iface';

import { FittingCategoryType, IRoomCreationArgs, fittingCategories, roomCategories } from '../iface';

import { IFittingModels, IFittingModel } from './iface';
import { createFromListingAndSemantics } from './fitting-models';
import { fittingCategorySpatialSemantics, clearanceAreas, defaultClearanceAreas } from './fitting-semantics.default.spatial';
import * as roomSemantics from './fitting-semantics.default.room';

export const generateFittingSemantics = async (roomCreationArgs: IRoomCreationArgs): Promise<IFittingModels> => {
  log.debug('generateFittingSemantics');

  if (roomCreationArgs.furnitureSelectionType === 'matching search' && (!roomCreationArgs.furnitureSearchSelectionKeywords || roomCreationArgs.furnitureSearchSelectionKeywords.length === 0)) {
    throw Error('Fittings semantics for creating room configuration with matching search require roomCreationArgs.furnitureSearchSelectionKeywords');
  }

  // What fitting models we choose depend on how we want to search for berkeley.db listings.
  // Once we have listings based on search critera, we use their bounding box info to create the model we need to properly place the listing in a room.
  const fittingModels = roomCreationArgs.furniturePlacementType === 'random' ? await generateRandomFittingModels() : await generateMatchingSearchFittingModels(roomCreationArgs);

  const roomSemanticsByCategory: { [key: string]: CallableFunction; } = {
    'living room': roomSemantics.getLivingRoomSemantics,
    'dining room': roomSemantics.getDiningRoomSemantics, 
    'family room': roomSemantics.getFamilyRoomSemantics,
    'office': roomSemantics.getOfficeRoomSemantics,
    'bedroom': roomSemantics.getBedroomSemantics,
    'kitchen': roomSemantics.getKitchenRoomSemantics,
    'conference room': roomSemantics.getKitchenRoomSemantics,
    'generic': roomSemantics.getGenericRoomSemantics
  };

  return {
    fittingCategorySpatialSemantics,
    fittingModels,
    roomSemantics: roomCategories.map(roomCategory => {
      if (roomSemanticsByCategory[roomCategory]) { return roomSemanticsByCategory[roomCategory](); }
      
      return roomSemanticsByCategory.generic();
    })
  }
}


/** A fitting model here is a randomly selected listing from the berkeley.db for each fitting category, 
 *   which gives us bounding box info for semantics, then we tack on the constant clearance area semantics per-category. */
const generateRandomFittingModels = async (): Promise<IFittingModel[]> => {
  const fittingModels: Map<FittingCategoryType, IListing> = new Map<FittingCategoryType, IListing>();

  let listing: IListing | undefined;
  for (const fittingCategory of fittingCategories) { // For each type of category in berkeley.db, table, chair, sofa, rug, etc. ...
    if (fittingCategory.associatedKeywords && fittingCategory.associatedKeywords.length > 0) {
      for (const associatedKeyword of fittingCategory.associatedKeywords) {
        listing = await findListing({ searchText: fittingCategory.name, keyword: associatedKeyword });

        if (listing) { break; }
      }
    } else {
      listing = await findListing({ searchText: fittingCategory.name });
    }

    log.debug('got listing', listing);

    if (listing) { fittingModels.set(fittingCategory.name, listing); } else { log.warn(`No listing found to create fittingModel semantics for ${fittingCategory.name}`); }
  }

  return Array.from(fittingModels).map(([fittingCategory, listing]) => (
    createFromListingAndSemantics({
      listing,
      fittingCategory,
      boundingBox: { // Listing dimensions are in cm, furniture algorithms use meters (because that's what autointerior blog used), worht reconciling at some point.
        width: cmToMeters(listing.dimensions.width),
        depth: cmToMeters(listing.dimensions.depth),
        height: cmToMeters(listing.dimensions.height),
      },
      clearanceAreas: clearanceAreas.has(fittingCategory) ? clearanceAreas.get(fittingCategory)! : defaultClearanceAreas,
      fittingCategorySpatialSemantics: fittingCategorySpatialSemantics.get(fittingCategory)!
    })
  ));
}

/** A fitting model here is a selected listing from the berkeley.db which matches search text - say "mid-century" - for each fitting category, 
 *   which gives us bounding box info for semantics, then we tack on the constant clearance area semantics per-category. */
const generateMatchingSearchFittingModels = async (roomCreationArgs: IRoomCreationArgs): Promise<IFittingModel[]> => {
  const fittingModels: Map<FittingCategoryType, IListing> = new Map<FittingCategoryType, IListing>();
  
  let listing: IListing | undefined;
  for (const fittingCategory of fittingCategories) {
    for (const furnitureSearchSelectionKeyword of roomCreationArgs?.furnitureSearchSelectionKeywords!) {
      listing = await findListing({ searchText: fittingCategory.name, keyword: furnitureSearchSelectionKeyword });

      if (listing) { break; }
    }

    if (listing) { fittingModels.set(fittingCategory.name, listing); } else { log.warn(`No listing found to create fitting semantics for ${fittingCategory.name}`); }
  }

  return Array.from(fittingModels).map(([fittingCategory, listing]) => (
    createFromListingAndSemantics({
      listing,
      fittingCategory,
      boundingBox: { // Listing dimensions are in cm, furniture algorithms use meters (because that's what autointerior blog used), worht reconciling at some point.
        width: cmToMeters(listing.dimensions.width),
        depth: cmToMeters(listing.dimensions.depth),
        height: cmToMeters(listing.dimensions.height)
      },
      clearanceAreas: clearanceAreas.has(fittingCategory) ? clearanceAreas.get(fittingCategory)! : defaultClearanceAreas,
      fittingCategorySpatialSemantics: fittingCategorySpatialSemantics.get(fittingCategory)!
    })
  ));
}

const cmToMeters = (cm: number): number => {
  return cm / 100;
}