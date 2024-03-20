// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for providing a component to display room listings and interact with them 
//  in the context of a room configuration.
import * as log from 'ts-app-logger';
import { html, css } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js'; // In case of HTML in any listings.
import { customElement, state } from 'lit/decorators.js';

import { WebComponent, SharedStylesheet } from '../web-component';
import { appContext } from '../context';
import { appState } from '../state';
import { bus } from '../comms';

import { IRoomDesignerListing } from './iface';
import * as roomEvents from './events';
import * as roomComms from './comms';
import { IAppContext, IAppState } from '../iface';

@customElement('room-listings')
export class RoomListings extends WebComponent {
  @state() private roomListings: IRoomDesignerListing[] = [];
  @state() private selectedRoomListing?: IRoomDesignerListing;

  static override sharedStyles: SharedStylesheet[] = [
    {
      id: 'room-listings',
      content: css`
        room-listings {
          display: block;
        }

        .table-overflow-to-scroll {
          max-height: 54vh;
          overflow-y: scroll;
        }
      `
    }
  ];

  protected override useState(state: IAppState) {
    log.trace('room-listings got state update', state);

    this.roomListings = state.roomListings;

    this.requestUpdate();
  }

  protected override useContext(context: IAppContext) {
    log.trace('room-listings got context update', context);

    if (context.selectedRoomListing) {
      this.selectedRoomListing = context.selectedRoomListing;
    } else {
      this.selectedRoomListing = undefined;
    }

    this.requestUpdate();
  }
    
  protected override useMessageBus() {
    this.addSubscriber(bus.subscribe(roomEvents.initOrReset, async (_event) => {
      log.trace(`room-listings got ${roomEvents.initOrReset} event`);

      this.roomListings = [];

      this.requestUpdate();
    }));
  }

  protected override render() {
    return html`
      <div class='pt-3'>
        <h3>Room Items <span ?hidden='${this.roomListings.length === 0}'>(${this.roomListings.length})</span></h3>
      </div>
      <div class='card card-body table-overflow-to-scroll'>
        <p ?hidden='${this.roomListings.length > 0}'>No items in room.</p>
        <table class='table' ?hidden='${this.roomListings.length === 0}'>
          <thead>
            <tr>
              <th></th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${this.roomListings.map((roomListing) => {
              return html`
                <tr>
                  <td>
                    <button type='button' class='btn btn-sm btn-dark ${this.selectedRoomListing?.id === roomListing.id ? 'd-none' : ''}' @click='${ (_event: MouseEvent) => this.setSelectedRoomListing(roomListing) }'>Select</button>
                    <button type='button' class='btn btn-sm btn-dark ${this.selectedRoomListing?.id === roomListing.id ? '' : 'd-none'}' @click='${ (_event: MouseEvent) => this.setSelectedRoomListing() }'>Unselect</button>
                  </td>
                  <td><button type='button' class='btn btn-sm btn-outline-danger' @click='${ (_event: MouseEvent) => this.removeRoomListing(roomListing) }'>Remove</button></td>
                  <td>${unsafeHTML(roomListing.listing.name)}</td>
                </tr>
              `;
            })}
          </tbody>
        </table>
      </div>
    `;
  }

  protected override async onInit() {
    this.roomListings = appState.get().roomListings;
  }

  private setSelectedRoomListing(roomListing?: IRoomDesignerListing) {
    log.debug('setSelectedRoomListing', roomListing);

    appContext.setSelectedRoomListing(roomListing);
  }

  private removeRoomListing(roomListingToRemove: IRoomDesignerListing) {
    log.debug('removeRoomListing', roomListingToRemove);

    this.roomListings = this.roomListings.filter(roomListing => roomListing.id !== roomListingToRemove.id);
    log.debug('this.roomListings', this.roomListings.length);

    if (this.selectedRoomListing?.id === roomListingToRemove.id) { this.selectedRoomListing = undefined; }

    roomComms.emitRemoveRoomListingEvent(roomListingToRemove);

    this.requestUpdate();
  }

  override async destroy() {
    log.trace('destroy room-listings');
    
    this.roomListings = [];
    this.selectedRoomListing = undefined;
  }
}