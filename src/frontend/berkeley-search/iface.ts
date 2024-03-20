// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for defining the interfaces for searching the berkeley dataset.
export interface ISearchQuery {
  searchTokens?: string[];
  color?: string; // Supplied by room generation output.
  keyword?: string; // Supplied by room generation output.
  colorsInText?: string[]; // Colors found in text.
  keywordsInText?: string[]; // Keywords found in text.
  offset?: number;
  limit?: number;
  sqlStatements?: string[];
}

export interface IRoomObjectSearch {
  searchText: string;
  keyword?: string;
  color?: string;
}