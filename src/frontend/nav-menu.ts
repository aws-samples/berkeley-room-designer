// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for defining the entrypoint of the nav menu.
import * as log from 'ts-app-logger';
import { html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { showOpenFilePicker } from 'file-system-access';

import { WebComponent, SharedStylesheet } from './web-component';
import { generateId } from './ui.id';

import { IAppState, IAppContext } from './iface';
import { appState } from './state';
import { appContext } from './context';

import * as roomComms from './room-designer/comms';
import * as roomText from './room-designer/text';
import { IRoomConfiguration } from './room-designer/iface';

@customElement('nav-menu')
export class NavMenu extends WebComponent {
  @state() private thinkingCount = 0; // Shows or hides loading icon if > 0. 
  @state() private downloadCount = 0; // Shows or hides active downloads if > 0. 
  @state() private roomName? = '';
  @state() private selectedRoomConfiguration?: IRoomConfiguration;
  @state() private route: string = '/'; // Default route.
  @state() private menuType: MenuFor = 'rooms'; // This is here because a floor plan designer was cut from this sample.

  private roomNameElement: HTMLInputElement | undefined;
  private readonly roomNameElementId = generateId();

  static override sharedStyles: SharedStylesheet[] = [
    {
      id: 'nav-menu',
      content: css`
        nav-menu {
          display: block;
        }

        .navbar-text {
          margin-right: 10px;
        }

        .navbar-help {
          width: 300px;
        }

        .downloads-text-padding {
          padding-top: .86rem !important;
        }
      `
    }
  ];

  protected override useListeners() {
    this.addListener('popstate', async (event) => {
      this.onUrlChange(event as CustomEvent);
    });
  }

  private onUrlChange(event: CustomEvent) {
    log.debug('onUrlChange', event, window.location.href);

    this.setMenuType();
    this.setRoute();

    this.requestUpdate();
  }

  private setMenuType() {
    if (window.location.href.includes('room')) { this.menuType = 'rooms'; }

    log.debug('setMenuType', this.menuType);
  }

  private setRoute() {
    const url = new URL(window.location.href);

    if (!url.hash || url.hash === '#/') { this.route = url.pathname; } else { this.route = url.hash.replace('#', ''); }

    log.debug('setRoute', url, this.route);
  }

  protected override useState(state: IAppState) {
    log.trace('nav-menu got state update', state);

    let requestUpdate = false;

    const roomName = state.roomName || '';
    if (this.roomName !== roomName) {
      this.roomName = roomName;

      requestUpdate = true;
    }

    if (requestUpdate) { this.requestUpdate(); }
  }

  protected override useContext(context: IAppContext) {
    log.trace('nav-menu got context update', context);

    let requestUpdate = false;
    if (this.thinkingCount !== context.thinkingCount) {
      this.thinkingCount = context.thinkingCount;

      requestUpdate = true;
    }

    if (this.downloadCount !== context.downloadCount) {
      this.downloadCount = context.downloadCount;

      requestUpdate = true;
    }

    if (this.selectedRoomConfiguration !== context.selectedRoomConfiguration) {
      this.selectedRoomConfiguration = context.selectedRoomConfiguration;

      requestUpdate = true;
    }

    if (requestUpdate) { this.requestUpdate(); }
  }

  protected override render() {
    log.trace('route at render', this.route);
    
    return html`
      <header>
        <nav class='navbar navbar-expand-lg fixed-top navbar-dark bg-dark'>
          <div class='container-fluid'>
            <a class='navbar-brand' href='#' ?hidden=${this.menuType !== 'rooms'}>Berkeley Room Designer</a>
            <span class='navbar-text'>/</span>
            <span class='navbar-text' ?hidden=${this.route !== '/room-configurations'}>${this.selectedRoomConfiguration?.name}</span>

            <span class='navbar-text' ?hidden=${this.menuType !== 'rooms' || this.route === '/room-configurations'}>
              <input type='text' id=${this.roomNameElementId} class='form-control' .value=${this.roomName!} @input=${this.setRoomName} placeholder='Room Name'/>
            </span>

            <div class='clearfix'>
              <div class='spinner-border text-primary' role='status' ?hidden=${this.thinkingCount <= 0}></div>
            </div>
            <button class='navbar-toggler' type='button' data-bs-toggle='collapse' data-bs-target='#navbar-content' aria-controls='navbarSupportedContent' aria-expanded='false' aria-label='Toggle navigation'>
              <span class='navbar-toggler-icon'></span>
            </button>

            <div class='collapse navbar-collapse' id='navbar-content'>
              <div class='navbar-nav flex-row flex-wrap ms-md-auto'>
                
              <span class='badge badge-secondary downloads-text-padding' ?hidden=${this.downloadCount === 0}>Downloads (${this.downloadCount})</span>
                
                <ul class='navbar-nav'>

                  <li class='nav-item dropdown dropstart'>
                    <a class='nav-link dropdown-toggle' href='#' id='navbarHelpMenu' role='button' data-bs-toggle='dropdown' aria-expanded='false'>
                      Help
                    </a>
                    <div class='dropdown-menu p-4 navbar-help' aria-labelledby='navbarHelpMenu'>
                      <p>
                        <b>Camera Move (keyboard)</b><br/>
                        mouse click then &larr; &rarr;<br/>
                        <b>Camera Move (mouse)</b><br/>
                        mouse click + 1-finger touch pad or mouse move<br/></p>
                        <b>Camera Zoom (keyboard)</b><br/>
                        &uarr; &darr;<br/>
                        <b>Camera Zoom (mouse)</b><br/>
                        2-finger touch pad or mouse move<br/>
                      </p>
                      <hr/>
                      <p>
                        Select listing from "Room Items"...<br/>
                        <b>Listing Move</b><br/>
                        ...and then press W,A,S, or D to move by 6" increments<br/>
                        <b>Listing Rotate</b><br/>
                        ...and then press R to rotate by 15 degree increments<br/>
                        <i>Listing controls are respective to the view.</i>
                      </p>
                    </div>
                  </li>

                  <li class='nav-item dropdown' ?hidden=${this.menuType !== 'rooms'}> 
                    <a class='nav-link dropdown-toggle' href='#' id='pageFileMenu' role='button' data-bs-toggle='dropdown' aria-expanded='false'>
                      File
                    </a>
                    <ul class='dropdown-menu' aria-labelledby='pageFileMenu'>
                      <li class='dropdown-item'>
                        <label for='roomImportFile' class='btn btn-sm btn-secondary d-grid gap-2'>Import YAML</label>
                        <input id='roomImportFile' type='file' class='d-none' @click=${this.importRoomFromYAML}/>
                      </li>
                      <li><hr class='dropdown-divider'></li>
                      <li><a class='dropdown-item' href='#' @click='${ (_event: MouseEvent) => roomComms.emitSaveRoomEvent('disk', true) }'>Preview YAML</a></li>
                      <li><hr class='dropdown-divider'></li>
                      <li><a class='dropdown-item' href='#' @click=${ (_event: MouseEvent) => roomComms.emitSaveRoomEvent('disk', false) }>Download Room</a></li>
                      <li><a class='dropdown-item' href='#' @click=${ (_event: MouseEvent) => roomComms.emitSaveRoomEvent('app', false) }>Save Room</a></li>
                    </ul>
                  </li>

                  <li class='nav-item dropdown'>
                    <a class='nav-link dropdown-toggle' href='#' id='pageDesignMenu' role='button' data-bs-toggle='dropdown' aria-expanded='false'>
                      Design
                    </a>
                    <ul class='dropdown-menu' aria-labelledby='pageDesignMenu'>
                      <li><a class='dropdown-item' href='#' @click='${ (_event: MouseEvent) => (window as any).router.load('/') }'>Rooms</a></li>
                    </ul>
                  </li>
    
                  <li class='nav-item dropdown'> 
                    <a class='nav-link dropdown-toggle' href='#' id='pageSavedMenu' role='button' data-bs-toggle='dropdown' aria-expanded='false'>
                      Saved
                    </a>
                    <ul class='dropdown-menu' aria-labelledby='pageSavedMenu'>
                      <li><a class='dropdown-item' href='#' @click='${ (_event: MouseEvent) => (window as any).router.load('/room-configurations') }'>Rooms</a></li>
                    </ul>
                  </li>

                  <li class='nav-item'>
                    <a class='nav-link' href='https://amazon-berkeley-objects.s3.amazonaws.com/index.html' target='_blank'>Dataset</a>
                  </li>

                </ul>
              </div>
            </div>
          </div>
        </nav>
      </header>
    `;
  }

  private setRoomName() {
    this.roomName = this.roomNameElement?.value || ''; 

    appState.setRoomName(this.roomName);
  }

  private async importRoomFromYAML() {
    log.trace('importRoomFromYAML');

    appContext.incrementThinkingCount();

    const [fileHandle] = await showOpenFilePicker({ _preferPolyfill: true });

    const file = await fileHandle.getFile();
    
    const yaml = await file.text();
    log.debug('yaml', yaml);

    appContext.decrementThinkingCount();
    appContext.notifyUser({ text: roomText.downloadingModelsForImportedRoom, error: false });
    
    roomComms.emitImportRoomFromYamlEvent(yaml, false);
  }

  protected override async onInit() {
    // Elements now exist.
    this.roomNameElement = this.getElement<HTMLInputElement>(this.roomNameElementId);

    // Set defaults.
    this.roomName = appState.get().roomName || '';
    this.setMenuType();
    this.setRoute();
  }

  override async destroy() {
    log.trace('destroy nav-menu');
  }
}

type MenuFor = undefined | 'rooms';