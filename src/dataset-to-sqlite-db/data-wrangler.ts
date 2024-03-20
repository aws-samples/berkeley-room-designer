// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for providing the data wranglin' utils to build the berkeley sqlite db.
// References: 
// * https://stackoverflow.com/questions/4328500/how-can-i-strip-all-punctuation-from-a-string-in-javascript-using-regex
// * https://www.geeksforgeeks.org/print-all-possible-combinations-of-r-elements-in-a-given-array-of-size-n/
import * as log from 'ts-app-logger';

import * as fs from 'fs';
import * as readline from 'readline';
import * as csvReader from 'csv-reader';

import { BackendDatabase } from '../backend/sqlite-search.backend';

import { fittingCategories, IFittingCategory } from '../frontend/furniture-placement/iface';

// Dataset URLs:
const aboDatasetPath = 'http://amazon-berkeley-objects.s3-website-us-east-1.amazonaws.com';

// Use this information to ignore non-furniture Berkeley data for now.
const ignoreListingWithProductTypes: string[] = [
  'PILLOW',
  'ACCESSORY_OR_PART_OR_SUPPLY',
  'AUTO_ACCESSORY',
  'OFFICE_PRODUCTS',
  'CANDLE_HOLDER',
  'BASKET',
  'BISS',
  'FLAT_SCREEN_DISPLAY_MOUNT',
  'HANDBAG',
  'FREESTANDING_SHELTER',
  'CONSUMER_ELECTRONICS',
  'WRITING_BOARD',
  'ELECTRONIC_CABLE',
  'CE_ACCESSORY',
  'DRINK_COASTER',
  'JANITORIAL_SUPPLY',
  'MOUSE_PAD',
  'JAR',
  'CELLULAR_PHONE_CASE',
  'ELECTRONIC_ADAPTER',
  'PAPER_PRODUCT',
  'PORTABLE_ELECTRONIC_DEVICE_MOUNT',
  'COMPUTER_ADD_ON',
  'PORTABLE_ELECTRONIC_DEVICE_COVER',
  'DRINKING_CUP',
  'FIGURINE',
  'JEWELRY_STORAGE',
  'WIRELESS_ACCESSORY',
  'BODY_POSITIONER',
  'PUMP_DISPENSER',
  'CARRYING_CASE_OR_BAG',
  'ANIMAL_COLLAR',
  'DISHWARE_BOWL',
  'FILE_FOLDER',
  'AIR_CONDITIONER'
];
const ignoreListingsWithKeywords: string[] = ['exercise mat', 'vase', 'throw pillows']; // If product_type isn't in listing data, ignore by keyword.

export class ModelsCache {
  data: I3DModel[] = [];

  async loadIntoMemory() {
    log.trace('ModelsCache.loadIntoMemory');

    const inputStream = fs.createReadStream(`${process.cwd()}/build-utils/data/3dmodels.csv`, 'utf8');

    const that = this;

    return new Promise((resolve, reject) => {
      inputStream
        .pipe(new csvReader.default({ headerLine: 1, parseNumbers: true, parseBooleans: true, trim: true }))
        .on('data', function (rawModelData: any[]) {
          //log.trace('rawModelData', rawModelData);

          try {
            const model = {
              id: rawModelData[0],
              path: rawModelData[1],
              meshes: rawModelData[2],
              materials: rawModelData[3],
              textures: rawModelData[4],
              images: rawModelData[5],
              image_height_max: rawModelData[6],
              image_height_min: rawModelData[7],
              image_width_max: rawModelData[8],
              image_width_min: rawModelData[9],
              vertices: rawModelData[10],
              faces: rawModelData[11],
              extent_x: rawModelData[12],
              extent_y: rawModelData[13],
              extent_z: rawModelData[14]
            };

            //log.trace('3dmodel id', model.id);
      
            that.data.push(model);
          } catch (error) {
            log.error('Failed to parse 3d model data', error);
      
            throw error;
          }
        })
        .on('end', resolve)
        .on('error', (error) => { reject(error); });
    });
  }
}

interface I3DModel {
  id: string;
  path: string;
  meshes?: number;
  materials?: number;
  textures?: number;
  images?: number;
  image_height_max?: number;
  image_height_min?: number;
  image_width_max?: number;
  image_width_min?: number;
  vertices?: number;
  faces?: number;
  extent_x?: number;
  extent_y?: number;
  extent_z?: number;
}

