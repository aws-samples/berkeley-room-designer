// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for defining the entrypoint of the room configurations component.
import * as log from 'ts-app-logger';
import { html, css, TemplateResult } from 'lit';
import { Task } from '@lit-labs/task';
import { customElement, state } from 'lit/decorators.js';

import { WebComponent, SharedStylesheet } from './web-component';

import { appContext } from './context';
import { appState } from './state';
import { IAppContext } from './iface';

import { IRoomConfiguration, IRoomData } from './room-designer/iface';
import { listRoomConfigurationsForApp, removeRoomConfigurationFromApp } from './room-designer/db.app';
import { saveRoomToDisk } from './room-designer/db.disk';
import * as text from './room-designer/text';

import './room-designer/room-configuration-renderer';

@customElement('room-configurations-page')
export class RoomConfigurationsPage extends WebComponent {
  @state() private roomConfigurationsData: IRoomData[] = [];
  @state() private selectedRoomConfiguration?: IRoomConfiguration;

  static override sharedStyles: SharedStylesheet[] = [
    {
      id: 'room-configurations-page',
      content: css`
        room-configurations-page {
          display: block;
        }
      `
    }
  ];

  protected override useContext(context: IAppContext) {
    log.trace('room-configurations-page got context update', context);

    if (this.selectedRoomConfiguration !== context.selectedRoomConfiguration) {
      this.selectedRoomConfiguration = context.selectedRoomConfiguration;

      this.requestUpdate();
    }
  }

  protected override render() {
    return html`
      <div class='container-fluid mt-5'>
        <div class='row pt-5'>
          <div class='col-8'>
            <div ?hidden=${this.selectedRoomConfiguration !== undefined}>
              <button type='button' class='btn btn-lg btn-primary align-middle' ?hidden=${this.roomConfigurationsData.length > 0} @click='${ (_event: MouseEvent) => this.createRoom() }'>Create Room ${this.roomConfigurationsData.length}</button>
              <p ?hidden=${this.roomConfigurationsData.length === 0 || this.selectedRoomConfiguration !== undefined}>Select a room configuration. ${this.selectedRoomConfiguration?.name}</p>
            </div>
            <div ?hidden=${this.selectedRoomConfiguration === undefined}>
              <room-configuration-renderer></room-configuration-renderer>
            </div>
          </div>
          <div class='col-4'>
            <h3>Room Configurations</h3>
            ${this.roomConfigurationsTable()}
          </div>
        </div>
      </div>
    `;
  }

  private roomConfigurationsTable(): TemplateResult<1> {
    return html`
      <hr ?hidden=${this.roomConfigurationsData.length > 0}></hr>
      <p ?hidden=${this.roomConfigurationsData.length > 0}>No room configurations.</p>
      <table ?hidden=${this.roomConfigurationsData.length === 0} class='table'>
        <thead>
          <tr>
            <th></th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${this.getRoomData.render({
            pending: () => html`Loading room configurations...`,
            complete: () => {
              return html`
                ${this.roomConfigurationsData.map((roomData) => {
                  return html`
                    <tr>
                      <td>${roomData.roomConfiguration.name}</td>
                      <td>
                        <div class='btn-group' role='group' aria-label='room configurations'>
                          <button type='button' class='btn btn-primary' @click=${ (_event: MouseEvent) => this.previewRoomConfiguration(roomData) }>Preview</button>
                          <button type='button' class='btn btn-outline-primary' @click=${ (_event: MouseEvent) => this.downloadRoomConfiguration(roomData) }>Download</button>
                          <button type='button' class='btn btn-outline-primary' @click=${ (_event: MouseEvent) => this.editRoomConfiguration(roomData) }>Edit</button>
                          <button type='button' class='btn btn-outline-danger' @click=${ (_event: MouseEvent) => this.removeRoomConfiguration(roomData) }>Remove</button>
                        </div>
                      </td>
                    </tr>
                  `;
                })}
              `;
            }
          })}
        </tbody>
      </table>
    `;
  }

  private createRoom() {
    log.trace('createRoom');

    appState.setCurrentRoomConfiguration(undefined);

    (window as any).router.load('/'); 
  }

  private getRoomData = new Task(this, async ([]) => {
    this.loading = true;

    this.roomConfigurationsData = await listRoomConfigurationsForApp();

    this.loading = false;
  }, () => []);

  private previewRoomConfiguration(roomData: IRoomData) {
    log.trace('previewRoomConfiguration', roomData);

    this.selectedRoomConfiguration = roomData.roomConfiguration;

    appContext.setSelectedRoomConfiguration(roomData.roomConfiguration);
  }

  private async downloadRoomConfiguration(roomData: IRoomData) {
    log.trace('downloadRoomConfiguration', roomData);

    const fileNameNoExtension = roomData.exportedRoom.exportName;

    await saveRoomToDisk(roomData.exportedRoom, { dryRun: false, fileNameNoExtension, saveTo: 'disk' });
  }

  private editRoomConfiguration(roomData: IRoomData) {
    log.trace('editRoomConfiguration', roomData);

    // Note the difference b/t state and context here!
    // Editing a room configuration is something we want to track with state 
    //  so if we reload any un-saved changes are persisted as "WIP".
    //appState.setCurrentRoomConfiguration(roomData.roomConfiguration);

    (window as any).router.load(`/${roomData.roomConfiguration.id}`); 
  }

  private async removeRoomConfiguration(roomData: IRoomData) {
    log.trace('removeRoomConfiguration', roomData);

    appContext.incrementThinkingCount();

    await removeRoomConfigurationFromApp(roomData);

    if (roomData.roomConfiguration.id === this.selectedRoomConfiguration?.id) { 
      appContext.setSelectedRoomConfiguration(undefined);
    }

    this.roomConfigurationsData = await listRoomConfigurationsForApp();

    appContext.decrementThinkingCount();
    appContext.notifyUser({ text: text.deletedRoomOK, error: false });
  }

  protected override async onInit() {
    log.trace('init room-configurations-page');
  }

  override async destroy() {
    log.trace('destroy room-configurations-page');
    
    appContext.setSelectedRoomConfiguration(undefined);
  }
}