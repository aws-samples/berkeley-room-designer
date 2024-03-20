// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for providing a inter-process comm server for receiving information about data that was rendered (for debugging purposes).
// The data is being sent from other Node.js processes.
import * as log from 'ts-app-logger';
import * as crocket from 'crocket';

export class VisualizerServer {
  server: any;
  onData?: CallableFunction;

  constructor() { this.server = new crocket.default(); }

  async init(args?: { onData?: CallableFunction }) {
    this.onData = args?.onData;

    return new Promise((resolve: any, reject: any) => {
      this.server.listen({ port: 3304 }, (error: any) => { 
        if (error) { return reject(error); }; 
      
        log.debug('VisualizerServer listening');

        return resolve();
      });
      
      this.server.on('/rendered', (message: IMessage) => {
        log.trace('VisualizerServer -> /rendered', message);

        if (this.onData) { this.onData(message); }
      });

      this.server.on('error', (error: any) => { log.error('VisualizerServer error occurred: ', error); });
    });
  }
}

export interface IMessage {
  data: any;
  name: string;
}