// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for providing a client capable of sending information to render (for debugging purposes) to other Node.js processes.
import * as log from 'ts-app-logger';
import * as crocket from 'crocket';

import { IMessage } from '../cli.visualizer/ipc';

import { IRoomConfiguration } from '../frontend/room-designer/iface';

import { ISimpleRoomDescription } from '../frontend/furniture-placement/iface';

import { IFittingLayout } from '../frontend/furniture-placement/autointeriorblog/iface';

export class RendererClient {
  initialized: boolean = false;
  client: any;
  render?: CallableFunction;

  constructor() { this.client = new crocket.default(); }

  async init(args?: { render?: CallableFunction }) {
    this.render = args?.render;

    return new Promise((resolve: any, reject: any) => {
      this.client.connect({ port: 3305, timeout: 20 * 1000 }, (error: any) => { 
        if (error) { return reject(error); }; 
      
        log.debug('RendererClient connected');

        this.initialized = true;

        return resolve();
      });

      if (this.render) {
        this.client.on('/render', async (message: IMessage) => { 
          log.trace('RendererClient -> /render');

          if (this.render) { await this.render({ objectToVisualize: message.data, name: message.name }); }
        });
      }

      this.client.on('error', (error: any) => { log.error('RendererClient error occurred: ', error); });
    })
  }

  tryRender(objectToVisualize: ISimpleRoomDescription | IFittingLayout | IRoomConfiguration, name: string) {
    if (!this.initialized) { return; }
    
    log.trace('RendererClient.tryRender', name);

    this.client.emit('/try-render', { data: objectToVisualize, name });
  }
}