export class SmallImagesCache {
  data: ISmallImage[] = [];

  async loadIntoMemory() {
    log.trace('SmallImagesCache.loadIntoMemory');

    const inputStream = fs.createReadStream(`${process.cwd()}/build-utils/data/images.csv`, 'utf8');

    const that = this;

    return new Promise((resolve, reject) => {
      inputStream
        .pipe(new csvReader.default({ headerLine: 1, parseNumbers: true, parseBooleans: true, trim: true }))
        .on('data', function (rawSmallImageData: any[]) {
          //log.trace('rawSmallImageData', rawSmallImageData);

          try {
            const smallImage = {
              id: rawSmallImageData[0],
              height: rawSmallImageData[1],
              width: rawSmallImageData[2],
              path: rawSmallImageData[3]
            };

            //log.trace('smallImage id', smallImage.id);
      
            that.data.push(smallImage);
          } catch (error) {
            log.error('Failed to parse small image data', error);
      
            throw error;
          }
        })
        .on('end', resolve)
        .on('error', (error) => { reject(error); });
    });
  }
}

interface ISmallImage {
  id: string;
  path: string;
  height?: number;
  width?: number;
}

export class ModelPreviewsCache {
  data: IModelPreview[] = [];

  async loadIntoMemory() {
    log.trace('ModelPreviewsCache.loadIntoMemory');

    const inputStream = fs.createReadStream(`${process.cwd()}/build-utils/data/spins.csv`, 'utf8');

    const that = this;

    return new Promise((resolve, reject) => {
      inputStream
        .pipe(new csvReader.default({ headerLine: 1, parseNumbers: true, parseBooleans: true, trim: true }))
        .on('data', function (rawModelPreviewData: any[]) {
          //log.trace('rawModelPreviewData', rawModelPreviewData);

          try {
            const modelPreview = {
              id: rawModelPreviewData[0],
              azimuth: rawModelPreviewData[1],
              image_id: rawModelPreviewData[2],
              height: rawModelPreviewData[3],
              width: rawModelPreviewData[4],
              path: rawModelPreviewData[5]
            };

            //log.trace('modelPreview id', modelPreview.id);
      
            that.data.push(modelPreview);
          } catch (error) {
            log.error('Failed to parse model preview data', error);
      
            throw error;
          }
        })
        .on('end', resolve)
        .on('error', (error) => { reject(error); });
    });
  }
}

interface IModelPreview {
  id: string;
  path: string;
  image_id: string; // 00 - 71
  azimuth?: number;
  height?: number;
  width?: number;
}

export class ColorsCache {
  colors: string[] = [];

  serializeToTSModule() {
    log.trace('ColorsCache.serializeToTSModule');

    this.colors = [...new Set(this.colors)];

    const colorsModule = `// This file is generated! See ../../build-utils/build-berkeley-database.data.ts\n\nconst colors = ${JSON.stringify(this.colors)}; export { colors }`;

    fs.writeFileSync(`${process.cwd()}/src/frontend/berkeley-search/colors.ts`, colorsModule, 'utf-8');
  }
}

// Much like ../src/frontend/berkeley-search/colors.ts, we will save keywords to a ../src/frontend/berkeley-search/keywords.ts file.
// We can pull these keywords out of our search queries and improve search results this way.
// Also removing some keywords that conflict with certain listing names that make it harder to make our queries smarter.
export class KeywordsCache {
  keywords: string[] = [];

  serializeToTSModule() {
    log.trace('KeywordsCache.serializeToTSModule');

    this.keywords = [...new Set(this.keywords)];

    const keywordsModule = `// This file is generated! See ../../build-utils/build-berkeley-database.data.ts\n\nconst keywords = ${JSON.stringify(this.keywords)}; export { keywords }`;
    fs.writeFileSync(`${process.cwd()}/src/frontend/berkeley-search/keywords.ts`, keywordsModule, 'utf-8');
  }
}

