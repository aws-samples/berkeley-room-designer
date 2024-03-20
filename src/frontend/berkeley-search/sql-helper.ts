// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for providing a sqlite search query builder.
import * as log from 'ts-app-logger';

import { ISearchQuery } from './iface';
import { colors } from './colors';
import { keywords } from './keywords';

// We can search pretty well without full-text search within a database this size by supplying a bunch of smartly defined queries.
// Obviously it's not going to be as good as fuzzy searching, but this approach works surprisingly well!
// The output of our query builder is a bunch of sql statements that start out exact and become more general as the one before fails.
// For example, "mid-century brown couch amazon" should return 1 result from the dataset:
//  Amazon Brand – Rivet Edgewest Low Back Mid-Century Modern Couch Sofa, 87"W, Slate Brown
// In order to build sql queries for the search text above, we first need some info.
// First we'll look at suppliedQueryArgs to see if the search specifically specified a color and keyword.
// For background, the "generate room from prompt" feature outputs a "couch" (maybe keyword, maybe in name of product) and "brown" (definite color),
//  which means this feature does specify suppliedQueryArgs, while users searching to "add" listings to a room configuration from the search-listings component 
// are just entering a search string that's not as specific per se - even if it does contain "couch" and "brown" - and do not supply suppliedQueryArgs.
// If no color and/or keyword are in suppliedQueryArgs, we'll look at search text to see if any matches known colors, 
//  and get [ "brown" ] and/or [ "brown", "couch", "mid", "century", "amazon", "mid-century" ].
// We'll then tokenize the search text into words to get [ "mid-century", "brown", "couch", "amazon" ].
// Then we're ready to build our sql queries.
// It is worth noting that ./colors.ts and ./keywords.ts are generated when build the berkeley.db database,
//  and contain every unique color and keyword that exists in the database for our listings,
//  and we can use this data to determine if a passed color and keyword are in fact relevant to generating a sql statement!
export const searchQueryBuilder = (text: string, suppliedQueryArgs?: { color?: string, keyword?: string }): ISearchQuery => {
  let searchText = `${text}`;

  const adjustedQueryArgs: { colors?: string[], keywords?: string[] } = { };
  
  const colors = tryMatchColorsFromSearchText(searchText); 
  log.trace('colors', colors);
  adjustedQueryArgs.colors = colors;
  if (suppliedQueryArgs?.color) { adjustedQueryArgs.colors.push(suppliedQueryArgs.color); }
  adjustedQueryArgs.colors = [...new Set(adjustedQueryArgs.colors)];

  const keywords = tryMatchKeywordsFromSearchText(searchText); 
  log.trace('keywords', keywords);
  adjustedQueryArgs.keywords = keywords;
  if (suppliedQueryArgs?.keyword) { adjustedQueryArgs.keywords.push(suppliedQueryArgs.keyword); }
  adjustedQueryArgs.keywords = [...new Set(adjustedQueryArgs.keywords)];

  const searchTokens = searchText.trim().replace(/\s\s+/g, ' ').split(' ');
  log.trace('searchTokens', searchTokens);

  const searchQuery: ISearchQuery = { 
    searchTokens,
    color: suppliedQueryArgs?.color,
    keyword: suppliedQueryArgs?.keyword,
    colorsInText: adjustedQueryArgs.colors,
    keywordsInText: adjustedQueryArgs.keywords
  };

  const sqlStatements = buildSqlStatements(searchQuery);

  return { ...searchQuery, sqlStatements: [...new Set(sqlStatements)] };
}

const tryMatchColorsFromSearchText = (searchText: string): string[] => {
  const matches = colors.filter(color => {
    try {
      const regex = new RegExp(`\\b${color.toLowerCase()}\\b`, 'g');
      const match = regex.test(searchText.toLowerCase());

      //if (match) { log.trace('color match', match); }

      return match;
    } catch (error) {
      //log.warn(`color: ${color} could not be matched with regex, ignoring`);

      return false;
    }
  });

  return matches.map(color => color.toLowerCase());
} 

