// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for defining the room configuration renderer component.
import * as log from 'ts-app-logger';
import { html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import * as renderer from 'ts-app-renderer';

import { WebComponent, SharedStylesheet } from '../web-component';
import { generateId } from '../ui.id';
import { appContext } from '../context';

import { getListing } from '../berkeley-search/search';

import { IListing, IRoomConfiguration, IRoomObject } from './iface';
import { IAppContext } from '../iface';

import * as text from './text';
import RoomScene from './scene.room.3D';
import RoomConfigurationPreview from './level.room-configuration-preview.3D';

@customElement('room-configuration-renderer')
export class RoomConfigurationRenderer extends WebComponent {
  @state() private selectedRoomConfiguration?: IRoomConfiguration;
  private sceneId: string = generateId();
  private scene?: RoomScene;
  private level?: renderer.ILevel; 
  private sceneElementId = generateId();
  private rendererState = new renderer.RendererState();

  static override sharedStyles: SharedStylesheet[] = [
    {
      id: 'room-configuration-renderer',
      content: css`
        room-configuration-renderer {
          display: block;
        }

        .spinner-grow {
          width: 3rem !important; 
          height: 3rem !important;
        }

        .border {
          border: 1px solid black;
        }
      `
    }
  ];

  protected override useContext(context: IAppContext) {
    log.trace('room-configuration-renderer got context update', context);

    if (this.selectedRoomConfiguration !== context.selectedRoomConfiguration) {
      this.selectedRoomConfiguration = context.selectedRoomConfiguration;

      if (this.selectedRoomConfiguration) { this.renderPreview(this.selectedRoomConfiguration!); }

      this.requestUpdate();
    }
  }

  private async renderPreview(roomConfiguration: IRoomConfiguration) {
    log.trace('renderPreview', 'roomConfiguration', roomConfiguration);

    (this.level as RoomConfigurationPreview).reset();
    (this.scene as RoomScene).reset();

    for (const importedRoomObject of roomConfiguration.objects) {
      //if (importedRoomObject.model_location === 'berkeley' && importedRoomObject.model_id) { // Only Berkeley dataset is used currently.
        const listing = await getListing(importedRoomObject);

        if (listing) { await this.addListingToRoomConfigurationPreview(listing, importedRoomObject); }
      //}
    }
  }

  private async addListingToRoomConfigurationPreview(listing: IListing, importedRoomObject: IRoomObject) {
    appContext.incrementThinkingCount();
    appContext.incrementDownloadCount();

    try {
      await (this.level as RoomConfigurationPreview).addListingToRoom(listing, importedRoomObject);
    } catch (error) {
      log.error('Failed to add room listing to preview', error);

      appContext.notifyUser({ text: text.failedToAddListingToRoom(listing, error), error: false });
    } finally {
      appContext.decrementThinkingCount();
      appContext.decrementDownloadCount();
    }
  }
  
  protected override render() {
    return html`
      <div class='d-flex justify-content-center'>
        <div class='spinner-grow' role='status' ?hidden=${!this.loading}>
          <span class='visually-hidden'>Rendering...</span>
        </div>
      </div>
      <div class='scene w-100' ?hidden=${this.loading}>
        <canvas id=${this.sceneElementId} class='scene-canvas w-100'></canvas>
      </div>
    `;
  }

  protected override async onInit() { await this.initRoomConfigurationRenderer(); }

  private async initRoomConfigurationRenderer() {
    log.trace('initRoomConfigurationRenderer');
    
    if (this.scene) { return; } // Shouldn't hit this with current routing scenario.

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

    log.debug('rendererConfig room-configuration-renderer', JSON.stringify(rendererConfig));

    this.scene = new RoomScene(rendererConfig);
    this.level = new RoomConfigurationPreview(this.scene);
    
    await this.level.load();

    this.loading = false;
  }

  override async destroy() {
    log.trace('destroy room-configuration-renderer');

    (this.level as RoomConfigurationPreview)?.destroy();
    (this.scene as RoomScene)?.destroy();

    this.rendererState.shouldRenderSceneId.set(this.sceneId, false);
  }
}