export class Listings {
  private filePathWithVariableIndex = `${process.cwd()}/build-utils/data/listings_REPLACEME.json`;
  private fileIndexes = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];
  private listings: IListing[] = [];
  private modelsCache: ModelsCache;
  private smallImagesCache: SmallImagesCache;
  private modelPreviewsCache: ModelPreviewsCache;
  private colorsCache: ColorsCache;
  private keywordsCache: KeywordsCache;
  sqliteInsertStatements: string[] = [];

  constructor(
    modelsCache: ModelsCache, 
    smallImagesCache: SmallImagesCache, 
    modelPreviewsCache: ModelPreviewsCache, 
    colorsCache: ColorsCache,
    keywordsCache: KeywordsCache
  ) { 
    this.modelsCache = modelsCache; 
    this.smallImagesCache = smallImagesCache;
    this.modelPreviewsCache = modelPreviewsCache;
    this.colorsCache = colorsCache;
    this.keywordsCache = keywordsCache;
  }

  async convertToSqliteInsertStatements() {
    log.trace('Listings.convertToSqliteInsertStatements');

    for (const fileIndex of this.fileIndexes) {
      const filePath = this.filePathWithVariableIndex.replace('REPLACEME', fileIndex);

      await this.processRawListingsLineByLine(filePath);
    }

    const lengthBefore = this.listings.length;
    this.listings = dedupeListings(this.listings);// Some of the listings data is duplicated, so de-dupe.
    log.trace('listings data scrubbed, length now:', this.listings.length, 'length before:', lengthBefore);
    
    for await (const listing of this.listings) {
      const sqliteInsertStatement = Listing.toSqliteInsertStatement(listing);

      if (sqliteInsertStatement) { this.sqliteInsertStatements.push(sqliteInsertStatement); }
    }
  }

  private async processRawListingsLineByLine(filePath: string) {
    log.trace('Listings.processRawListingsLineByLine', filePath);

    const fileStream = fs.createReadStream(filePath);
  
    const rawListingsData = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    for await (const rawListingData of rawListingsData) {
      try {
        const listing = RawListing.parse(
          rawListingData, 
          this.modelsCache,
          this.smallImagesCache, 
          this.modelPreviewsCache, 
          this.colorsCache,
          this.keywordsCache,
          this.listings
        );

        if (typeof listing === 'string') {
          log.warn('Error adding listing:', listing);
        } else { this.listings.push(listing); }
      } catch (error) {
        log.error('Failed to parse raw listing', error);
  
        throw error;
      }
    }
  }
}

