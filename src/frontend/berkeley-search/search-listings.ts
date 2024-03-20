// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for providing a search interface for listings.
// It can be configured to use either an AWS-based open search interface,
//  or a WASM-based sqlite search interface.
import * as log from 'ts-app-logger';
import { html, css, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import * as rxjs from 'rxjs';
import { Modal } from 'bootstrap';

import { appContext } from '../context';
import { WebComponent, SharedStylesheet } from '../web-component';
import * as roomComms from '../room-designer/comms';
import { generateId } from '../ui.id';

import { IListing } from '../room-designer/iface';

import { findListings } from './search';
import * as text from './text';

@customElement('search-listings')
export class SearchListings extends WebComponent {
  private currentListingsPage = 1;
  private listingsPerPage = 10;

  @state() private searchText: string = ''; // On change triggers listings search.
  @state() private listings: IListing[] = []; // On search result updates results displayed to user.
  @state() private listingToPreview?: IListing;

  private searchElement?: HTMLInputElement;
  private readonly searchElementId = generateId();
  searchElementChangeSubscriber$?: rxjs.Subscription;

  private listingPreviewModalElement?: HTMLElement;
  private readonly listingPreviewModalElementId = generateId();
  private listingPreviewModal?: Modal;

  private listingPreviewImageContainerElement?: HTMLElement;
  private readonly listingPreviewImageContainerElementId = generateId();

  static override sharedStyles: SharedStylesheet[] = [
    {
      id: 'search-listings',
      content: css`
        search-listings {
          display: block;
        }

        .table-overflow-to-scroll {
          overflow-y: scroll;
          max-height: 45vh;
        }

        .scaled-listing-image {
          max-width: 100%;
          max-height: 100%;
        }
      `
    }
  ];

  protected override render() {
    return html`
      <!-- Until pagination UI is implemented, we only return 10 listings, no need to show count -->
      <h3>Search</h3>
      <!--<h3>Search <span ?hidden='${this.listings.length === 0}'>(${this.listings.length})<span></h3>-->
      <div class='container-fluid'>
        <form autocomplete='on' @submit='${this.handleSubmit}'>
          <div class='form-group pt-2'>
            <input type='search' id=${this.searchElementId} class='form-control input-lg' .value=${this.searchText} placeholder='AmazonBasics' @keyup=${this.onSearchTextChanged}/>
          </div>
          <div class='pt-2' ?hidden=${this.listings.length > 0}>
            <p>No search results.</p>
          </div>
          <div class='table-overflow-to-scroll' ?hidden=${this.listings.length === 0}>
            ${this.searchResultsTable()}
            <!--${this.searchResultsPagination()}-->
          </div>
        </form>

        <div id=${this.listingPreviewModalElementId} class='modal fade' tabindex='-1' role='dialog' aria-labelledby='modalLabel' aria-hidden='true'>
          <div class='modal-dialog' role='document'>
            <div class='modal-content'>
              <div class='modal-header'>
                <h5 class='modal-title' id='modalLabel'>Listing Preview</h5>
                <button type='button' class='close' data-dismiss='modal' aria-label='Close' @click=${this.closeListingPreview}>
                  <span aria-hidden='true'>&times;</span>
                </button>
              </div>
              <div class='modal-body brd-modal-body-overflow-to-scroll'>
                <div id=${this.listingPreviewImageContainerElementId}></div>
                <p>Dimensions:</p>
                <blockquote class='blockquote'>
                  <p>~${Math.ceil(this.listingToPreview?.dimensions.width!)}cm X ~${Math.ceil(this.listingToPreview?.dimensions.depth!)}cm X ~${Math.ceil(this.listingToPreview?.dimensions.height!)}cm</p>
                </blockquote>
                <p>Colors:</P>
                <blockquote class='blockquote'>
                  <p>${this.listingToPreview?.colors.split('|').join(', ')}</p>
                </blockquote>
                <p>Keywords:</p>
                <blockquote class='blockquote'>
                  <p>${this.listingToPreview?.keywords.split('|').join(', ')}</p>
                </blockquote>
              </div>
              <div class='modal-footer'>
                <button type='button' class='btn btn-secondary' data-dismiss='modal' @click=${this.closeListingPreview}>Close</button>
              </div>
            </div>
          </div>
        </div>

      </div>
    `;
  }

  private searchResultsTable(): TemplateResult<1> {
    return html`
      <table class='table'>
        <thead>
          <tr>
            <th></th>
            <th></th>
            <th></th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${this.listings.slice(0, this.listingsPerPage - 1).map((listing) => { return html`
          <tr>
            <td><button type='button' class='btn btn-sm btn-dark' @click='${ (_event: MouseEvent) => this.listingSelected(listing) }'>Add</button></td>
            <td><button type='button' class='btn btn-sm btn-dark' @click='${ (_event: MouseEvent) => this.previewListing(listing) }'>Preview</button></td>
            <td>${listing.name}</td>
            <td>${this.getListingImageTemplate(listing)}</td>
          </tr>`;
          })}
        </tbody>
      </table>
    `;
  }

  private getListingImageTemplate(listing: IListing): TemplateResult<1> {
    return listing.imageUrl ? html`<img class='scaled-listing-image' crossorigin='anonymous' src='${listing.imageUrl}?${new Date().getTime()}'/>` : html`<p>N/A</p>`;
  }

  private listingSelected(listing: IListing) {
    log.debug('listingSelected');

    listing.searchText = `${this.searchText}`;

    this.listings = [];
    this.searchText = '';

    roomComms.emitListingSelectedEvent(listing);

    // FIXME Auto-selecting canvas so you can start moving listing around without clicking on canvas first is not working.
    //this.getElement(sceneElement).click();
    //const ctx = document.querySelector("canvas").getContext("2d");

    this.requestUpdate();
  }

  private previewListing(listing: IListing) {
    log.debug('previewListing');

    this.listingToPreview = listing;
    this.listingPreviewModal = new Modal(this.listingPreviewModalElement!);

    appContext.incrementThinkingCount();

    if (listing.modelPreviewUrl) { this.downloadModelPreviewImages(listing); }

    const image = new Image();
    image.classList.add('scaled-listing-image');
    image.onload = () => {
      appContext.decrementThinkingCount();

      this.listingPreviewImageContainerElement!.innerHTML = '';
      this.listingPreviewImageContainerElement!.appendChild(image);
      
      this.listingPreviewModal?.toggle();

      this.requestUpdate();
    };

    image.onerror = (event: any) => {
      log.error('Error loading preview image', event);

      appContext.decrementThinkingCount();
      appContext.notifyUser({ text: text.errorLoadingPreviewImage, error: true });
    };

    image.crossOrigin = 'Anonymous';
    image.src = `${listing.imageUrl}?${new Date().getTime()}`;
  }

  private closeListingPreview() { 
    this.listingToPreview = undefined;
    this.listingPreviewModal?.toggle(); 
  }

  private downloadModelPreviewImages(listing: IListing) {
    log.debug('downloadModelPreviewImages', listing.modelPreviewUrl);

    const images = [];

    // FIXME Unfinished preview feature that previes listing in "360". 
    //for (let i = 0; i++; i < 72) { // 00 - 71
      appContext.incrementThinkingCount();

      //const formattedNumber = i.toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false });

      //log.debug('getting image', formattedNumber);

      const image = new Image();
      image.classList.add('scaled-listing-image');
      image.onload = () => {
        log.debug('got image');
        appContext.decrementThinkingCount();

        images.push(image);

        //this.listingPreviewImageContainerElement!.innerHTML = '';
        //this.listingPreviewImageContainerElement!.appendChild(image);
        
        //this.listingPreviewModal?.toggle();

        this.requestUpdate();
      };

      image.onerror = (event: any) => {
        log.error('Error loading preview image', event);

        appContext.decrementThinkingCount();
        //appContext.notifyUser({ text: 'Error loading preview image.', error: true });
      };

      const imageUrl = listing.modelPreviewUrl;

      image.crossOrigin = 'Anonymous';
      image.src = `${imageUrl}?${new Date().getTime()}`;
    //} 
  }

  // Not used -> limited to 10.
  private searchResultsPagination(): TemplateResult<1> {
    const pageCount = Math.ceil(this.listings.length / this.listingsPerPage);
    //log.debug('pageCount', pageCount);

    const pageTemplates = [];
    for (let pageNumber = 0; pageNumber++; pageNumber <= pageCount) { 
      const pageTemplate = html`<li class='page-item ${this.currentListingsPage === pageNumber ? 'active' : ''}'><a class='page-link' href='#'>${pageNumber}</a></li>`;
      pageTemplates.push(pageTemplate);
    }

    //log.debug('pageTemplates', pageTemplates);

    return html`
      <nav aria-label='Search results pages'>
        <ul class='pagination'>
          <li 
            class='page-item ${this.currentListingsPage === 1 ? 'disabled' : ''}'
            @click='${ (event: MouseEvent) => this.showPreviousSearchResults(event) }'
          ><a class='page-link' href='#'>Previous</a></li>
          ${pageTemplates.join('<br/>')}
          <li 
            class='page-item ${this.currentListingsPage === pageCount ? 'disabled' : ''}' 
            @click='${ (event: MouseEvent) => this.showNextSearchResults(event) }'
          ><a class='page-link' href='#'>Next</a></li>
        </ul>
      </nav>
    `;
  }

  private showPreviousSearchResults(_event: MouseEvent) { this.currentListingsPage--; }

  private showNextSearchResults(_event: MouseEvent) { this.currentListingsPage++; }

  protected override async onInit() {
    // Elements now exist.
    this.searchElement = this.getElement<HTMLInputElement>(this.searchElementId);
    this.listingPreviewModalElement = this.getElement(this.listingPreviewModalElementId);
    this.listingPreviewImageContainerElement = this.getElement<HTMLImageElement>(this.listingPreviewImageContainerElementId);

    this.awaitUserSearching();
  }

  private awaitUserSearching() {
    log.debug('awaitUserSearching');

    this.searchElementChangeSubscriber$ = rxjs
      .fromEvent(this.searchElement!, 'keyup')
      .pipe(
        rxjs.map(event => event as KeyboardEvent),
        rxjs.map(event => event.key),
        rxjs.debounceTime(500)
      )
      .subscribe(_key => {
        //log.debug('got key', key);

        this.search();
      });
  }

  private async search() {
    log.debug('search', this.searchText);
    
    if (!this.searchText || this.searchText === '') { 
      // Emptying input is useful for clearing search.
      this.listings = []; 

      return; 
    }

    const listings = await findListings({ searchText: this.searchText });
    
    this.listings = listings || [];
  }

  private onSearchTextChanged(event: KeyboardEvent) {
    event.preventDefault();
    log.debug('onSearchTextChanged', event.key);

    this.searchText = this.searchElement?.value || '';
  }

  private handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    log.debug('submit ignored');
  }

  override async destroy() {
    log.trace('destroy search-listings');
    
    this.searchElementChangeSubscriber$?.unsubscribe();
  }
}