const tryMatchKeywordsFromSearchText = (searchText: string): string[] => {
  const matches = keywords.filter(keyword => {
    try {
      const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'g');
      const match = regex.test(searchText.toLowerCase());

      //if (match) { log.trace('keyword match', match, searchText.toLowerCase()); }

      return match;
    } catch (error) {
      //log.warn(`keyword: ${keyword} could not be matched with regex, ignoring`);

      return false;
    }
  });

  return matches.map(keyword => keyword.toLowerCase());
} 

const maxResults = 10;
const defaultOffset = 0;
export const listingsTableName = 'listings';
//const searchableColumns = ['name'];
const defaultAndOr = 'and';

const buildSqlStatements = (searchQuery: ISearchQuery): string[] => {
  // For a query "mid-century brown couch amazon", we'll (generate, then) execute the sql statements below until we get a match:
  const sqlStatements = [];

  /*
  if (searchQuery.color && searchQuery.keyword) {
    sqlStatements.push(buildSqlStatement(searchQuery, { useColorsInText: false, useKeywordsInText: false }));
  }
  */

  // The first query we try will find known colors and keywords in the search text and use those in the query combined with the search text.
  // This will probably fail but it would provide the best results in theory.
  // select * from listings 
  // where (colors like '%brown%') 
  // and (keywords like '%brown%' and keywords like '%couch%' and keywords like '%mid%' and keywords like '%century%' and keywords like '%amazon%' and keywords like '%mid-century%') 
  // and (name like '%mid-century%' and name like '%brown%' and name like '%couch%' and name like '%amazon%') 
  // and limit 10 offset 0;
  sqlStatements.push(buildSqlStatement(searchQuery, { useColorsInText: true, useKeywordsInText: true }));

  // The next query we try will find known colors in the search text and use those in the query combined with the search text.
  // select * from listings
  // where (colors like '%brown%') 
  // and (name like '%mid-century%' and name like '%brown%' and name like '%couch%' and name like '%amazon%') 
  // and limit 10 offset 0;
  sqlStatements.push(buildSqlStatement(searchQuery, { useColorsInText: true, useKeywordsInText: false }));

  // The next query we try will find known keywords in the search text and use those in the query combined with the search text.
  // select * from listings
  // and (keywords like '%brown%' and keywords like '%couch%' and keywords like '%mid%' and keywords like '%century%' and keywords like '%amazon%' and keywords like '%mid-century%') 
  // and (name like '%mid-century%' and name like '%brown%' and name like '%couch%' and name like '%amazon%') 
  // and limit 10 offset 0;
  sqlStatements.push(buildSqlStatement(searchQuery, { useColorsInText: false, useKeywordsInText: true }));
  
  // The next query we try will just use the search text in the query.
  // select * from listings 
  // and (name like '%mid-century%' and name like '%brown%' and name like '%couch%' and name like '%amazon%') 
  // and limit 10 offset 0;
  sqlStatements.push(buildSqlStatement(searchQuery, { useColorsInText: false, useKeywordsInText: false }));

  // The next query we try will find filter out duplicate colors and keywords in the search text and use those in the query combined with the search text.
  // select * from listings 
  // and (keywords like '%mid%' and keywords like '%century%') 
  // and (name like '%mid-century%' and name like '%brown%' and name like '%couch%' and name like '%amazon%') 
  // and limit 10 offset 0;
  sqlStatements.push(buildSqlStatement(searchQuery, { useColorsInText: true, useKeywordsInText: true, filterColorsThatMatchTokens: true, filterKeywordsThatMatchTokens: true }));

  // The next query we try will find filter out duplicate colors in the search text and use those in the query combined with the search text.
  // select * from listings 
  // and (keywords like '%brown%' and keywords like '%couch%' and keywords like '%mid%' and keywords like '%century%' and keywords like '%amazon%' and keywords like '%mid-century%') 
  // and (name like '%mid-century%' and name like '%brown%' and name like '%couch%' and name like '%amazon%') 
  // and limit 10 offset 0;
  sqlStatements.push(buildSqlStatement(searchQuery, { useColorsInText: true, useKeywordsInText: true, filterColorsThatMatchTokens: true, filterKeywordsThatMatchTokens: false }));

  // The next query we try will find filter out duplicate keywords in the search text and use those in the query combined with the search text.
  // select * from listings 
  // where (colors like '%brown%') 
  // and (keywords like '%mid%' and keywords like '%century%') 
  // and (name like '%mid-century%' and name like '%brown%' and name like '%couch%' and name like '%amazon%') 
  // and limit 10 offset 0;
  sqlStatements.push(buildSqlStatement(searchQuery, { useColorsInText: true, useKeywordsInText: true, filterColorsThatMatchTokens: false, filterKeywordsThatMatchTokens: true }));

  // Now we're basically going to make the same queries above, but we're going to use OR instead of AND in different combinations, more specific to less.

  // The first OR query we try will find known colors and keywords in the search text and use those in the query combined with the search text.
  // This will probably fail but it would provide the best results in theory.
  // select * from listings 
  // where (colors like '%brown%') 
  // and (keywords like '%brown%' or keywords like '%couch%' or keywords like '%mid%' or keywords like '%century%' or keywords like '%amazon%' or keywords like '%mid-century%') 
  // and (name like '%mid-century%' and name like '%brown%' and name like '%couch%' and name like '%amazon%') 
  // and limit 10 offset 0;
  sqlStatements.push(buildSqlStatement(searchQuery, { useColorsInText: true, useKeywordsInText: true, andOrColors: 'or', andOrKeywords: 'or' }));

  // The next OR query we try will find known colors in the search text and use those in the query combined with the search text.
  // select * from listings
  // where (colors like '%brown%') 
  // and (name like '%mid-century%' and name like '%brown%' and name like '%couch%' and name like '%amazon%') 
  // and limit 10 offset 0;
  sqlStatements.push(buildSqlStatement(searchQuery, { useColorsInText: true, useKeywordsInText: false, andOrColors: 'or', andOrKeywords: 'or' }));

  // The next OR query we try will find known keywords in the search text and use those in the query combined with the search text.
  // select * from listings
  // and (keywords like '%brown%' or keywords like '%couch%' or keywords like '%mid%' or keywords like '%century%' or keywords like '%amazon%' and keywords like '%mid-century%') 
  // and (name like '%mid-century%' and name like '%brown%' and name like '%couch%' and name like '%amazon%') 
  // and limit 10 offset 0;
  sqlStatements.push(buildSqlStatement(searchQuery, { useColorsInText: false, useKeywordsInText: true, andOrColors: 'or', andOrKeywords: 'or' }));
  
  // The next OR query we try will just use the search text in the query.
  // select * from listings 
  // and (name like '%mid-century%' and name like '%brown%' and name like '%couch%' and name like '%amazon%') 
  // and limit 10 offset 0;
  sqlStatements.push(buildSqlStatement(searchQuery, { useColorsInText: false, useKeywordsInText: false, andOrColors: 'or', andOrKeywords: 'or' }));

  // The next OR query we try will find filters out duplicate colors and keywords from the search text and use those in the query combined with the search text.
  // select * from listings 
  // and (keywords like '%mid%' or keywords like '%century%') 
  // and (name like '%mid-century%' and name like '%brown%' and name like '%couch%' and name like '%amazon%') 
  // and limit 10 offset 0;
  sqlStatements.push(buildSqlStatement(searchQuery, { useColorsInText: true, useKeywordsInText: true, filterColorsThatMatchTokens: true, filterKeywordsThatMatchTokens: true, andOrColors: 'or', andOrKeywords: 'or' }));

  // The next OR query we try will find filters out duplicate colors from the search text and use those in the query combined with the search text.
  // select * from listings 
  // and (keywords like '%brown%' or keywords like '%couch%' or keywords like '%mid%' or keywords like '%century%' or keywords like '%amazon%' or keywords like '%mid-century%') 
  // and (name like '%mid-century%' and name like '%brown%' and name like '%couch%' and name like '%amazon%') 
  // and limit 10 offset 0;
  sqlStatements.push(buildSqlStatement(searchQuery, { useColorsInText: true, useKeywordsInText: true, filterColorsThatMatchTokens: true, filterKeywordsThatMatchTokens: false, andOrColors: 'or', andOrKeywords: 'or' }));

  // The next OR query we try will find filter out duplicate keywords from the search text and use those in the query combined with the search text.
  // select * from listings 
  // where (colors like '%brown%') 
  // and (keywords like '%mid%' or keywords like '%century%') 
  // and (name like '%mid-century%' and name like '%brown%' and name like '%couch%' and name like '%amazon%') 
  // and limit 10 offset 0;
  sqlStatements.push(buildSqlStatement(searchQuery, { useColorsInText: true, useKeywordsInText: true, filterColorsThatMatchTokens: false, filterKeywordsThatMatchTokens: true, andOrColors: 'or', andOrKeywords: 'or' }));

  // The near final OR query we try will find filters out duplicate colors and keywords from the search text and uses those in the query combined with the search text.
  // It will also 
  // select * from listings 
  // where (colors like '%brown%') 
  // and (keywords like '%mid%' or keywords like '%century%') 
  // and (name like '%mid-century%' or name like '%brown%' or name like '%couch%' or name like '%amazon%') 
  // and limit 10 offset 0;
  sqlStatements.push(buildSqlStatement(searchQuery, { useColorsInText: true, useKeywordsInText: true, filterColorsThatMatchTokens: true, filterKeywordsThatMatchTokens: true, andOrColors: 'or', andOrKeywords: 'or', andOrColumns: 'or' }));

  // The final OR query we try will find tries to match on a color, keyword, or search text - whatever returns _some_ data.
  // It will also 
  // select * from listings 
  // where (colors like '%brown%') 
  // or (keywords like '%mid%' or keywords like '%century%') 
  // or (name like '%mid-century%' or name like '%brown%' or name like '%couch%' or name like '%amazon%') 
  // and limit 10 offset 0;
  sqlStatements.push(buildSqlStatement(searchQuery, { useColorsInText: true, useKeywordsInText: true, filterColorsThatMatchTokens: true, filterKeywordsThatMatchTokens: true, andOrColors: 'or', andOrKeywords: 'or', andOrColumns: 'or', andOrSegments: 'or' }));

  log.trace('sqlStatements', sqlStatements);

  return sqlStatements;
}