class RawListing {
  static parse(
    rawListingData: string, 
    modelsCache: ModelsCache, 
    smallImagesCache: SmallImagesCache, 
    modelPreviewsCache: ModelPreviewsCache,
    colorsCache: ColorsCache,
    keywordsCache: KeywordsCache,
    listings: IListing[]
  ): IListing | string {
    try {
      const listing = JSON.parse(rawListingData) as IListing;

      const modelData = modelsCache.data.find(someValue => someValue.id === listing.item_id);

      // Only deal in data that has 3D models.
      if (!modelData) { 
        return `No model data found for: ${listing.item_id}`; 
      }
      
      // Only deal in unique data.
      const existingRawListing = listings.find(someValue => someValue.item_id === listing.item_id);
      if (existingRawListing) { return `Listing ${listing.englishItemName} exists more than once in data, ignoring`; }

      listing.model = modelData;
      listing.downloadLinks = {
        modelUrl: `${aboDatasetPath}/3dmodels/original/${modelData.path}`
      };

      const colorsCSV: string[] = [];
      listing.color?.forEach(itemColor => {
        if (itemColor.value) { colorsCSV.push(itemColor.value.toLowerCase()); }
        if (itemColor.standardized_values) { colorsCSV.concat(itemColor.standardized_values.map(value => value.toLowerCase())); }
      });
      if (colorsCSV.length === 0) { 
        // Only deal in data that has defined colors. Needed for room generation lookup.
        return `No colors found for: ${listing.item_id}`;
      }

      // Track each color so we can use later to build a ../src/frontend/berkeley-search/colors.ts file to make search better.
      colorsCSV.forEach(color => { if (color) { colorsCache.colors.push(color); }});

      // Then collate colors into text so we can search on them easy.
      listing.colorsCSV = colorsCSV.join('|');

      const listingKeywords = listing.item_keywords?.filter(someValue => someValue.value).map(someValue =>  someValue.value?.toLowerCase());
      if (!listingKeywords) { 
        // Only deal in data that has some assigned keyword. Needed for room generation lookup.
        return `No keywords for: ${listing.item_id}`;
      }

      const englishKeyword = listing.item_keywords?.find(someValue => someValue.language_tag?.indexOf('en_') !== -1);
      if (!englishKeyword?.value) {
        // Only deal in listings with english keywords.
        return `No english keyword for: ${listing.item_id}`;
      }

      const englishItemName = listing.item_name.find(someValue => someValue.language_tag?.indexOf('en_') !== -1);
      if (!englishItemName?.value) {
        // Only deal in English listings for now.
        // Reasoning was to ensure dimensions are inches, but cm are in some English listings.
        // You might be OK to try non-English listings.
        return `No english-named listing found for: ${listing.item_id}`;
      }
      listing.englishItemName = englishItemName?.value;

      const ingoreBecauseOfProductType = listing.product_type?.find(value => {
        if (value.value && ignoreListingWithProductTypes.includes(value.value)) { return value; } 

        return;
      });

      if (ingoreBecauseOfProductType) {
        return `Ignoring listing due to ignored product type found: ${listing.item_id}`;
      }

      const ignoreBecauseOfKeyword = listingKeywords.find(keyword => {
        if (keyword && ignoreListingsWithKeywords.includes(keyword)) { return keyword; } 

        return;
      });

      if (ignoreBecauseOfKeyword) {
        return `Ignoring listing due to ignored keyword found: ${listing.item_id}`;
      }

      let listingName = englishItemName.value?.toLowerCase()!;
      listingName = listingName.replace(punctRE, ' ').replace(spaceRE, ' ');

      const nameTokens = listingName.split(' ');

      // Track each keyword so we can use later to build a ../src/frontend/berkeley-search/keywords.ts file to make search better.
      let fittingCategory: IFittingCategory | undefined;
      listingKeywords.forEach(keyword => { 
        if (keyword) {
          keywordsCache.keywords.push(keyword.toLowerCase()); 

          // Also use this opportunity to see if the listing's keywords match a known fitting category, e.g. couch, table, etc.
          if (!fittingCategory) {
            fittingCategory = fittingCategories.find(fittingCategory => {
              if (fittingCategory.name === keyword.toLowerCase()) { return fittingCategory; }
              if (fittingCategory.associatedKeywords?.includes(keyword.toLowerCase())) { return fittingCategory; }

              // Does word in listing name match fitting category name/keywords?
              if (nameTokens?.includes(fittingCategory.name)) { return fittingCategory; }
              if (fittingCategory.associatedKeywords?.some(keyword => nameTokens && nameTokens.indexOf(keyword) >= 0)) { return fittingCategory; }
              
              // Do sequences of words (1, 2 or 3 words) in listing name match fitting category "name matches"?
              const wordPairs = getAllCombinations(nameTokens, 2).map(_ => _.join(' '));
              const wordTriplets = getAllCombinations(nameTokens, 3).map(_ => _.join(' '));

              if (fittingCategory.nameMatches?.some(words => wordPairs.includes(words) || wordTriplets.includes(words) || nameTokens?.includes(words))) { return fittingCategory; }
  
              return;
            });
          }
        }
      });

      // As a last resort, try getting the listing fitting category from its product type.
      if (!fittingCategory) {
        listing.product_type?.find(value => {
          const productType = value.value;
          if (!productType) { return; }

          if (!fittingCategory) {
            fittingCategory = fittingCategories.find(fittingCategory => {
              if (fittingCategory.name === productType) { return fittingCategory; }
              if (fittingCategory.associatedProductTypes?.includes(productType)) { return fittingCategory; }

              return;
            });
          }

          return;
        });
      }

      if (!fittingCategory) { 
        log.error(`Fitting not categorized: ${listing.item_id}`, JSON.stringify(listing));

        return `No fitting category for: ${listing.item_id}`;
      }

      // Then collate keywords into text so we can search on them easy.
      listing.keywordsCSV = listingKeywords?.join('|');

      if (!listing.item_dimensions) {
        log.error(`No item_dimensions found for: ${listing.item_id}`, JSON.stringify(listing));

        // Only deal in data with dimensions.
        return `No dimensions found for: ${listing.item_id}`;
      }

      if (listing.item_dimensions?.length && listing.item_dimensions.width && listing.item_dimensions.height) {
        const length = normalizeDimensionToCm(listing.item_dimensions?.length.normalized_value.value, listing.item_dimensions?.length.normalized_value.unit);
        const width = normalizeDimensionToCm(listing.item_dimensions?.width.normalized_value.value, listing.item_dimensions?.width.normalized_value.unit);
        const height = normalizeDimensionToCm(listing.item_dimensions?.height.normalized_value.value, listing.item_dimensions?.height.normalized_value.unit);

        if (!length || !width || !height) {
          // Only deal in data with normalizable dimensions.
          return `Non-normalizable dimensions found for: ${listing.item_id}`;
        }

        listing.dimensionsCSV = `${length},${width},${height}`;
      } else {
        // Only deal in data with valid dimensions.
        return `Invalid dimensions found for: ${listing.item_id}`;
      }

      // This data is considered ancillary to the cause - nice to have, but not necessarily required to add to a room.
      const smallImageData = smallImagesCache.data.find(someValue => someValue.id === listing.main_image_id);
      if (smallImageData) {
        listing.downloadLinks.imageUrl = `${aboDatasetPath}/images/original/${smallImageData.path}`;
      }

      // These appear to always be in the range 00-71.
      const modelPreviewData = modelPreviewsCache.data.find(someValue => someValue.id === listing.spin_id && someValue.azimuth === 0);
      if (modelPreviewData) {
        listing.downloadLinks.modelPreviewUrl = `${aboDatasetPath}/spins/original/${modelPreviewData.path}`;
      }

      return listing;
    } catch (error) {
      log.error('Failed to parse raw listing', error);

      throw error;
    }
  }
}

