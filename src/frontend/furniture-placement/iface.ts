// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for defining interfaces used in multiple furniture placement algorithms.
import { FurniturePlacementType, FurnitureSelectionType, IRoomConfiguration } from '../room-designer/iface';

import { IFittingLayout } from './autointeriorblog/iface';

export interface IPolygon2D {
  edgePositions: IVector2D[];
}

export interface IDoor {
  position: IVector2D;
  widthInMeters: number;
  inwardsNormal: number;
}

export interface IWindow {
  position: IVector2D;
  widthInMeters: number;
  inwardsNormal: number;
}

export interface IVector2D {
  x: number;
  z: number;
}

export interface IVector3D {
  x: number;
  z: number;
  y: number;
}

export interface ISimpleRoomDescription {
  widthInMeters: number; 
  depthInMeters: number; 
  heightInMeters: number; 
  roomCategory: RoomCategoryType;
}

export const roomCategories: RoomCategoryType[] = [
  'living room', 'dining room', 'family room', 'office', 'bedroom', 'kitchen', 'conference room', 'generic'
];
export type RoomCategoryType = 'living room' | 'dining room' | 'family room' | 'office' | 'bedroom' | 'kitchen' | 'conference room' | 'generic';

export interface IVisualizer {
  tryRender(objectToVisualize: ISimpleRoomDescription | IFittingLayout | IRoomConfiguration, name: string): void;
}

export interface IRoomCreationArgs {
  roomDescription: ISimpleRoomDescription;
  fillTarget: number; // percentage, .3 etc. FIXME Typing for range between 0 < fillTarget < 1 .
  furniturePlacementType: FurniturePlacementType; 
  furnitureSelectionType: FurnitureSelectionType;
  furnitureSearchSelectionKeywords?: string[]; // If furnitureSelectionType === "matching search".
  visualizer?: IVisualizer;
}

