
import {components, operations} from './spec';
import {EmptyObject, Property} from './utils';

export type Schemas = Property<components, 'schemas', EmptyObject>;
export type Responses = Property<components, 'responses', EmptyObject>;
export type Operations = operations;

export * from './requests';
export * from './handlers';