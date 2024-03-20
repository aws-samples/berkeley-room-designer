// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for providing a web component which handles loading our room scene and room configuration levels.
// Background: ts-app-renderer defines "scene" and "level" abstractions for threejs/babylonjs, which are WebGL abstractions.
// In our case, room configurations of furniture et. al. (based on a YAML file or newly created) are defined as levels.
// Everything else in the room designer - floor, lighting. etc. - are defined as a scene.
// This file translates application-level events to scene/level logic.
import * as log from 'ts-app-logger';
import { html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import * as renderer from 'ts-app-renderer';

import { WebComponent, SharedStylesheet } from '../web-component';
import { appState } from '../state';
import { appContext } from '../context';
import { generateId } from '../ui.id';
import { bus } from '../comms';

import { getListing } from '../berkeley-search/search';

import { IListing, IRoomConfiguration, IRoomObject } from './iface';
import * as roomEvents from './events';
import * as roomComms from './comms';
import RoomScene from './scene.room.3D';
import RoomConfiguration from './level.room-configuration.3D';
import { importRoomFromYAML } from './importer';
import { exportRoomAsYAML } from './exporter';
import { saveRoomToDisk } from './db.disk';
import { saveRoomToApp } from './db.app';
import * as text from './text';
import { SaveTo } from '../iface';

@customElement('room-designer')
export class RoomDesigner extends WebComponent {
  private sceneId: string = generateId();
  private scene?: RoomScene;
  private level?: renderer.ILevel; 
  private sceneElementId = generateId();
  private rendererState = new renderer.RendererState();

  private importedRoom?: IRoomConfiguration;

  static override sharedStyles: SharedStylesheet[] = [
    {
      id: 'room-designer',
      content: css`
        room-designer {
          display: block;
        }

        .scene-canvas {
          height: 100%;
          border: 1px solid black;
          border-radius: .5rem;
        }

        .spinner-grow {
          width: 3rem !important; 
          height: 3rem !important;
        }
      `
    }
  ];

  protected override useMessageBus() {
    // You can test this with the build-utils/data/room1.yaml test file.
    this.addSubscriber(bus.subscribe(roomEvents.importRoomFromYAML, async event => {
      log.trace(`room got ${roomEvents.importRoomFromYAML} event`);

      const { yaml, fromPrompt } = event.payload;

      try {
        await this.importRoomFromYAML(yaml, fromPrompt);
      } catch (error) {
        log.error('Failed to import yaml', error);

        appContext.notifyUser({ text: text.failedToImportRoomFromYaml(error), error: true });
      }
    }));

    this.addSubscriber(bus.subscribe(roomEvents.saveRoom, async (event) => {
      log.trace(`room got ${roomEvents.saveRoom} event`);
      
      const { saveTo, dryRun } = event.payload;

      this.saveRoom(saveTo, dryRun);
    }));
    
    this.addSubscriber(bus.subscribe(roomEvents.listingSelected, async (event) => {
      log.trace(`room got ${roomEvents.listingSelected} event`);

      const { listing } = event.payload;

      await this.addListingToRoom(listing);
    }));

    this.addSubscriber(bus.subscribe(roomEvents.removeRoomListing, async (event) => {
      log.trace(`room got ${roomEvents.removeRoomListing} event`);

      const { roomListing } = event.payload;

      await (this.level as RoomConfiguration).removeRoomListing(roomListing);

      this.requestUpdate();
    }));
  }

  private async importRoomFromYAML(yaml: string, fromPrompt: boolean) {
    log.trace('importRoomFromYAML', yaml, fromPrompt);

    this.resetRoom();
    
    try {
      this.importedRoom = importRoomFromYAML(yaml);
    } catch (error) {
      if (fromPrompt) { throw Error(text.llmError) } else { throw Error(text.invalidYamlSupplied); }
    }

    appState.setRoomName(this.importedRoom.name);
    appState.setCurrentRoomConfiguration(this.importedRoom);

    log.debug('imported room', this.importedRoom);
    
    //if (roomCreationArgs.furnitureSelectionType === 'matching search') { // Only "matching search" is used currently.
      for (const importedRoomObject of this.importedRoom.objects) {
        //if (importedRoomObject.model_location === 'berkeley' && importedRoomObject.model_id) { // Only Berkeley dataset is used currently.
          const listing = await getListing(importedRoomObject);

          if (listing) { await this.addListingToRoom(listing, importedRoomObject); }
        //}
      }
    //}
  }

  private resetRoom() {
    log.trace('resetRoom');

    roomComms.emitInitOrResetEvent(); // Let other components know to reset.
    appState.resetWIP(); // Reset state.
    (this.level as RoomConfiguration).reset();
    (this.scene as RoomScene).reset();
  }

  private async addListingToRoom(listing: IListing, importedRoomObject?: IRoomObject) {
    appContext.incrementThinkingCount();
    appContext.incrementDownloadCount();

    try {
      await (this.level as RoomConfiguration).addListingToRoom(listing, importedRoomObject);
    } catch (error) {
      log.error('Failed to add room listing', error);

      appContext.notifyUser({ text: text.failedToAddListingToRoom(listing, error), error: false });
    } finally {
      appContext.decrementThinkingCount();
      appContext.decrementDownloadCount();
    }
  }

  private async saveRoom(saveTo: SaveTo, dryRun: boolean) {
    log.trace('saveRoom', 'saveTo', saveTo, 'dryRun', dryRun);

    appContext.incrementThinkingCount();

    try {
      const fileNameNoExtension = `room-${appState.get().currentRoomConfiguration?.name || appState.get().roomName || new Date().getTime()}`;

      const saveArgs = { dryRun, fileNameNoExtension, saveTo };

      const exportedRoom = await exportRoomAsYAML(appState.get().roomListings, saveArgs, this.importedRoom);

      // This flag primarily used for previewing.
      if (dryRun) { appContext.setExportPreview(exportedRoom.yaml); } 

      if (saveTo === 'disk') { await saveRoomToDisk(exportedRoom, saveArgs); }
      if (saveTo === 'app') { await saveRoomToApp(exportedRoom, saveArgs); }
 
      if (!dryRun) { appContext.notifyUser({ text: text.savedRoomOK, error: false }); }
    } catch (error) {
      log.error('Failed to save room to disk', error);

      if (!dryRun) { appContext.notifyUser({ text: text.failedToSaveRoom(error), error: true }); }
    } finally {
      appContext.decrementThinkingCount();
    }
  }

  protected override render() {
    return html`
      <div class='d-flex justify-content-center'>
        <div class='spinner-grow' role='status' ?hidden=${!this.loading}>
          <span class='visually-hidden'>Loading...</span>
        </div>
      </div>
      <div class='scene w-100' ?hidden=${this.loading}>
        <canvas id=${this.sceneElementId} class='scene-canvas w-100'></canvas>
      </div>
    `;
  }

  protected override async onInit() { await this.initRoomDesigner(); }

  private async initRoomDesigner() {
    log.trace('initRoomDesigner');

    if (this.scene) {
      await this.tryResumeEditingRoomConfiguration();
      
      return; 
    }

    this.rendererState.shouldRenderSceneId.set(this.sceneId, true);
    
    const sceneElement = this.getElement<HTMLCanvasElement>(this.sceneElementId);

    const rendererConfig: renderer.RendererConfig = { 
      rendererLibrary: 'babylon',
      sceneElementID: this.sceneElementId,
      sceneElement,
      state: this.rendererState,
      sceneId: this.sceneId,
      loop: true
    };

    log.debug('rendererConfig room-designer', JSON.stringify(rendererConfig));

    this.scene = new RoomScene(rendererConfig);
    this.level = new RoomConfiguration(this.scene);
    
    await this.level.load();
    await this.tryResumeEditingRoomConfiguration();

    this.loading = false;
  }

  private async tryResumeEditingRoomConfiguration() {
    await (this.level as RoomConfiguration).tryResumeEditingRoomConfiguration(appState.get().roomListings);
  }

  override async destroy() {
    log.trace('destroy room-designer');

    (this.level as RoomConfiguration).destroy();
    (this.scene as RoomScene).destroy();

    appContext.setSelectedRoomListing(undefined);

    this.rendererState.shouldRenderSceneId.set(this.sceneId, false);
  }
}