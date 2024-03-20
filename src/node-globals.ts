// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// When we run Node.js and specify TypeScript files, we need to specify some global variables.
// These variables might be set differently locally vs deployed to AWS.
// Not sure if this is the best way to do this since the frontend has its own actual .d.ts file in src/frontend/types. 
// See: 
// * https://stackoverflow.com/questions/72187763/how-to-include-a-global-file-type-declaration-in-a-typescript-node-js-package
// * https://stackoverflow.com/questions/77427684/typescript-globalthis-for-browser-and-node-js-element-implicitly-has-an-any-t
import { IBerkeleySearch } from './frontend/iface';

declare global {
  var berkeleySearch: IBerkeleySearch;
  var app_location: string | undefined; // Used to configure AWS client in generateLLMRoomConfiguration for local AWS CLI profile.
  var api_url: string | undefined;
}