// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for defining the room generation modal component.
import * as log from 'ts-app-logger';
import { html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { Modal } from 'bootstrap';

import { appState } from '../state';
import { appContext } from '../context';
import { IAppState } from '../iface';
import { WebComponent, SharedStylesheet } from '../web-component';
import { generateId } from '../ui.id';
import { bus } from '../comms';
import * as apiClient from '../api-client';
import * as fileUtils from '../utils.file';

import { FurniturePlacementType, FurnitureSelectionType, IRoomConfiguration } from './iface';
import * as roomComms from './comms';
import * as roomEvents from './events';
import * as roomText from './text';

import { generateRoomConfiguration as generateRandomRoomConfiguration } from '../furniture-placement/random';
import { generateRoomConfiguration as generateAutoInteriorBlogRoomConfiguration} from '../furniture-placement/autointeriorblog';
import { roomCategories, ISimpleRoomDescription, RoomCategoryType, IRoomCreationArgs} from '../furniture-placement/iface';

@customElement('room-creation-modal')
export class RoomCreationModal extends WebComponent {
  private roomCreationModalElement?: HTMLElement;
  private readonly roomCreationModalElementId = generateId();
  private roomCreationModal?: Modal;

  private roomWidthElement?: HTMLInputElement;
  private readonly roomWidthElementId = generateId();

  private roomDepthElement?: HTMLInputElement;
  private readonly roomDepthElementId = generateId();

  private roomHeightElement?: HTMLInputElement;
  private readonly roomHeightElementId = generateId();

  private matchingKeywordsElement?: HTMLInputElement;
  private readonly matchingKeywordsElementId = generateId();

  @state() private useFloorPlan = false;
  @state() private furnishRoom = true;
  @state() private generating = false;
  @state() private roomWidth = 4.572; // Meters. 180 inches or 15ft
  @state() private roomDepth = 3.6576; // Meters. 144 inches or 12ft
  @state() private roomHeight = 2.4384; // Meters. 96 inches or 8ft
  @state() private floorPlanConfigurations = ['default floor plan'];
  @state() private selectedFloorPlanConfiguration?: string;
  @state() private roomCategory: RoomCategoryType = 'living room'; // Set a default.
  @state() private furniturePlacementType?: FurniturePlacementType;
  @state() private furnitureSelectionType?: FurnitureSelectionType;
  @state() private matchingKeywords = 'Amazon Brand';

  static override sharedStyles: SharedStylesheet[] = [
    {
      id: 'room-creation-modal',
      content: css`
        room-creation-modal {
          display: block;
        }
      `
    }
  ];

  protected override useState(state: IAppState) {
    log.trace('room-creation-modal got state update', state);

    let requestUpdate = false;

    if (this.furniturePlacementType !== state.furniturePlacementType) {
      this.furniturePlacementType = state.furniturePlacementType;

      requestUpdate = true;
    }

    if (this.furnitureSelectionType !== state.furnitureSelectionType) {
      this.furnitureSelectionType = state.furnitureSelectionType;

      requestUpdate = true;
    }

    if (requestUpdate) { this.requestUpdate(); }
  }

  protected override useMessageBus() { 
    this.addSubscriber(bus.subscribe(roomEvents.createRoom, async (_event) => {
      log.trace(`room-creation-modal got ${roomEvents.createRoom} event`);

      this.showModal();
    }));
  }

  private showModal() {
    log.trace('showModal');

    if (!this.roomCreationModal) {
      this.roomCreationModal = new Modal(this.roomCreationModalElement!);
    }

    this.roomCreationModal.show();

    this.requestUpdate();
  }

  protected override render() {
    log.trace('furniturePlacementType', this.furniturePlacementType, 'furnitureSelectionType', this.furnitureSelectionType);

    return html`
      <div id=${this.roomCreationModalElementId} class='modal fade' tabindex='-1' role='dialog' aria-labelledby='${this.roomCreationModalElementId}Label' aria-hidden='true'>
        <div class='modal-dialog' role='document'>
          <div class='modal-content'>
            <div class='modal-header'>
              <h5 class='modal-title' id='${this.roomCreationModalElementId}Label'>Create Room</h5>
              <button type='button' class='close' data-dismiss='modal' aria-label='Close' @click=${this.closeModal}>
                <span aria-hidden='true'>&times;</span>
              </button>
            </div>
            <div class='modal-body brd-modal-body-overflow-to-scroll'>
              <form>

                <section>
                  <h3>Room Category</h3>
                  <select id='${this.roomCreationModalElementId}room-category' class='form-select' aria-label='room category'>
                    ${roomCategories.map(roomCategory => {
                      return html`<option .selected=${this.roomCategory === roomCategory} .value='${this.roomCategory}' @click='${ (_event: MouseEvent) => this.setRoomCategory(roomCategory) }'>${roomCategory}</option>`;
                    })}
                  </select>
                </section>

                <hr/>

                <section>
                  <h3>Floor Plan</h3>
                  <div class='form-check'>
                    <input 
                      class='form-check-input' 
                      type='radio' 
                      name='dont-use-floor-plan' 
                      id='${this.roomCreationModalElementId}dont-use-floor-plan' 
                      .checked=${!this.useFloorPlan} 
                      @click='${ (_event: MouseEvent) => this.useFloorPlan = false }'>
                    <label 
                      class='form-check-label' 
                      for='${this.roomCreationModalElementId}dont-use-floor-plan'>Specify simple dimensions</label>
                  </div>

                  <!-- Disabled because currently scene floor is fixed to these dimensions. -->
                  <div class='form-group row p-1' ?hidden=${this.useFloorPlan}>
                    <div class='col-3'>
                      <input disabled type='number' id=${this.roomWidthElementId} class='form-control' .value=${this.roomWidth.toString()} @input=${this.setRoomWidth} placeholder=${this.roomWidth} />
                      <label 
                        class='form-check-label' 
                        for='${this.roomWidthElementId}'>Room Width (meters)</label>
                    </div>
                    <div class='col-4'>
                      <input disabled type='number' id=${this.roomDepthElementId} class='form-control' .value=${this.roomDepth.toString()} @input=${this.setRoomDepth} placeholder=${this.roomDepth} />
                      <label 
                        class='form-check-label' 
                        for='${this.roomDepthElementId}'>Room Depth (meters)</label>
                    </div>
                    <div class='col-3'>
                      <input disabled type='number' id=${this.roomHeightElementId} class='form-control' .value=${this.roomHeight.toString()} @input=${this.setRoomHeight} placeholder=${this.roomHeight} />
                      <label 
                        class='form-check-label' 
                        for='${this.roomHeightElementId}'>Room Height (meters)</label>
                    </div>
                  </div>

                  <div class='form-group p-1' ?hidden=${!this.useFloorPlan}>
                    <select id='${this.roomCreationModalElementId}floor-plan' class='form-select' aria-label='floor plan'>
                      ${this.floorPlanConfigurations.map(floorPlanConfiguration => {
                        return html`<option .selected=${this.selectedFloorPlanConfiguration === floorPlanConfiguration} .value='${floorPlanConfiguration}'>${floorPlanConfiguration}</option>`;
                      })}
                    </select>
                  </div>
                </section>

                <hr/>

                <section>
                  <h3>Room Furnishings</h3>
                  <div class='form-check'>
                    <input 
                      class='form-check-input' 
                      type='radio' 
                      name='furnished' 
                      id='${this.roomCreationModalElementId}furnished' 
                      .checked=${this.furnishRoom} 
                      @click='${ (_event: MouseEvent) => { this.furnishRoom = true; } }'>
                    <label 
                      class='form-check-label' 
                      for='${this.roomCreationModalElementId}furnished'>With Furniture</label>
                  </div>
                  <div class='form-check'>
                    <input 
                      class='form-check-input' 
                      type='radio' 
                      name='unfurnished' 
                      id='${this.roomCreationModalElementId}unfurnished' 
                      .checked=${!this.furnishRoom} 
                      @click='${ (_event: MouseEvent) => { this.furnishRoom = false; } }'>
                    <label 
                      class='form-check-label' 
                      for='${this.roomCreationModalElementId}unfurnished'>Empty</label>
                  </div>
                </section>

                <hr/>

                <section ?hidden=${this.furnishRoom}>
                  <h3>Furniture Placement Method</h3>
                  <p>None.</p>
                </section>
                
                <section ?hidden=${!this.furnishRoom}>
                  <h3>Furniture Placement Method</h3>
                  <div class='form-check'>
                    <input 
                      class='form-check-input' 
                      type='radio' 
                      name='random' 
                      id='${this.roomCreationModalElementId}random' 
                      .checked=${this.furniturePlacementType === 'random'} 
                      @click='${ (_event: MouseEvent) => this.updateFurniturePlacementType('random') }'>
                    <label 
                      class='form-check-label' 
                      for='${this.roomCreationModalElementId}random'>Random</label>
                  </div>
                  <div class='form-check'>
                    <input 
                      class='form-check-input' 
                      type='radio' 
                      name='autointeriorblog' 
                      id='${this.roomCreationModalElementId}autointeriorblog' 
                      .checked=${this.furniturePlacementType === 'autointeriorblog'} 
                      @click='${ (_event: MouseEvent) => this.updateFurniturePlacementType('autointeriorblog') }'>
                    <label 
                      class='form-check-label' 
                      for='${this.roomCreationModalElementId}autointeriorblog'>Autointeriorblog</label>
                  </div>
                  <div class='form-check'>
                    <input 
                      class='form-check-input' 
                      type='radio'
                      name='llm' 
                      id='${this.roomCreationModalElementId}llm' 
                      .checked=${this.furniturePlacementType === 'llm'} 
                      @click='${ (_event: MouseEvent) => this.updateFurniturePlacementType('llm') }'>
                    <label 
                      class='form-check-label' 
                      for='${this.roomCreationModalElementId}llm'>LLM</label>
                  </div>
                </section>

                <hr/>

                <section ?hidden=${this.furnishRoom}>
                  <h3>Furniture Selection Method</h3>
                  <p>None.</p>
                </section>

                <section ?hidden=${!this.furnishRoom}>
                  <h3>Furniture Selection Method</h3>
                  <div class='form-check'>
                    <input 
                      class='form-check-input' 
                      type='radio' 
                      name='matching-search' 
                      id='${this.roomCreationModalElementId}matching-search' 
                      .checked=${this.furnitureSelectionType === 'matching search'} 
                      @click='${ (_event: MouseEvent) => this.updateFurnitureSelectionType('matching search') }'>
                    <label 
                      class='form-check-label' 
                      for='${this.roomCreationModalElementId}matching-search'>Matching search</label>
                  </div>
                  <div class='form-group p-1' ?hidden=${this.furnitureSelectionType !== 'matching search'}>
                    <textarea id=${this.matchingKeywordsElementId} class='form-control' .value=${this.matchingKeywords!} @input=${this.setMatchingKeywords} rows='1' placeholder='Amazon Brand'></textarea>
                  </div>
                </section>

                <hr/>
              </form>
            </div>
            <div class='modal-footer'>
              <button type='button' class='btn btn-secondary' data-dismiss='modal' @click=${this.closeModal}>Close</button>
              <button .disabled=${this.generating} type='button' class='btn btn-primary' data-dismiss='modal' @click=${this.createRoom}>Generate</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private setRoomWidth() { 
    this.roomWidth = Number(this.roomWidthElement?.value || '');
  }

  private setRoomDepth() { 
    this.roomDepth = Number(this.roomDepthElement?.value || '');
  }

  private setRoomHeight() { 
    this.roomHeight = Number(this.roomHeightElement?.value || '');
  }

  private setRoomCategory(roomCategory: RoomCategoryType) { 
    this.roomCategory = roomCategory;
  }

  private setMatchingKeywords() { 
    this.matchingKeywords = this.matchingKeywordsElement?.value || '';
  }

  private updateFurniturePlacementType(furniturePlacementType: FurniturePlacementType) {
    appState.setFurniturePlacementType(furniturePlacementType); 
  }

  private updateFurnitureSelectionType(furnitureSelectionType: FurnitureSelectionType) {
    appState.setFurnitureSelectionType(furnitureSelectionType); 
  }

  private async createRoom() {
    if (this.generating) { return; }

    log.trace('createRoom');

    // This room has no windows and doors.
    const roomDescription: ISimpleRoomDescription = { 
      widthInMeters: this.roomWidth,
      depthInMeters: this.roomDepth,
      heightInMeters: this.roomHeight,
      roomCategory: this.roomCategory
    };

    if (!this.furnishRoom) {
      const roomConfiguration: IRoomConfiguration = {
        id: new Date().getTime().toString(),
        area_size_x: roomDescription.widthInMeters,
        //area_size_y: roomDescription.heightInMeters,
        area_size_z: roomDescription.depthInMeters,
        objects: []
      }

      const yaml = fileUtils.convertJSONToYAML(roomConfiguration);

      roomComms.emitImportRoomFromYamlEvent(yaml, true);

      this.closeModal();

      return;
    }

    try {
      const roomCreationArgs: IRoomCreationArgs = {
        roomDescription,
        fillTarget: .3,
        furnitureSearchSelectionKeywords: this.furnitureSelectionType === 'matching search' ? this.matchingKeywords.split(' ') : undefined,
        furniturePlacementType: appState.get().furniturePlacementType, 
        furnitureSelectionType: appState.get().furnitureSelectionType,
        //visualizer
      }
      
      this.closeModal();

      this.generating = true; 

      appContext.incrementThinkingCount();
      appContext.notifyUser({ text: roomText.generatingRoomConfig, error: false });

      let yaml: string | undefined;

      switch (this.furniturePlacementType) {
        case 'random':
          yaml = await generateRandomRoomConfiguration(roomCreationArgs);
          break;
        case 'autointeriorblog':
          yaml = await generateAutoInteriorBlogRoomConfiguration(roomCreationArgs);
          break;
        case 'llm':
          yaml = await this.generateLLMRoomConfiguration(roomCreationArgs);
          break;
      }    

      log.debug('generated yaml', yaml);
      if (!yaml) { throw Error(roomText.failedToGenerateRoom('Invalid room configuration was generated.')); }

      appContext.notifyUser({ text: roomText.downloadingModelsForGeneratedRoom, error: false });
      roomComms.emitImportRoomFromYamlEvent(yaml, true);
    } catch (error) {
      log.error(error);
      
      appContext.notifyUser({ text: roomText.failedToGenerateRoom(error), error: true });

      return;
    } finally {
      this.generating = false; 

      appContext.decrementThinkingCount();
    }
  }

  private async generateLLMRoomConfiguration(roomCreationArgs: IRoomCreationArgs): Promise<string> {
    log.trace('generateLLMRoomConfiguration', roomCreationArgs);
    
    const roomConfiguration = await apiClient.generateRoomConfiguration(roomCreationArgs);
    
    return fileUtils.convertJSONToYAML(roomConfiguration);
  }

  private closeModal() { 
    this.roomCreationModal?.hide();
  }

  protected override async onInit() {
    // Elements now exist.
    this.roomCreationModalElement = this.getElement(this.roomCreationModalElementId);
    this.roomWidthElement = this.getElement<HTMLInputElement>(this.roomWidthElementId);
    this.roomDepthElement = this.getElement<HTMLInputElement>(this.roomDepthElementId);
    this.roomHeightElement = this.getElement<HTMLInputElement>(this.roomHeightElementId);
    this.matchingKeywordsElement = this.getElement<HTMLInputElement>(this.matchingKeywordsElementId);

    this.furniturePlacementType = appState.get().furniturePlacementType;
    this.furnitureSelectionType = appState.get().furnitureSelectionType;
  }

  override async destroy() {
    log.trace('destroy room-creation-modal');
  }
}