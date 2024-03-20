// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for defining our component abstraction.
// We chose Lit (w/o shadow DOM) because:
// * The DOM and templating utilities it offered worked well enough (and the ones that didn't - context et. al. - we ignored)
// * We came to like the "single-file" HTML/CSS/JS paradigm after working in separate files all our lives
// References: 
// * https://github.com/thisdot/blog-demos/blob/litelement-autofill-with-shadow-dom/a-tale-of-form-autofill-litelement-and-the-shadow-dom/src/injection-example/components/style-injector.ts
// * https://www.thisdot.co/blog/how-to-share-styles-in-web-components-with-litelement-and-typescript/
import * as log from 'ts-app-logger';
import { LitElement, CSSResult } from 'lit';
import { property, state } from 'lit/decorators.js';

import { appState } from './state';
import { appContext } from './context';
import { IAppContext, IAppState } from './iface';
import { CommunicationsManager } from './comms';

export abstract class WebComponent extends LitElement {
  // See: https://stackoverflow.com/questions/60678891/how-can-i-change-a-boolean-property-in-lit-element-to-hide-content-on-my-compone
  @property({ attribute: false, type: String, reflect: true }) hide: string = 'hide';
  @property({ attribute: false, type: Boolean, reflect: true }) loading: boolean = false;

  @state() init = false;

  protected stateSubscriberId: number = -1;
  protected contextSubscriberId: number = -1;

  protected communicationsManager?: CommunicationsManager;
 
  static sharedStyles: SharedStylesheet[] = [];

  // The connectedCallback() hook can fire more than once. 
  // For example, if you remove an element and then insert it into another position, 
  //  such as when you reorder a list, the hook fires several times. 
  // If you want code to run one time, write code to prevent it from running twice.
  override connectedCallback() {
    if (this.init) { return; }
    this.init = true;

    const { sharedStyles } = this.constructor as any;
    
    if (sharedStyles) {
      sharedStyles.forEach((stylesheet: SharedStylesheet) => {
        injectSharedStylesheet(
          this,
          stylesheet.id,
          stylesheet.content.toString()
        );
      });
    }

    super.connectedCallback();

    this.communicationsManager = new CommunicationsManager(this.getRootElement());

    this.useListeners(); // Will call component impl if overridden.
    this.useMessageBus(); // Will call component impl if overridden.
    this.awaitStateAndContextUpdates();
  }

  protected useListeners() { } // Component impl to override.
  protected useMessageBus() { } // Component impl to override.
  protected useState(_state: IAppState) {} // Component impl to override.
  protected useContext(_context: IAppContext) {} // Component impl to override.

  protected awaitStateAndContextUpdates() {
    this.stateSubscriberId = appState.subscribe((state: IAppState) => { this.useState(state); });
    this.contextSubscriberId = appContext.subscribe((context: IAppContext) => { this.useContext(context); });
  }

  protected override createRenderRoot(): ShadowRoot | this {
    return this; // Disable shadow dom.
  }

  protected getRootElement(): ShadowRoot | HTMLElement |  Window & typeof globalThis {
    return window; // Just using window. 
  }

  override async firstUpdated() {
    log.trace('firstUpdated');

    this.loading = true;

    // See: https://stackoverflow.com/questions/54512325/getting-width-height-in-a-slotted-lit-element-in-edge
    setTimeout(async () => { 
      await this.onInit(); 

      this.loading = false;
    }, 0);
  }

  protected async onInit() { this.loading = false; } // Component impl to override.

  protected getElement<T = HTMLElement>(id: string): T {
    return window.document.getElementById(id) as T; // Just using window rather than element.
  }

  // You'll need to currently cast EventListener. See: https://github.com/microsoft/TypeScript/issues/28357#issuecomment-436484705
  protected addListener(eventName: string, eventListener: EventListener) {
    log.trace('addListener', eventName);

    this.communicationsManager?.addListener(eventName, eventListener);
  }

  protected addSubscriber(subscriber: CallableFunction) {
    this.communicationsManager?.addSubscriber(subscriber);
  }

  override disconnectedCallback() {
    log.trace('disconnectedCallback');

    this.communicationsManager?.destroy();
    this.destroy();

    super.disconnectedCallback();
  }

  protected async destroy() {} // Component impl to override.
}

export interface SharedStylesheet {
  id: string;
  content: CSSResult;
}

type DocumentOrShadowRoot = Document | ShadowRoot;

const documentStylesheets: { [key: string]: DocumentOrShadowRoot[] } = {};
const sharedStylesheets: { [key: string]: CSSStyleSheet } = {};

export function injectSharedStylesheet(
  element: Element,
  id: string,
  content: string
) {
  const root = element.getRootNode() as DocumentOrShadowRoot;

  if (root.adoptedStyleSheets != null) {
    evictDisconnectedRoots();

    const rootNodes = documentStylesheets[id] ?? [];
    if (rootNodes.find(value => value === root)) {
      return;
    }

    let sharedStylesheet = sharedStylesheets[id];
    if (sharedStylesheet == null) {
      sharedStylesheet = new CSSStyleSheet();
      sharedStylesheet.replaceSync(content);
      sharedStylesheets[id] = sharedStylesheet;
    }

    root.adoptedStyleSheets.push(sharedStylesheet);
    if (documentStylesheets[id] != null) {
      documentStylesheets[id].push(root);
    } else {
      documentStylesheets[id] = [root];
    }
  } else {
    // Inject <style> manually into the document if adoptedStyleSheets is not supported.

    const target = root === document ? document.head : root;
    if (target?.querySelector(`#${id}`)) {
      return;
    }

    const styleElement = document.createElement('style');
    styleElement.id = id;
    styleElement.appendChild(document.createTextNode(content));

    target.appendChild(styleElement);
  }
}

function evictDisconnectedRoots() {
  Object.entries(documentStylesheets).forEach(([id, roots]) => {
    documentStylesheets[id] = roots.filter(root => root.isConnected);
  });
}