// Fitting categories define how the berkeley database is related to fitting algorithms,
//  and also gives hints as to how to place a listing categorized as such in a room.
// When berkeley.db is built from the dataset, every record stored is given a category below
//  based on the what text is in the listing's name, or what associated keywords it has.
export const fittingCategories: IFittingCategory[] = [
  // rugs
  {
    name: 'rug',
    associatedKeywords: ['rug'],
    fittingPlacementLocation: 'floor',
    fittingPlacementType: 'on'
  },

  // lighting
  {
    name: 'floor light',
    associatedKeywords: ['floor lamp'],
    fittingPlacementLocation: 'floor',
    fittingPlacementType: 'on'
  },
  {
    name: 'wall light',
    associatedKeywords: ['wall lamp', 'table lamp', 'pendant'],
    fittingPlacementLocation: 'wall',
    fittingPlacementType: 'on'
  },
  {
    name: 'ceiling light',
    associatedKeywords: ['chandelier'],
    fittingPlacementLocation: 'ceiling',
    fittingPlacementType: 'on'
  },
  {
    name: 'light',
    associatedKeywords: ['desk lamp', 'table lamp'],
    fittingPlacementLocation: 'fitting',
    fittingPlacementType: 'on'
  },

  // seating
  {
    name: 'chair',
    associatedKeywords: ['chairs'],
    fittingPlacementLocation: 'floor',
    fittingPlacementType: 'on'
  },
  {
    name: 'sofa',
    associatedKeywords: ['sofas', 'loveseat', 'sectional'],
    fittingPlacementLocation: 'floor',
    fittingPlacementType: 'on'
  },
  {
    name: 'armchair',
    associatedKeywords: ['recliner'],
    fittingPlacementLocation: 'floor',
    fittingPlacementType: 'on',
  },
  {
    name: 'patio chair',
    associatedKeywords: [],
    nameMatches: ['patio seat'],
    fittingPlacementLocation: 'floor',
    fittingPlacementType: 'on',
  },
  {
    name: 'stool',
    associatedKeywords: ['bar stool'],
    nameMatches: ['barstool'],
    fittingPlacementLocation: 'floor',
    fittingPlacementType: 'on',
  },
  {
    name: 'ottoman',
    associatedKeywords: [],
    fittingPlacementLocation: 'floor',
    fittingPlacementType: 'on',
  },
  {
    name: 'bench',
    associatedKeywords: [],
    fittingPlacementLocation: 'floor',
    fittingPlacementType: 'on'
  },

  // mirrors
  {
    name: 'mirror',
    associatedKeywords: [],
    fittingPlacementLocation: 'wall',
    fittingPlacementType: 'on',
  },
  
  // sleeping
  {
    name: 'bed',
    associatedKeywords: ['beds'],
    fittingPlacementLocation: 'floor',
    fittingPlacementType: 'on'
  },
  {
    name: 'headboard',
    associatedKeywords: [],
    fittingPlacementLocation: 'wall',
    fittingPlacementType: 'on'
  },

  // storage
  {
    name: 'wardrobe',
    associatedKeywords: [],
    fittingPlacementLocation: 'floor',
    fittingPlacementType: 'on'
  },
  {
    name: 'dresser',
    associatedKeywords: ['bedside dresser'],
    nameMatches: ['chest of drawers'],
    fittingPlacementLocation: 'floor',
    fittingPlacementType: 'on'
  },
  {
    name: 'bookcase',
    associatedKeywords: [],
    fittingPlacementLocation: 'floor',
    fittingPlacementType: 'on'
  },
  {
    name: 'vanity',
    associatedKeywords: [],
    fittingPlacementLocation: 'floor',
    fittingPlacementType: 'on'
  },
  {
    name: 'desk',
    associatedKeywords: [],
    fittingPlacementLocation: 'floor',
    fittingPlacementType: 'on'
  },
  {
    name: 'cupboard',
    associatedKeywords: [],
    fittingPlacementLocation: 'floor',
    fittingPlacementType: 'on'
  },
  {
    name: 'media cabinet',
    associatedKeywords: [],
    nameMatches: ['media cabinet', 'mid-century console', 'tv cabinet'],
    fittingPlacementLocation: 'floor',
    fittingPlacementType: 'on'
  },
  {
    name: 'kitchen cart',
    associatedKeywords: [],
    fittingPlacementLocation: 'floor',
    fittingPlacementType: 'on'
  },
  {
    name: 'chest',
    associatedKeywords: [],
    nameMatches: ['movian lagan chest'],
    fittingPlacementLocation: 'floor',
    fittingPlacementType: 'on'
  },

  {
    name: 'wall shelving unit',
    associatedKeywords: [],
    nameMatches: ['hanging wall shelf'],
    fittingPlacementLocation: 'wall',
    fittingPlacementType: 'on'
  },
  {
    name: 'shelving unit',
    associatedKeywords: ['shelf'],
    nameMatches: ['shelving unit', 'tv stand'],
    fittingPlacementLocation: 'floor',
    fittingPlacementType: 'on'
  },
  
  // tables
  {
    name: 'table',
    associatedKeywords: ['buffet table'],
    fittingPlacementLocation: 'floor',
    fittingPlacementType: 'on'
  },
  {
    name: 'side table',
    associatedKeywords: ['end tables'],
    nameMatches: ['corona sideboard'],
    fittingPlacementLocation: 'floor',
    fittingPlacementType: 'on'
  },
  {
    name: 'coffee table',
    associatedKeywords: [],
    fittingPlacementLocation: 'floor',
    fittingPlacementType: 'on'
  },
  {
    name: 'night stand',
    associatedKeywords: [],
    nameMatches: ['night stand'],
    fittingPlacementLocation: 'floor',
    fittingPlacementType: 'on'
  },

  // plants
  {
    name: 'floor planter',
    associatedKeywords: [],
    fittingPlacementLocation: 'floor',
    fittingPlacementType: 'on'
  },
  {
    name: 'wall planter',
    associatedKeywords: [],
    fittingPlacementLocation: 'wall',
    fittingPlacementType: 'on'
  },
  {
    name: 'planter',
    associatedKeywords: [],
    nameMatches: ['planter'],
    fittingPlacementLocation: 'fitting',
    fittingPlacementType: 'on'
  },

  // fans
  {
    name: 'ceiling fan',
    associatedKeywords: [],
    nameMatches: ['ceiling fan'],
    fittingPlacementLocation: 'ceiling',
    fittingPlacementType: 'on'
  },

  // clocks
  {
    name: 'wall clock',
    associatedKeywords: [],
    fittingPlacementLocation: 'wall',
    fittingPlacementType: 'on'
  },

  // live laugh love ;D
  {
    name: 'wall art',
    associatedKeywords: ['poster'],
    nameMatches: ['flag display case', 'shutter wall art'],
    fittingPlacementLocation: 'wall',
    fittingPlacementType: 'on'
  },
  {
    name: 'picture frame',
    associatedKeywords: [],
    fittingPlacementLocation: 'fitting',
    fittingPlacementType: 'on'
  }
];

export interface IFittingCategory {
  name: FittingCategoryType;
  associatedKeywords?: string[];
  associatedProductTypes?: string[];
  nameMatches?: string[];
  fittingPlacementLocation: FittingPlacementLocation;
  fittingPlacementType: FittingPlacementType;
}

export type FittingCategoryType = FittingCategoryRug | FittingCategoryLighting | FittingCategoryChair | FittingCategoryMirror | FittingCategorySleeping | FittingCategoryStorage | FittingCategoryTable | FittingCategoryPlanter | FittingCategoryFan | FittingCategoryClock | FittingCategoryArt;

export type FittingCategoryRug = 'rug';
export type FittingCategoryLighting  = 'floor light' | 'wall light' | 'ceiling light' | 'light';
export type FittingCategoryChair = 'chair' | 'sofa' | 'armchair' | 'patio chair' | 'stool' | 'ottoman' | 'bench';
export type FittingCategoryMirror = 'mirror';
export type FittingCategorySleeping = 'bed' | 'headboard';
export type FittingCategoryStorage = 'wardrobe' | 'dresser' | 'bookcase' | 'vanity' | 'desk' | 'cupboard' | 'media cabinet' | 'chest' | 'wall shelving unit' | 'shelving unit' | 'kitchen cart';
export type FittingCategoryTable = 'table' | 'side table' | 'coffee table' | 'night stand';
export type FittingCategoryPlanter = 'floor planter'| 'wall planter' | 'planter';
export type FittingCategoryFan = 'ceiling fan';
export type FittingCategoryClock = 'wall clock';
export type FittingCategoryArt = 'wall art' | 'picture frame';

export type FittingPlacementLocation = 'floor' | 'wall' | 'ceiling' | 'fitting';
export type FittingPlacementType = 'in' | 'on' | 'side' | 'front' | 'back';