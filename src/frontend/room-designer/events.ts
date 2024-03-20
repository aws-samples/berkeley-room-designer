// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for defining events used by this component.
import { createEventDefinition } from 'ts-bus';

import { SaveTo } from '../iface';
import { IListing, IRoomDesignerListing } from './iface';

const eventPrefix = 'room-designer';
export const initOrReset = createEventDefinition<{ }>()(`${eventPrefix}.initOrReset`);
export const listingSelected = createEventDefinition<{ listing: IListing; }>()(`${eventPrefix}.listingSelected`);

export const importRoomFromYAML = createEventDefinition<{ yaml: string; fromPrompt: boolean; }>()(`${eventPrefix}.importRoomFromYAML`);

export const saveRoom = createEventDefinition<{ saveTo: SaveTo; dryRun: boolean; }>()(`${eventPrefix}.saveRoom`);

export const createRoom = createEventDefinition<{ }>()(`${eventPrefix}.createRoom`);

export const removeRoomListing = createEventDefinition<{ roomListing: IRoomDesignerListing; }>()(`${eventPrefix}.removeRoomListing`);

export const centerOnSelectedListing = createEventDefinition<{ }>()(`${eventPrefix}.centerOnSelectedListing`);
export const moveSelectedListingToOrigin = createEventDefinition<{ }>()(`${eventPrefix}.moveSelectedListingToOrigin`);
export const resetSelectedListingPosition = createEventDefinition<{ }>()(`${eventPrefix}.resetSelectedListingPosition`);