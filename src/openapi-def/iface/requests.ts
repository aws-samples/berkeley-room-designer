
import {Params, Request, Response} from '@openapi-ts/request-types';
import {operations} from './spec';
import {EmptyObject, Property, ValueOf} from './utils';

export type RequestBody<OperationId extends keyof operations> =
    operations[OperationId] extends {requestBody: Record<string, any>} ?
      ValueOf<operations[OperationId]['requestBody']['content'], void> :
      void;

export type RequestPathParams<OperationId extends keyof operations> =
    Property<Property<operations[OperationId], 'parameters', EmptyObject>, 'path', EmptyObject>;

export type RequestQuery<OperationId extends keyof operations> =
    Property<Property<operations[OperationId], 'parameters', EmptyObject>, 'query', EmptyObject>;

export type RequestHeaders<OperationId extends keyof operations> =
    Property<Property<operations[OperationId], 'parameters', EmptyObject>, 'header', EmptyObject>;

export type ResponseBody<OperationId extends keyof operations> =
    ValueOf<Property<ValueOf<Property<operations[OperationId], 'responses', EmptyObject>>, 'content'>, void>;

export type ResponseHeaders<OperationId extends keyof operations> =
    Property<ValueOf<Property<operations[OperationId], 'responses', EmptyObject>>, 'headers'>;

export type OperationRequest<OperationId extends keyof operations> = Request<
    RequestBody<OperationId>,
    Params & RequestPathParams<OperationId>,
    Params & RequestQuery<OperationId>,
    Params & RequestHeaders<OperationId>>;

export type OperationResponse<OperationId extends keyof operations> = Response<
    ResponseBody<OperationId>,
    Params & ResponseHeaders<OperationId>>;
