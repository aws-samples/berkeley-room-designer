#! node
// This file is responsible for defining our local backend API.
// References:
// * https://github.com/dwyl/aws-lambda-test-utils/blob/master/mockEvent.js
import '../node-globals';
globalThis.app_location = 'local';

import * as log from 'ts-app-logger';
log.configure({ traceEnabled: true, debugEnabled: true, filters: [] });

import * as path from 'path';
import * as Lambda from 'aws-lambda';
import Fastify from 'fastify';

import { BackendBerkeleySearch } from '../backend/sqlite-search.backend';

globalThis.berkeleySearch = new BackendBerkeleySearch(path.resolve(process.cwd(), './build-utils/data/berkeley.db'));
await globalThis.berkeleySearch.init();

// Just use the AWS Lambda operations map so we don't duplicate routing locally.
// Must be imported after setting process.env.app_location.
import { handleEvent } from './infra_aws';

const fastify = Fastify();
fastify.get('/*', async(_request, reply) => {
  log.debug('GET /* local backend', _request.url, _request.method);

  const event = createAPIGatewayEvent({ path: _request.url, method: _request.method });
  const apiGatewayProxyResult = await handleEvent(event);
  if (!apiGatewayProxyResult) { throw Error('void apiGatewayProxyResult'); }

  reply.status(apiGatewayProxyResult.statusCode);
  reply.send(apiGatewayProxyResult.body);

  return reply;
});
fastify.post('/*', async(request, reply) => {
  log.debug('POST /* local backend', request.url, request.method, request.body);
 
  const event = createAPIGatewayEvent({ path: request.url, method: request.method, body: JSON.stringify(request.body || {}) });
  const apiGatewayProxyResult = await handleEvent(event);
  if (!apiGatewayProxyResult) { throw Error('void apiGatewayProxyResult'); }

  log.debug('got response', apiGatewayProxyResult.body);

  reply.status(apiGatewayProxyResult.statusCode);
  reply.send(apiGatewayProxyResult.body);

  return reply;
});

log.debug('Local backend API starting: http://localhost:8081/api');

await fastify.listen({ port: 8081, host: process.env.IS_DOCKER ? '0.0.0.0': undefined });

const createAPIGatewayEvent = (args: { 
  stageVariables?: Lambda.APIGatewayProxyEventStageVariables,
  path: string, 
  method: string, 
  headers?: Lambda.APIGatewayProxyEventHeaders, 
  queryStringParameters?: Lambda.APIGatewayProxyEventQueryStringParameters,
  pathParameters?: Lambda.APIGatewayProxyEventPathParameters,
  body?: string,
 }): Lambda.APIGatewayProxyEvent => {
  return {
    resource: '/doesntmatter',
    path: args.path,
    httpMethod: args.method,
    headers: args.headers || {},
    queryStringParameters: args.queryStringParameters || {},
    pathParameters: args.pathParameters || {},
    stageVariables: args.stageVariables || {},
    multiValueHeaders: {},
    multiValueQueryStringParameters: {},
    requestContext: {
      accountId: '12345678901',
      apiId: '12345',
      protocol: 'http',
      httpMethod: args.method,
      authorizer: undefined,
      path: args.path,
      stage: 'prod',
      requestId: '1',
      requestTimeEpoch: new Date().getTime(),
      resourceId: 'snmm5d',
      resourcePath: args.path,
      identity: {
        accessKey: null,
        accountId: null,
        apiKey: null,
        apiKeyId: null,
        caller: null,
        clientCert: null,
        cognitoAuthenticationProvider: null,
        cognitoAuthenticationType: null,
        cognitoIdentityId: null,
        cognitoIdentityPoolId: null,
        principalOrgId: null,
        sourceIp: '127.0.0.1',
        user: null,
        userAgent: null,
        userArn: null,
      }
    },
    body: args.body || null,
    isBase64Encoded: false
  }
};