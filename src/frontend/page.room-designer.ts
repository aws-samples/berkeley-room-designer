// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for defining the entrypoint of the room designer component.
import * as log from 'ts-app-logger';
import { html, css, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { WebComponent, SharedStylesheet } from './web-component';
import { IAppContext, IMessageToUser } from './iface';
import { appContext } from './context';
import { appState } from './state';
import { bus } from './comms';
import * as fileUtils from './utils.file';

import { View, CameraView, IRoomDesignerListing, CameraChangeDirection } from './room-designer/iface';
import * as roomEvents from './room-designer/events';
import * as roomComms from './room-designer/comms';
import { getRoomConfigurationFromApp } from './room-designer/db.app';

import './room-designer';
import './berkeley-search/search-listings';
import './room-designer/room-listings';

@customElement('room-designer-page')
export class RoomDesignerPage extends WebComponent {
  @property({ attribute: true, type: String, reflect: true }) roomConfigurationId?: string;
  
  @state() private cameraView: CameraView = 'front';
  @state() private view: View = '3D'; // 2D views were removed from sample since they were unfinished.
  @state() private generating: boolean = false;
  @state() private userMessages: IMessageToUser[] = [];
  @state() private selectedRoomListing?: IRoomDesignerListing;

  static override sharedStyles: SharedStylesheet[] = [
    {
      id: 'room-designer-page',
      content: css`
        room-designer-page {
          display: block;
        }

        .user-messages {
          overflow-y: scroll;
          max-height: 80px;
        }
      `
    }
  ];

  protected override useContext(context: IAppContext) {
    log.trace('room-designer-page got context update', context);
    
    if (this.userMessages.length !== context.userMessages.length) {
      this.userMessages = context.userMessages;
    }

    /*
    if (this.view !== context.view) {
      this.view = context.view;
    }
    */

    if (this.cameraView !== context.cameraView) {
      this.cameraView = context.cameraView;
    }

    if (context.selectedRoomListing) {
      this.selectedRoomListing = context.selectedRoomListing;
    } else {
      this.selectedRoomListing = undefined;
    }

    this.requestUpdate();
  }

  protected override useMessageBus() {
    this.addSubscriber(bus.subscribe(roomEvents.removeRoomListing, async (event) => {
      log.trace(`room-designer-page got ${roomEvents.removeRoomListing} event`);

      const { roomListing } = event.payload;

      if (this.selectedRoomListing?.id === roomListing.id) { this.selectedRoomListing = undefined; }
    }));

    this.addSubscriber(bus.subscribe(roomEvents.initOrReset, async (_event) => {
      log.trace(`room-designer-page got ${roomEvents.initOrReset} event`);

      this.selectedRoomListing = undefined;
    }));
  }

  protected override render() {
    return html`
      <div class='container-fluid mt-5'>
        <div class='row pt-5'>
          <div class='col-8'>
            <div class='row g-0'>
              <div class='col-3'>
                ${this.getViewControlsTemplate()}
              </div>
              <div class='col-6'>
                ${this.getCameraControlsTemplate()}
              </div>
              <div class='col-3 w-auto ms-auto'>
                ${this.getSelectedListingControlsTemplate()}
              </div>
            </div>
            <room-designer></room-designer>
            ${this.getMessagesToUserTemplate()}
          </div>
          <div class='col-4'>
            <search-listings></search-listings>
            <room-listings></room-listings>
          </div>
        </div>
      </div>
    `;
  }

  private getViewControlsTemplate(): TemplateResult<1> {
    return html`
      <!-- FIXME Tooltips not working. -->
      <div class='btn-group float-left' role='group' aria-label='camera controls' data-toggle='tooltip' data-placement='bottom' title='Generate room.'>
        <button type='button' class='btn btn-outline-${this.generating ? 'secondary': 'primary'}' @click=${ (_event: MouseEvent) => roomComms.createRoomEvent() }>Generate Room</button>
      </div>

      <!--
      <span>View:</span>
      <div class='btn-group float-left' role='group' aria-label='camera controls' data-toggle='tooltip' data-placement='bottom' title='Switch camera views.'>
        <button type='button' class='btn btn-outline-${this.view === '3D' ? 'secondary': 'primary'}' @click=${ (_event: MouseEvent) => this.setView('3D') }>3D</button>
      </div>
      -->
    `;
  }

  private setView(view: View) { appContext.setView(view); }

  private getCameraControlsTemplate(): TemplateResult<1> {
    const disabled = this.selectedRoomListing ? '' : ' disabled';

    return html`
      <!-- FIXME Tooltips not working. -->
      <span>Camera:</span>
      <div class='btn-group float-left' role='group' aria-label='camera controls' data-toggle='tooltip' data-placement='bottom' title='Switch camera views.'>
        <button type='button' class='btn btn-outline-${this.cameraView === 'front' ? 'secondary': 'primary'}' @click=${ (_event: MouseEvent) => this.setCameraView('front') }>Front</button>
        <button type='button' class='btn btn-outline-${this.cameraView === 'back' ? 'secondary': 'primary'}' @click=${ (_event: MouseEvent) => this.setCameraView('back') }>Back</button>
        <button type='button' class='btn btn-outline-${this.cameraView === 'left' ? 'secondary': 'primary'}' @click=${ (_event: MouseEvent) => this.setCameraView('left') }>Left</button>
        <button type='button' class='btn btn-outline-${this.cameraView === 'right' ? 'secondary': 'primary'}' @click=${ (_event: MouseEvent) => this.setCameraView('right') }>Right</button>
        <!--<button type='button' class='btn btn-outline-primary ${disabled}' @click=${ (_event: MouseEvent) => roomComms.emitCenterOnSelectedListingEvent() }>Focus on Listing</button>-->
      </div>
      <div class='btn-group float-left' role='group' aria-label='camera height controls' data-toggle='tooltip' data-placement='bottom' title='Change camera height'>
        <button type='button' class='btn btn-outline-primary' @click=${ (_event: MouseEvent) => this.changeCameraHeight('up') }>Up</button>
        <button type='button' class='btn btn-outline-primary' @click=${ (_event: MouseEvent) => this.changeCameraHeight('down') }>Down</button>
      </div>
    `;
  }

  private setCameraView(cameraView: CameraView) { appContext.setCameraView(cameraView); }

  private changeCameraHeight(direction: CameraChangeDirection) {
    const sign = direction === 'down' ? -1 : 1;

    const cameraHeightOffset = appContext.get().cameraHeightOffset + sign;

    appContext.setCameraHeightOffset(cameraHeightOffset);
  }

  private getSelectedListingControlsTemplate(): TemplateResult<1> {
    const disabled = this.selectedRoomListing ? '' : ' disabled';
    
    return html`
      <div class='btn-group float-right pb-1' role='group' aria-label='listing controls'>
        <button type='button' class='btn btn-outline-primary ${disabled}' @click=${ (_event: MouseEvent) => roomComms.emitMoveSelectedListingToOriginEvent() }>Move Listing to Origin</button>
        <!--<button type='button' class='btn btn-outline-primary ${disabled}' @click=${ (_event: MouseEvent) => roomComms.emitResetListingToImportedEvent() }>Reset Listing Position</button>-->
      </div>
    `;
  }

  private getMessagesToUserTemplate(): TemplateResult<1> {
    const template = this.userMessages.slice(0, 9).map((messageToUser) => { return this.getMessageToUserTemplate(messageToUser); });

    return html`<div class='user-messages'>${template}</div>`;
  }

  private getMessageToUserTemplate(messageToUser: IMessageToUser): TemplateResult<1> {
    let messageToUserTemplate = html``;

    if (messageToUser.error) {
      messageToUserTemplate = html`
      <div id='user-message' class='alert alert-danger' role='alert'>
        ${messageToUser.text}
      </div>
      `;
    } else {
      messageToUserTemplate = html`
        <div id='user-message' class='alert alert-secondary' role='alert'>
          ${messageToUser.text}
        </div>
      `;
    }

    return messageToUserTemplate;
  }

  protected override async onInit() {
    log.debug('id passed', this.roomConfigurationId);
    
    if (!/^-?\d+$/.test(this.roomConfigurationId || '')) { return; }

    // URL contains ID of room configuration to edit in designer.
    if (this.roomConfigurationId) {
      log.debug('edit room configuration in url', this.roomConfigurationId);

      const roomConfiguration = await getRoomConfigurationFromApp(this.roomConfigurationId);
      if (!roomConfiguration) { 
        appContext.notifyUser({ text: 'Room configuration not found.', error: true });

        return;
      }

      // Clear WIP state since what we're editing is new WIP state.
      appState.setCurrentRoomConfiguration(undefined);

      const yaml = fileUtils.convertJSONToYAML(roomConfiguration);

      roomComms.emitImportRoomFromYamlEvent(yaml, false);
    }
  }

  override async destroy() {
    log.trace('destroy room-designer-page');
  }
}