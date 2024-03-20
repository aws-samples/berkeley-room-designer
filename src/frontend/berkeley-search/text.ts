// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
import { serializeError } from 'serialize-error';

export const errorLoadingPreviewImage = 'Error loading preview image.'
export const noListingsFoundForSearch = (error: any) => { return `Error finding listing which matches search: ${JSON.stringify(serializeError(error))}.`; }