// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for defining the export preview modal component.
import * as log from 'ts-app-logger';
import { html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { Modal } from 'bootstrap';
import YAML from 'yaml';

import { WebComponent, SharedStylesheet } from '../web-component';

import { appContext } from '../context';
import { generateId } from '../ui.id';
import { IAppContext } from '../iface';

@customElement('export-preview-modal')
export class ExportPreviewModal extends WebComponent {
  private exportPreviewModalElement?: HTMLElement;
  private readonly exportPreviewModalElementId = generateId();
  private exportPreviewModal?: Modal;

  @state() private exportPreview? = '';

  static override sharedStyles: SharedStylesheet[] = [
    {
      id: 'export-preview-modal',
      content: css`
        export-preview-modal {
          display: block;
        }
      `
    }
  ];

  protected override useContext(context: IAppContext) {
    log.trace('export-preview-modal got context update', context);

    if (context.exportPreview) {
      this.exportPreview = YAML.stringify(context.exportPreview).replaceAll('\n', '<br/>');

      this.showModal();
    }
  }

  protected override render() {
    return html`
      <div id=${this.exportPreviewModalElementId} class='modal fade' tabindex='-1' role='dialog' aria-labelledby='${this.exportPreviewModalElementId}Label' aria-hidden='true'>
        <div class='modal-dialog' role='document'>
          <div class='modal-content'>
            <div class='modal-header'>
              <h5 class='modal-title' id='${this.exportPreviewModalElementId}Label'>Export Preview</h5>
              <button type='button' class='close' data-dismiss='modal' aria-label='Close' @click=${this.closeModal}>
                <span aria-hidden='true'>&times;</span>
              </button>
            </div>
            <div class='modal-body brd-modal-body-overflow-to-scroll'>
              <code>${unsafeHTML(this.exportPreview)}</code>
            </div>
            <div class='modal-footer'>
              <button type='button' class='btn btn-secondary' data-dismiss='modal' @click=${this.closeModal}>Close</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private showModal() {
    log.trace('showModal');

    if (!this.exportPreviewModal) {
      this.exportPreviewModal = new Modal(this.exportPreviewModalElement!);
    }

    this.exportPreviewModal.show();
  }

  private closeModal() { 
    this.exportPreviewModal?.hide();

    this.exportPreview = undefined;
    appContext.setExportPreview(undefined);
  }

  protected override async onInit() {
    // Element now exists.
    this.exportPreviewModalElement = this.getElement(this.exportPreviewModalElementId);
  }

  override async destroy() {
    log.trace('destroy export-preview-modal');
  }
}