class Listing {
  static toSqliteInsertStatement(listing: IListing): string | undefined {
    //log.trace('RawListingSqliteQuery.convertToInsertStatement', this.listing?.item_id);

    try {
      const sqliteInsertStatement = `
        insert into ${BackendDatabase.listingsTableName}(id, name, model_url, image_url, model_preview_url, keywords, colors, dimensions) values ('${listing.item_id}', '${listing.englishItemName.replace(/\'/g,"''")}', '${listing.downloadLinks?.modelUrl}', '${listing.downloadLinks?.imageUrl}', '${listing.downloadLinks?.modelPreviewUrl}', '${listing.keywordsCSV.replace(/\'/g,"''")}', '${listing.colorsCSV.replace(/\'/g,"''")}', '${listing.dimensionsCSV.replace(/\'/g,"''")}');
      `.trim();

      //log.trace(sqliteInsertStatement);

      return sqliteInsertStatement;
    } catch (error) {
      log.error('Failed to convert raw listing into sqlite insert statement', error);

      throw error;
    }
  }
}

interface IListing {
  color?: IColor[];
  item_dimensions?: {
    height?: IListingDimension;
    length?: IListingDimension;
    width?: IListingDimension;
  }
  brand?: IListingValueByLang;
  bullet_point?: IListingValueByLang[];
  item_id: string;
  item_name: IListingValueByLang[];
  product_type?: IListingValue[]; 
  main_image_id?: string;
  other_image_id?: string[];
  spin_id?: string;
  item_keywords?: IListingValueByLang[];
  country?: string;
  marketplace?: string;
  domain_name?: string;
  node?: INodeInfo[];

  colorsCSV: string;
  keywordsCSV: string;
  englishItemName: string;
  model: I3DModel;
  image: ISmallImage;
  downloadLinks?: {
    modelUrl?: string;
    imageUrl?: string;
    modelPreviewUrl?: string;
  },
  dimensionsCSV: string;
}

