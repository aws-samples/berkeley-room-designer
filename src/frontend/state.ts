// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for providing a way to store state (and broadcast changes) that persists on reload and across component lifecycle.
// This is not the same as context, which only lives for the lifecycle of a component and its children (ephemeral).
// State is just a single window object created during first "import" .
// On initialization, if local storage data exists, the window object is set to that.
// After initialization, the window object always stored in local storage after being updated.
import * as log from 'ts-app-logger';
import ls from 'localstorage-slim';

import { IAppState } from './iface';
import { IRoomConfiguration, FurniturePlacementType, FurnitureSelectionType, IRoomDesignerListing } from './room-designer/iface';

const defaultAppState: IAppState = { 
  furniturePlacementType: 'llm', 
  furnitureSelectionType: 'matching search', 
  inFlightListings: [],
  roomListings: [] 
};

export class AppState {
  private subscribers: Map<number, CallableFunction> = new Map<number, CallableFunction>();

  constructor() { this.get(); }

  get(): IAppState {
    const state = ls.get('state') as IAppState;
    log.debug('AppState.get', 'state', state);

    if (!state) { 
      this.update({ ...defaultAppState }); // Broadcasts default state udpate.
      
      return this.get(); 
    }

    return state;
  }

  update(state: IAppState) { 
    log.debug('AppState.update', 'state', state);

    ls.set('state', state); 

    for (const subscriber of this.subscribers.values()) {
      subscriber(state);
    }
  }

  subscribe(subscriber: CallableFunction): number {
    const subscriberId = this.subscribers.size + 1;
    this.subscribers.set(subscriberId, subscriber);

    return subscriberId;
  }

  unsubscribe(subscriberId: number) { this.subscribers.delete(subscriberId); }

  setFurniturePlacementType(furniturePlacementType: FurniturePlacementType) {
    log.debug('AppState.setFurniturePlacementType', furniturePlacementType);

    const state = this.get();
    state.furniturePlacementType = furniturePlacementType;

    this.update(state);
  }

  setFurnitureSelectionType(furnitureSelectionType: FurnitureSelectionType) {
    log.debug('AppState.setFurnitureSelectionType', furnitureSelectionType);

    const state = this.get();
    state.furnitureSelectionType = furnitureSelectionType;

    this.update(state);
  }

  setRoomName(roomName: string | undefined) {
    log.debug('AppState.setRoomName', roomName);

    const state = this.get();
    state.roomName = roomName;

    this.update(state);
  }

  setPrompt(prompt: string) {
    log.debug('AppState.setPrompt', prompt);

    const state = this.get();
    state.prompt = prompt;

    this.update(state);
  }

  addInFlightRoomListing(listingId: string) {
    const state = this.get();

    state.inFlightListings.push(listingId);

    this.update(state);
  }

  removeInFlightRoomListing(listingId: string) {
    const state = this.get();

    const inFlightListings = state.inFlightListings.filter(inFlightListing => inFlightListing !== listingId);
    state.inFlightListings = inFlightListings;

    this.update(state);
  }

  upsertRoomListing(roomListing: IRoomDesignerListing) {
    const state = this.get();

    const roomListings = state.roomListings.filter(existingRoomListing => existingRoomListing.id !== roomListing.id);
    roomListings.push(roomListing);
    roomListings.sort(this.sortRoomlistingsByWhenAdded);

    state.roomListings = roomListings;

    this.update(state);
  }

  private sortRoomlistingsByWhenAdded(a: IRoomDesignerListing, b: IRoomDesignerListing) {
    return Number(a.id) - Number(b.id);
  }

  findRoomListingByRenderId(renderId: number): IRoomDesignerListing | undefined {
    const state = this.get();

    const roomListing = state.roomListings.find(existingRoomListing => existingRoomListing.renderId === renderId);

    return roomListing;
  }

  removeRoomListingByRenderId(renderId: number) {
    const state = this.get();

    const roomListings = state.roomListings
      .filter(existingRoomListing => existingRoomListing.renderId !== renderId)
      .sort(this.sortRoomlistingsByWhenAdded);

    state.roomListings = roomListings;

    this.update(state);
  }

  setCurrentRoomConfiguration(roomConfiguration?: IRoomConfiguration) {
    log.debug('AppState.setCurrentRoomConfiguration', roomConfiguration);

    const state = this.get();
    state.currentRoomConfiguration = roomConfiguration;

    this.update(state);
  }

  resetWIP() {
    log.debug('AppState.resetWIP');

    const state = this.get();
    state.roomName = undefined;
    state.prompt = undefined;
    state.inFlightListings = [];
    state.roomListings = [];
    state.currentRoomConfiguration = undefined;

    this.update(state);
  }
}

log.debug('new AppState()');
const appState = new AppState();

export { appState }