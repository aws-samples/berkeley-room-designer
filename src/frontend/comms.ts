// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for providing event emitters for the website.
import * as log from 'ts-app-logger';

import { EventBus } from 'ts-bus';
export const bus = new EventBus();

export class CommunicationsManager {
  listeners = new Map<string, EventListener[]>();
  subscribers: CallableFunction[] = [];

  rootElement: HTMLElement | Window & typeof globalThis | ShadowRoot;

  constructor(rootElement: HTMLElement | Window & typeof globalThis | ShadowRoot) {
    this.rootElement = rootElement;
  }

  // You'll need to currently cast EventListener. See: https://github.com/microsoft/TypeScript/issues/28357#issuecomment-436484705
  addListener(eventName: string, eventListener: EventListener) {
    if (this.listeners.has(eventName)) {
      const listeners = this.listeners.get(eventName);

      if (!listeners) {
        this.listeners.set(eventName, [eventListener]);
      } else {
        listeners.push(eventListener);
      
        this.listeners.set(eventName, listeners);
      }
    } else {
      this.listeners.set(eventName, [eventListener]);
    }

    this.rootElement.addEventListener(eventName, (event: any) => {
      eventListener(event);
    });
  }

  addSubscriber(subscriber: CallableFunction) {
    this.subscribers.push(subscriber);
  }

  destroy() {
    this.removeEventListeners();
    this.removeSubscribers();
  }

  private removeEventListeners() {
    log.debug('removeEventListeners');

    for (const eventListener of this.listeners) {
      const eventName = eventListener[0];
      const listeners = eventListener[1];

      listeners.forEach(listener => {
        log.debug('Removing event listener for', eventName);

        this.rootElement.removeEventListener(eventName, listener);
      });
    }
  }

  private removeSubscribers() {
    log.debug('removeSubscribers');

    this.subscribers.forEach(subscriber => { subscriber(); }); // This unsubscribes.
  }
}