/*
Samples of what a listing data looks like for reference:
{
  "item_dimensions": {
    "height": {
      "normalized_value": {
        "unit": "inches", 
        "value": 2.5
      }, 
      "unit": "inches", 
      "value": 2.5
    }, 
    "length": {
      "normalized_value": {
        "unit": "inches", 
        "value": 9
      }, 
      "unit": "inches", 
      "value": 9
    }, 
    "width": {
      "normalized_value": {
        "unit": "inches", 
        "value": 6.75
      }, 
      "unit": "inches", 
      "value": 6.75
    }
  }, 

  or 

  "item_dimensions": {
    "height": {
      "normalized_value": {
        "unit": "inches",
        "value": 39.3700787
      },
      "unit": "centimeters",
      "value": 100
    },
    "length": {
      "normalized_value": {
        "unit": "inches",
        "value": 43.30708657
      },
      "unit": "centimeters",
      "value": 110
    },
    "width": {
      "normalized_value": {
        "unit": "inches",
        "value": 18.110236202
      },
      "unit": "centimeters",
      "value": 46
    }
  },

  or

  "brand": [
    {"language_tag": "en_US", "value": "Fresh"}
  ], 
  "bullet_point": [
    {"language_tag": "en_US", "value": "10.3-ounce package of 12 wild blueberry miniature muffins"}, 
    {"language_tag": "en_US", "value": "Naturally and artificially flavored"}, 
    {"language_tag": "en_US", "value": "Kosher Dairy Certified"}, 
    {"language_tag": "en_US", "value": "Contains wheat, milk, and eggs"}, 
    {"language_tag": "en_US", "value": "May contain soy and tree nuts"}, 
    {"language_tag": "en_US", "value": "Our Fresh brand products are all about high-quality food that fits every budget, every day."}
  ], 
  "item_id": "B0841RDVFS", 
  "item_name": [
    {"language_tag": "en_US", "value": "Fresh Brand \u2013 Wild Blueberry Mini Muffins, 10.3 oz (12 ct)"}
  ], 
  "product_type": [
    {"value": "CAKE"}
  ], 
  "main_image_id": "81h1YmBrYNL", 
  "other_image_id": ["31K2Pzp9wQL", "91TRNQeE4oL", "81mdJIrdA9L", "810SUMV7OWL", "515aRgGp5mL"],
  "item_keywords": [
    {"language_tag": "en_US", "value": "muffins"}, 
    {"language_tag": "en_US", "value": "mini muffins"}, 
    {"language_tag": "en_US", "value": "blueberry muffins"}, 
    {"language_tag": "en_US", "value": "kosher"}, 
    {"language_tag": "en_US", "value": "kosher muffins"}, 
    {"language_tag": "en_US", "value": "breakfast"}, 
    {"language_tag": "en_US", "value": "Fresh"}, 
    {"language_tag": "en_US", "value": "bakery"}, 
    {"language_tag": "en_US", "value": "Fresh Brand"}, 
    {"language_tag": "en_US", "value": "blueberry"}, 
    {"language_tag": "en_US", "value": "mini blueberry muffins"}, 
    {"language_tag": "en_US", "value": "kosher food"}, 
    {"language_tag": "en_US", "value": "muffin"}, 
    {"language_tag": "en_US", "value": "blueberries"}, 
    {"language_tag": "en_US", "value": "blueberries fresh"}, 
    {"language_tag": "en_US", "value": "muffins bakery"}, 
    {"language_tag": "en_US", "value": "fresh brand muffins"}
  ], 
  "country": "US", 
  "marketplace": "Amazon", 
  "domain_name": "amazon.com", 
  "node": [
    {"node_id": 18770271011,  "node_name": "/Categories/Breads & Bakery/Pastries & Bakery/Muffins"}
  ]
}
*/

interface IColor {
  language_tag?: string;
  standardized_values?: string[];
  value?: string;
}

interface IListingDimension {
  normalized_value: {
    unit: string; // Always in inches we think
    value: number;
  }
  unit: string;
  value: number;
}

interface IListingValueByLang {
  language_tag?: string;
  value?: string;
}

interface IListingValue {
  value?: string;
}

interface INodeInfo {
  node_id?: string;
  node_name?: string;
}

const dedupeListings = (source: any): Array<any> => {
  if (!Array.isArray(source)) { return []; }

  return [...new Set(source.map(o => {
    const sortedObjectKeys = Object.keys(o).sort();
    const obj = Object.assign({}, ...sortedObjectKeys.map(k => ({[k]: o[k]})) as any);
    return JSON.stringify(obj);
  }))].map(s => JSON.parse(s));
}

const punctRE = /[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,\-.\/:;<=>?@\[\]^_`{|}~]/g;
const spaceRE = /\s+/g;

const getAllCombinations = (arr: string[], r: number): Array<Array<string>> => {
  const combos: Array<Array<string>> = [];
  combinationUtil(combos, arr, arr.length, r, 0, new Array(r), 0);

  return combos;
}

const combinationUtil = (combos: Array<Array<string>>, arr: string[], n: number, r: number, index: number, data: string[], i: number) => {
  const combo = [];

  if (index == r) {
    for (let j=0; j < r; j++) { combo.push(data[j].toLowerCase()); }

    combos.push(combo);

    return;
  }
    
  if (i >= n) { return; }
    
  data[index] = arr[i];

  combinationUtil(combos, arr, n, r, index+1, data, i+1);

  combinationUtil(combos, arr, n, r, index, data, i+1);
}

const normalizeDimensionToCm = (value: number, unit: string): number | undefined => {
  if (unit === 'inches') { return Number(value) * 2.54; }

  return;
}