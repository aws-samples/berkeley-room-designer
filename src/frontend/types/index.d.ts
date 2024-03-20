// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
export {};

declare global {
  interface Window {}

  // All of these window vars are set in ../index.html in a <script> tag.
  // Some come from ./config/.env data, others come from infra deployment.
  // FIXME These are sort of duplicated in ../../node-globals.ts.
  var app_location: string | undefined;
  var api_url: string | undefined;

  var berkeleySearch: IBerkeleySearch;
}