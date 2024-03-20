// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for providing a way to persist context (and broadcast changes) which does not persist on reload, but does travel across components.
import * as log from 'ts-app-logger';

import { IAppContext, IMessageToUser } from './iface';
import { CameraView, IRoomConfiguration, IRoomDesignerListing, View } from './room-designer/iface';

let defaultContext: IAppContext = { thinkingCount: 0, downloadCount: 0, userMessages: [], view: '3D', cameraView: 'front', cameraHeightOffset: 0 };
let context: IAppContext = { ...defaultContext }; 

export class AppContext {
  private subscribers: Map<number, CallableFunction> = new Map<number, CallableFunction>();

  get(): IAppContext { return context; }

  update(_context: IAppContext) { 
    context = { ..._context };

    for (const subscriber of this.subscribers.values()) {
      subscriber(context);
    }
  }

  subscribe(subscriber: CallableFunction): number {
    const subscriberId = this.subscribers.size + 1;
    this.subscribers.set(subscriberId, subscriber);

    return subscriberId;
  }

  notifyUser(messageToUser: IMessageToUser) {
    const _context = context;
    _context.userMessages.unshift({ ...messageToUser, date: new Date() });

    log.debug('notifyUser', _context.userMessages);

    this.update(_context);
  }

  incrementThinkingCount() {
    const _context = context;
    _context.thinkingCount = _context.thinkingCount + 1;

    this.update(_context);
  }

  decrementThinkingCount() {
    const _context = context;
    _context.thinkingCount = _context.thinkingCount - 1;

    this.update(_context);
  }

  incrementDownloadCount() {
    const _context = context;
    _context.downloadCount = _context.downloadCount + 1;

    this.update(_context);
  }

  decrementDownloadCount() {
    const _context = context;
    _context.downloadCount = _context.downloadCount - 1;

    this.update(_context);
  }

  setView(view: View) {
    const _context = context;
    _context.view = view;

    this.update(_context);
  }

  setCameraView(cameraView: CameraView) {
    const _context = context;
    _context.cameraView = cameraView;

    this.update(_context);
  }

  setCameraHeightOffset(cameraHeightOffset: number) {
    const _context = context;
    _context.cameraHeightOffset = cameraHeightOffset;

    this.update(_context);
  }

  setExportPreview(exportPreview?: string) {
    const _context = context;
    _context.exportPreview = exportPreview;

    this.update(_context);
  }

  setSelectedRoomListing(roomListing?: IRoomDesignerListing) {
    const _context = context;
    _context.selectedRoomListing = roomListing;

    this.update(_context);
  }

  setSelectedRoomConfiguration(roomConfiguration?: IRoomConfiguration) {
    const _context = context;
    _context.selectedRoomConfiguration = roomConfiguration;

    this.update(_context);
  }

  unsubscribe(subscriberId: number) { this.subscribers.delete(subscriberId); }
}

log.debug('new AppContext()');
const appContext = new AppContext();

export { appContext }