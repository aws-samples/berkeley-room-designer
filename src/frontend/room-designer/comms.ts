// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for providing event emitters for the room designer.
import { bus } from '../comms';
import { SaveTo } from '../iface';

import {  IListing, IRoomDesignerListing } from './iface';
import * as roomEvents from './events';

export const emitInitOrResetEvent = () => {
  bus.publish(roomEvents.initOrReset({}));
}
export const emitListingSelectedEvent = (listing: IListing) => {
  bus.publish(roomEvents.listingSelected({ listing }));
}

export const emitImportRoomFromYamlEvent = (yaml: string, fromPrompt: boolean) => {
  bus.publish(roomEvents.importRoomFromYAML({ yaml, fromPrompt }));
}
export const emitSaveRoomEvent = (saveTo: SaveTo, dryRun: boolean) => {
  bus.publish(roomEvents.saveRoom({ saveTo, dryRun }));
}

export const createRoomEvent = () => {
  bus.publish(roomEvents.createRoom({}));
}

export const emitRemoveRoomListingEvent = (roomListing: IRoomDesignerListing) => {
  bus.publish(roomEvents.removeRoomListing({ roomListing }));
}

export const emitCenterOnSelectedListingEvent = () => {
  bus.publish(roomEvents.centerOnSelectedListing({ }));
}
export const emitMoveSelectedListingToOriginEvent = () => {
  bus.publish(roomEvents.moveSelectedListingToOrigin({ }));
}
export const emitResetListingToImportedEvent = () => {
  bus.publish(roomEvents.resetSelectedListingPosition({ }));
}