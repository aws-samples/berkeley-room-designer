// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for defining our AWS backend API.
import '../node-globals';
globalThis.app_location = process.env.app_location || 'local';

import * as log from 'ts-app-logger';
log.configure({ traceEnabled: globalThis.app_location !== 'aws' , debugEnabled: true, filters: [] });

import * as path from 'path';
import { promises as fs } from 'fs';
import { LambdaOpenApi, LambdaSource } from '@openapi-ts/aws-lambda';
import * as Lambda from 'aws-lambda';

import { IRoomConfiguration } from '../frontend/room-designer/iface';
import { _generateRoomConfiguration as generateLLMRoomConfiguration } from '../frontend/furniture-placement/llm';

import * as API from '../../src/openapi-def/iface/index';
import { BackendBerkeleySearch } from './sqlite-search.backend';

globalThis.berkeleySearch = new BackendBerkeleySearch(path.resolve(process.cwd(), './build-utils/data/berkeley.db'));
await globalThis.berkeleySearch.init();

const operations: API.OperationHandlers<LambdaSource> = {
  test: async (req, _res, _params) => {
    log.debug('test request', req);

    return { status: 'ok', message: 'Test passed.' };
  },
  generateRoomConfiguration: async (req, _res, _params) => {
    log.debug('generateRoomConfiguration request', req);

    const roomCreationParams = req.body as any as API.Schemas['IRoomCreationParams'];

    const roomConfiguration: IRoomConfiguration = await generateLLMRoomConfiguration(roomCreationParams);

    log.debug('generated room configuration', JSON.stringify(roomConfiguration, null, 2));

    return { status: 'ok', message: 'Room configuration generated.', data: roomConfiguration };
  }
};

const api = new LambdaOpenApi()
  .intercept(((_req, _res, params) => {
    log.info(`Intercept event:`, params.data.lambda.event);
  }))
  .register({
    definition: path.resolve(process.cwd(), './src/openapi-def/_api.yaml'),
    operations,
    path: '/'
  });

// We export the this for running locally.
export const handleEvent = async (event: Lambda.APIGatewayProxyEvent): Promise<void | Lambda.APIGatewayProxyResult> => {
  const apiGatewayProxyHandler = await api.eventHandler();

  event.path = event.path.replace('/api', '');
  event.requestContext.path = event.requestContext.path.replace('/api', '');

  const apiGatewayProxyResult = await apiGatewayProxyHandler(event, {} as Lambda.Context, () => {});
  log.debug('apiGatewayProxyResult', apiGatewayProxyResult);

  return apiGatewayProxyResult;
}

if (globalThis.app_location === 'aws') {
  const apiGatewayProxyResult = await handleEvent(JSON.parse(process.argv[2]) as Lambda.APIGatewayProxyEvent);

  await fs.writeFile('/tmp/response.log', JSON.stringify(apiGatewayProxyResult));
  log.debug('Wrote response to file');
}