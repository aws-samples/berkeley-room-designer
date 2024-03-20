// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
import { ISearchQuery } from './berkeley-search/iface';

import { CameraView, FurniturePlacementType, FurnitureSelectionType, IListing, IRoomDesignerListing, IRoomConfiguration, View } from './room-designer/iface';

// App state that we persist in local storage during editing.
export interface IAppState {
  furniturePlacementType: FurniturePlacementType; 
  furnitureSelectionType: FurnitureSelectionType;

  // WIP configurations:
  roomName?: string;
  prompt?: string;
  inFlightListings: string[];
  roomListings: IRoomDesignerListing[];
  currentRoomConfiguration?: IRoomConfiguration; // For WIP state of new room configurations.
}

// App context starts fresh on page load.
export interface IAppContext {
  thinkingCount: number;
  downloadCount: number;
  userMessages: IMessageToUser[];
  view: View;
  cameraView: CameraView;
  cameraHeightOffset: number;
  searchListings?: IListing[];
  selectedRoomListing?: IRoomDesignerListing;
  selectedRoomConfiguration?: IRoomConfiguration;
  exportPreview?: string;
}

export interface IMessageToUser {
  text: string;
  error: boolean;
  date?: Date;
}

export type SaveTo = 'disk' | 'app';

export interface IExport {
  exportName: string;
  yaml: string;
}

export interface ISaveArgs {
  dryRun: boolean;
  saveTo: SaveTo;
  fileNameNoExtension: string;
}

export interface IBerkeleySearch {
  init(): Promise<void>;
  search(searchQuery: ISearchQuery): Promise<IListing[] | undefined>;
}