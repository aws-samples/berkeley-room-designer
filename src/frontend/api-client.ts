// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
import * as log from 'ts-app-logger';

import createClient from 'openapi-fetch';

import * as apiIface from '../openapi-def/types/index';

import { IRoomCreationArgs } from './furniture-placement/iface';
import { IRoomConfiguration } from './room-designer/iface';

const url = new URL(window.location.href);

// This doesn't use globalThis.api_url, but if you want to develop locally against an AWS deployment, that's the way to do it.
const { GET, POST } = createClient<apiIface.paths>({ baseUrl: `${url.protocol}//${url.host}/api` });

export const warmUp = async (): Promise<any> => {
  log.debug('warmUp api client');

  const { data } = await GET('/test', {});

  log.debug('data', data);

  return data;
}

export const generateRoomConfiguration = async (roomCreationArgs: IRoomCreationArgs): Promise<IRoomConfiguration> => {
  log.debug('generateRoomConfiguration api client');

  // This application mostly uses interfaces defined in TypeScript, not generated by OpenAPI definitions.
  // This is because this application is largely client-side!
  // In this case, map our client-side IRoomCreationArgs (which contain visualizer info) to the server-side IRoomCreationArgs,
  //  of which whose interface is dictated by an OpenAPI spec.
  const { data } = await POST('/room-configuration', {
    body: {
      roomDescription: roomCreationArgs.roomDescription,
      fillTarget: roomCreationArgs.fillTarget,
      furniturePlacementType: roomCreationArgs.furniturePlacementType,
      furnitureSelectionType: roomCreationArgs.furnitureSelectionType,
      furnitureSearchSelectionKeywords: roomCreationArgs.furnitureSearchSelectionKeywords
    }
  });

  log.debug('generated room data', data?.data);

  return data?.data as unknown as IRoomConfiguration;
}