
import {Request, Response} from '@openapi-ts/request-types';
import {OperationParams, RequestHandler} from '@openapi-ts/backend';
import {operations} from './spec';
import {OperationRequest, OperationResponse} from './requests';

export type OperationHandler<T, OperationId extends keyof operations> = RequestHandler<OperationParams<T>,
    OperationRequest<OperationId>,
    OperationResponse<OperationId>>;
    
export interface OperationHandlers<T>
    extends Record<string, RequestHandler<OperationParams<T>, Request<any, any, any, any>, Response<any, any>>> {
  test: OperationHandler<T, 'test'>;
  generateRoomConfiguration: OperationHandler<T, 'generateRoomConfiguration'>;
}   
