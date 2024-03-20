// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for providing a inter-process comm client and server for receiving/sending information about rendering (for debugging purposes).
// The data is being received from/sent to other Node.js processes.
import * as log from 'ts-app-logger';
import * as crocket from 'crocket';

import { IMessage } from '../cli.visualizer/ipc';

export class SyntheticDataGenerationMessengerServer {
  server: any;
  tryRender?: CallableFunction;

  constructor() { this.server = new crocket.default(); }

  async init(args?: { tryRender?: CallableFunction }) {
    this.tryRender = args?.tryRender;

    return new Promise((resolve: any, reject: any) => {
      this.server.listen({ port: 3305 }, (error: any) => { 
        if (error) { return reject(error); }; 
      
        log.debug('SyntheticDataGenerationMessengerServer listening');

        return resolve();
      });
    
      this.server.on('/try-render', (message: IMessage) => {
        log.trace('SyntheticDataGenerationMessengerServer -> /try-render');

        if (this.tryRender) { this.tryRender(message); }
      });

      this.server.on('error', (error: any) => { log.error('SyntheticDataGenerationMessengerServer error occurred: ', error); });
    });
  }
}

export class VisualizerClient {
  client: any;

  constructor() { this.client = new crocket.default(); }

  async init() {
    return new Promise((resolve: any, reject: any) => {
      this.client.connect({ port: 3304 }, (error: any) => { 
        if (error) { return reject(error); }; 
      
        log.debug('VisualizerClient connected');

        return resolve();
      });

      this.client.on('error', (error: any) => { log.error('VisualizerClient error occurred: ', error); });
    })
  }

  rendered(file: string, name: string) {
    log.trace('VisualizerClient.rendered', file, name);

    this.client.emit('/rendered', { data: file, name });
  }
}
