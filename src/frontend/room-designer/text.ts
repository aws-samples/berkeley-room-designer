// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for defining user-facing text used in notifications.
import { ISearchQuery } from '../berkeley-search/iface';
import { serializeError } from 'serialize-error';
import { IListing } from './iface';

export const generatingRoomConfig = 'Generating room configuration.';
export const downloadingModelsForGeneratedRoom = 'Downloading models for generated room configuration.';
export const downloadingModelsForImportedRoom = 'Downloading models for imported room configuration.';
export const llmError = 'LLM error, unable to generate room configuration.';
export const invalidYamlSupplied = 'Invalid YAML supplied, unable to import room configuration.';
export const exportedRoomOK = 'Exported room.'
export const savedRoomOK = 'Saved room.';
export const deletedRoomOK = 'Deleted room configuration OK.';
export const willNotImportPromptObject = (searchQuery: ISearchQuery) => {
  return `Will not import object defined by prompt, can not find Berkeley listing which matches ${searchQuery.searchTokens?.join(' ')} ${searchQuery.color} ${searchQuery.keyword}`;
}
export const failedToImportRoomFromYaml = (error: any): string => { return `Failed to import room from yaml: ${JSON.stringify(serializeError(error))}.`; }
export const failedToExportRoom = (error: any): string => { return `Failed to export room: ${JSON.stringify(serializeError(error))}.`; }
export const failedToSaveRoom = (error: any): string => { return `Failed to save room: ${JSON.stringify(serializeError(error))}.`; }
export const noListingsFoundForSearch = (error: any): string => { return `Error finding listing which matches search: ${JSON.stringify(serializeError(error))}.`; }
export const failedToAddListingToRoom = (listing: IListing, error: any): string => { return `Failed to add listing to room: ${listing.name}, ${JSON.stringify(serializeError(error))}.`; }
export const failedToGenerateRoom = (error: any): string => { return serializeError(error).message || 'Failed to generate room.'; }