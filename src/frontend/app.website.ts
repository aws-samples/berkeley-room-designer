// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for defining the entrypoint of the website.
import * as log from 'ts-app-logger';
import { Router } from '@lit-labs/router';
import { html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

import { WebComponent, SharedStylesheet } from './web-component';
import { appContext } from './context';
import * as apiClient from './api-client';

import { cacheDbPages } from './berkeley-search/search';

import './nav-menu';
import './room-designer/modal.export-preview';
import './room-designer/modal.room-creation';
import './page.room-designer';
import './page.room-configurations';

@customElement('the-website')
export class Website extends WebComponent {
  private router = new Router(this, [
    { path: '/room-configurations', render: () => html`<room-configurations-page></room-configurations-page>` },
    { path: '/:id', render: ({id}) => html`<room-designer-page .roomConfigurationId=${id}></room-designer-page>` },
    { path: '/*', render: () => html`<room-designer-page></room-designer-page>` },
  ]);

  static override sharedStyles: SharedStylesheet[] = [
    {
      id: 'the-website',
      content: css`
        the-website {
          display: block;
        }
      `
    }
  ];

  override connectedCallback(): void {
    super.connectedCallback();

    (globalThis as any).router = this.router;
    
    // Having trouble getting the router to play nicely in a SPA! (like here: https://github.com/vid/lit-router-example/blob/main/src/reviews-shell.ts)
    // So, just changing the URL.
    (globalThis as any).router.load = (link: string) => {
      window.location.href = link;
    }

    super.connectedCallback();
  }

  protected override render() {
    return html`
      <nav-menu></nav-menu>

      <!-- These can't live in a .dropdown-menu because the modal will hide when the menu does.-->
      <room-creation-modal></room-creation-modal>
      <export-preview-modal></export-preview-modal>

      <main>${this.router.outlet()}</main>
    `;
  }

  protected override async onInit() {
    try {
      appContext.incrementThinkingCount();

      console.debug('berkeleySearch', globalThis.berkeleySearch); // Should be available to window.

      await globalThis.berkeleySearch.init();

      if (globalThis.app_location === 'aws') { // When deployed to AWS...
        apiClient.warmUp(); // ...warm-up API (otherwise Endpoint request timed out seems to happen initially)
        await cacheDbPages(); // ...warm-up search (otherwise, after CloudFront invalidation, realllyyy slow)
      }
    } catch (error) {
      log.error('Error initializing app', error);

      // @ts-ignore
      const errorMessage = error.result.message;
  
      appContext.notifyUser({ text: `Error initializing app: ${errorMessage}`, error: true });
    } finally {
      appContext.decrementThinkingCount();
    }
  }

  override async destroy() {
    log.trace('destroy the-website');
  }
}