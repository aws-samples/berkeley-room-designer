// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for providing a search utility for all the types of searches we do on the dataset in the application.
import * as log from 'ts-app-logger';

import { appContext } from '../context';

import {  getSearchQueryFromStatement, listingsTableName, searchQueryBuilder } from './sql-helper';
import { IListing, IRoomObject } from '../room-designer/iface';
import { IRoomObjectSearch } from './iface';

/** Makes a search initially to get some data cached in CloudFront if on AWS. */
export const cacheDbPages = async () => {
  try {
    const searchQuery = getSearchQueryFromStatement(`select * from ${listingsTableName} limit 1000)`);

    // May be frontend or backend sqlite-search impl.
    await globalThis.berkeleySearch.search(searchQuery);
  } catch (error) { // Should not hit this path.
    log.error('Error caching database pages', error);
  }
}

/** Gets a known listing in the dataset (UI). */
export const getListing = async (importedRoomObject: IRoomObject): Promise<IListing | undefined> => {
  let errored = false;
  
  try {
    appContext.incrementThinkingCount();

    const searchQuery = getSearchQueryFromStatement(`select * from ${listingsTableName} where (id = '${importedRoomObject.model_id}')`);

    // May be frontend or backend sqlite-search impl.
    const listings = await globalThis.berkeleySearch.search(searchQuery);
    
    if (!listings || listings.length === 0) {
      errored = true;

      return;
    }

    const listing = listings[0]; // Should only be one listing.
    
    return listing;
  } catch (error) { // Should not hit this path.
    log.error('No search results found for listing', importedRoomObject);

    errored = true;
  } finally {
    appContext.decrementThinkingCount();

    if (errored) { 
      appContext.notifyUser({ text: 'Could not find object for some reason', error: true });
    }
  }

  return;
}

/** Tries to find a listing in the dataset. */
export const findListing = async (roomObjectSearch: IRoomObjectSearch): Promise<IListing | undefined> => {
  const listings = await findListings(roomObjectSearch);

  // Return a randomly selected listing which matches search criteria.
  if (listings && listings.length > 0) { return listings[Math.floor((Math.random() * listings.length))]; }

  return;
}

/** Tries to find listings in the dataset. */
export const findListings = async (roomObjectSearch: IRoomObjectSearch): Promise<IListing[] | undefined> => {
  let errored = false;
  
  try {
    appContext.incrementThinkingCount();

    const searchQuery = searchQueryBuilder(roomObjectSearch.searchText, { color: roomObjectSearch?.color, keyword: roomObjectSearch?.keyword });

    // May be frontend or backend sqlite-search impl.
    const listings = await globalThis.berkeleySearch.search(searchQuery);
    
    if (!listings || listings.length === 0) {
      errored = true;

      return;
    }

    return listings;
  } catch (error) {
    log.error('Could not find listing which matches search.', roomObjectSearch.searchText);

    errored = true;
  } finally {
    appContext.decrementThinkingCount();

    if (errored) {
      appContext.notifyUser({ text: 'Could not find listing which matches search.', error: true });
    }
  }

  return;
}