const buildSqlStatement = (
  searchQuery: ISearchQuery, 
  queryBuilderArgs?: { 
    andOrSegments?: 'and' | 'or',
    andOrColors?: 'and' | 'or',
    andOrKeywords?: 'and' | 'or',
    andOrColumns?: 'and' | 'or',
    useColorsInText?: boolean, 
    useKeywordsInText?: boolean,
    filterColorsThatMatchTokens?: boolean,
    filterKeywordsThatMatchTokens?: boolean
  }
): string => {
  let sql = `select * from ${listingsTableName} where`;

  const querySegments = [];

  const updatedSearchQuery = JSON.parse(JSON.stringify(searchQuery)) as ISearchQuery;

  if (queryBuilderArgs?.useColorsInText) { 
    log.trace('useColorsInText', searchQuery.colorsInText, updatedSearchQuery.colorsInText);

    let colorSegment = '';
    updatedSearchQuery.colorsInText?.forEach((color, colorIndex) => {
      if (colorIndex === updatedSearchQuery.colorsInText?.length! - 1) {
        colorSegment += `colors like '%${color}%'`;
      } else {
        colorSegment += `colors like '%${color}%' ${queryBuilderArgs?.andOrColors || defaultAndOr} `;
      }
    });
    if (colorSegment !== '') { querySegments.push(colorSegment); }
  }

  if (queryBuilderArgs?.useKeywordsInText) { 
    log.trace('useKeywordsInText', searchQuery.keywordsInText, updatedSearchQuery.keywordsInText);

    let keywordSegment = '';
    updatedSearchQuery.keywordsInText?.forEach((keyword, keywordIndex) => {
      if (keywordIndex === updatedSearchQuery.keywordsInText?.length! - 1) {
        keywordSegment += `keywords like '%${keyword}%'`;
      } else {
        keywordSegment += `keywords like '%${keyword}%' ${queryBuilderArgs?.andOrKeywords || defaultAndOr} `;
      }
    });
    if (keywordSegment !== '') { querySegments.push(keywordSegment); }
  }

  if (queryBuilderArgs?.filterColorsThatMatchTokens && updatedSearchQuery.colorsInText) {
    updatedSearchQuery.colorsInText = updatedSearchQuery.colorsInText.filter(color => !searchQuery.searchTokens?.includes(color));
    log.trace('filterColorsThatMatchTokens', searchQuery.searchTokens, updatedSearchQuery.searchTokens);
  }
  if (queryBuilderArgs?.filterKeywordsThatMatchTokens && updatedSearchQuery.keywordsInText) {
    updatedSearchQuery.keywordsInText = updatedSearchQuery.keywordsInText.filter(keyword => !searchQuery.searchTokens?.includes(keyword));
    log.trace('filterKeywordsThatMatchTokens', searchQuery.searchTokens, updatedSearchQuery.searchTokens);
  }

  //log.trace(queryBuilderArgs, 'searchTokens', searchQuery.searchTokens, 'updated', updatedSearchQuery.searchTokens);

  let nameSegment = '';
  updatedSearchQuery.searchTokens?.forEach((token, nameIndex) => {
    if (nameIndex === updatedSearchQuery.searchTokens?.length! - 1) {
      nameSegment += `name like '%${token}%'`;
    } else {
      nameSegment += `name like '%${token}%' ${queryBuilderArgs?.andOrColumns || defaultAndOr} `;
    }
  });
  if (nameSegment !== '') { querySegments.push(nameSegment); }

  /*
  searchableColumns.forEach((columnName) => {
    let searchTokenForColumnSegment = '';
    
    updatedSearchQuery.searchTokens?.forEach((searchToken, searchTokenIndex) => {
      if (searchTokenIndex === updatedSearchQuery.searchTokens.length - 1) {
        searchTokenForColumnSegment += `${columnName} like '%${searchToken}%'`;
      } else {
        searchTokenForColumnSegment += `${columnName} like '%${searchToken}%' ${queryBuilderArgs?.andOrColumns || defaultAndOr} `;
      }
    });

    querySegments.push(searchTokenForColumnSegment);
  });
  */

  querySegments.forEach((querySegment) => {
    sql += ` (${querySegment})${querySegments.length > 1 ? ` ${queryBuilderArgs?.andOrSegments || defaultAndOr}` : ''}`;
  });

  const limitAndOffset = ` limit ${searchQuery.limit || maxResults} offset ${searchQuery.offset || defaultOffset};`;

  sql += ` ${limitAndOffset}`;

  // FIXME There's a bug in here producing "and/or limit 10 offset 0"...remove these lines when fixed.
  if (sql.indexOf(`and ${limitAndOffset}`)) { sql = sql.replace(` and ${limitAndOffset}`, limitAndOffset); }
  if (sql.indexOf(`or ${limitAndOffset}`)) { sql = sql.replace(` or ${limitAndOffset}`, limitAndOffset); }

  return sql;
}

export const getSearchQueryFromStatement = (sqlStatement: string): ISearchQuery => {
  return { sqlStatements: [sqlStatement] };
}