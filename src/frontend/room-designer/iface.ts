// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
import { IExport } from '../iface';

// The room configuration format (for import and export).
// This maps to OpenAPI backend definition in ../../backend/openapi-def/room-configuration.schema.yaml and is duplicated there.
export interface IRoomConfiguration {
  id: string;
  imported_room_configuration?: string; // Track original import as JSON string.
  prompt?: string; // llm furniture placement algorithms will have an associated prompt.
  name?: string;
  area_size_x: number;
  //area_size_y: number;
  area_size_z: number;
  // While this app currently deals in Berkeley dataset "listings" (dataset nomenclature), 
  //  room objects can be anything so long as the app knows how to translate them into 2D/3D.
  objects: IRoomObject[];
}

export interface IRoomObject {
  id: string; // This is a unique id we create once that, if room listing, is same as room listing id.
  model_id?: string; // Prompt output will not include model_id. We'll have to buest-guess search.
  model_location?: 'berkeley'; // Prompt output will not include model_location. We'll default to berkeley.
  //uniqueId?: number; // This is used to keep track of a room listing's mesh after import.
  name: string;
  category: string;
  colors?: string[];
  x: number;
  y: number;
  z: number;
  orientation: number;
}

// The listing format as placed in a room (used by the room designer component).
export interface IRoomDesignerListing {
  id: string; // This is a unique id we create once.
  renderId: number; // In 3D, this is a "uniqueId" for a mesh as denoted by the rendering library. Ephemeral.
  listing: IListing;
  importedRoomObject?: IRoomObject; // A listing was defined in YAML already.
  meshPositionState: IMeshPositionState;
}

// The "raw" listing format as specified by our sqlite db generator.
export interface IListing {
  id: string; // This is the berkeley dataset id.
  name: string;
  modelDownloadUrl: string;
  imageUrl?: string;
  modelPreviewUrl?: string;
  keywords: string;
  colors: string;
  dimensions: { // In meters.
    width: number;
    depth: number;
    height: number;
  };

  searchText?: string; // Add searchText we found listing from as well.
  inFlightId?: string; // Track and render before listing is added to a room.
}

// Room listing data as required the room designer in renderer units.
export interface IMeshPositionState {
  distanceFromRoomOrigin: {
    x: number;
    y: number;
    z: number;
  };
  rotation: number;
}

// Import/export formats.
export interface IExportMeshPositionState {
  distanceFromRoomOriginInCm: {
    x: number;
    y: number;
    z: number;
  };
  rotationInDegrees: number;
}

export type View = '3D'; // '2D' was removed since it wasn't finished.

export type CameraView = 'front' | 'back' | 'left' | 'right';

export type CameraChangeDirection = 'up' | 'down';

export type FurniturePlacementType = 'llm' | 'random' | 'autointeriorblog'; // 'rules' was removed.

export type FurnitureSelectionType = 'random' | 'matching search';

export interface IRoomData {
  exportedRoom: IExport;
  roomConfiguration: IRoomConfiguration;
}