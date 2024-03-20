#! node
// This file is responsible for building the berkeley sqlite db.
import '../node-globals';
globalThis.app_location = process.env.app_location || 'local';

import * as log from 'ts-app-logger';
log.configure({ traceEnabled: globalThis.app_location !== 'aws' , debugEnabled: true, filters: [] });

import { BackendDatabase } from '../backend/sqlite-search.backend';

import { Listings, ModelsCache, SmallImagesCache, ModelPreviewsCache, KeywordsCache, ColorsCache } from './data-wrangler';

let database;
try {
  const modelsCache = new ModelsCache();
  await modelsCache.loadIntoMemory();
  //log.debug(modelsCache.modelData);

  const smallImagesCache = new SmallImagesCache();
  await smallImagesCache.loadIntoMemory();
  //log.debug(smallImagesCache.data);

  const modelPreviewsCache = new ModelPreviewsCache();
  await modelPreviewsCache.loadIntoMemory();
  //log.debug(modelPreviewsCache.data);

  const colorsCache = new ColorsCache();
  const keywordsCache = new KeywordsCache();

  const listings = new Listings(
    modelsCache, 
    smallImagesCache, 
    modelPreviewsCache,
    colorsCache,
    keywordsCache
  );
  await listings.convertToSqliteInsertStatements();
  //log.debug(listings.sqliteInsertStatements);

  database = new BackendDatabase();

  await database.connect();
  await database.createSearchTables();
  await database.optimize();
  await database.insertListings(listings.sqliteInsertStatements);
  await database.optimize();

  // Build 2 TypeScript files to use for building dataset sql search queries from user search (manual furniture placement) or furniture placement algorithms.
  colorsCache.serializeToTSModule();
  keywordsCache.serializeToTSModule();
} catch (error) {
  log.error('Failed to build db', error);

  database?.destroy();
}