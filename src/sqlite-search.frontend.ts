// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for providing the frontend sqlite search interface which utilizes the sqlite-wasm-http package.
// We could not get that package importing like normal (see makefile for details), so instead we copy this file into it that package during website build.
// (this is why this file is placed here, in ./src, and not ./src/frontend)
// As a result of the weirdness above, if you make a change to this file, you'll need to re-run `make develop/website` etc.
// References: 
// * https://www.npmjs.com/package/sqlite-wasm-http
// * https://github.com/mmomtchev/sqlite-wasm-http/blob/main/test/integration/node-ts-esm/index.ts
import { createSQLiteThread, createHttpBackend  } from 'sqlite-wasm-http';

class FrontendBerkeleySearch implements IBerkeleySearch {
  private database?: FrontendDatabase;

  async init() {
    this.database = new FrontendDatabase();
    await this.database.connect();
  }

  async search(searchQuery: ISearchQuery): Promise<IListing[] | undefined> {
    console.debug('FrontendBerkeleySearch.search', searchQuery);

    if (!this.database?.connected) { await this.database?.connect(); }

    if (!searchQuery.sqlStatements) { return; }

    for (const sqlStatement of searchQuery.sqlStatements) {
      const listings = await this.execListingsQuery(sqlStatement);
      
      if (listings.length !== 0) { return listings; }
    }

    return; // All queries failed.
  }

  private async execListingsQuery(sql: string): Promise<IListing[]> {
    console.debug('FrontendBerkeleySearch.execListingsQuery', sql);

    const listings: IListing[] = [];

    try {
      await this.database?.db('exec', { sql, callback: (row: any) => {
        if (row.row) {
          //console.debug('col', row.columnNames);
          //console.debug('row', row.row);

          const dimensions = row.row[7].split(',');

          listings.push({
            id: row.row[0],
            name: row.row[1],
            modelDownloadUrl: this.getUrl(row.row[2]), 
            imageUrl: row.row[3] === 'undefined' ? undefined : this.getUrl(row.row[3]),
            modelPreviewUrl: row.row[4] === 'undefined' ? undefined : this.getUrl(row.row[4]),
            keywords: row.row[5],
            colors: row.row[6],
            dimensions: {
              width: dimensions[0],
              depth: dimensions[1],
              height: dimensions[2]
            }
          });
        } else {
          console.debug('db query done');
        }
      }});
    } catch (error: any) {
      console.error('Catching db error', error);
    }
      
    return listings;
  }

  private getUrl(imageUrl: string) {
    const url = new URL(window.location.href);

    // We have a CloudFront origin setup to cache the dataset when deployed to AWS. 
    // The URL we build into the db is the public S3 bucket the dataset is hosted in,
    //  so map the url to the CloudFront url that we've created in order to take advantage of caching.
    if (!url.host.includes('localhost') && imageUrl.includes('amazon-berkeley-objects.s3-website-us-east-1.amazonaws.com')) {
      const newImageUrl = imageUrl.replace('http://amazon-berkeley-objects.s3-website-us-east-1.amazonaws.com', `${url.protocol}//${url.host}`);

      console.debug('replacing image url', imageUrl, newImageUrl);

      return newImageUrl;
    }

    return imageUrl;
  }
}

class FrontendDatabase {
  connected = false;

  private dbUrl: string;
  private httpBackend?: any;
  
  db?: any;

  constructor() {
    const url = new URL(window.location.href);
    console.debug('db url', url);

    this.dbUrl = `${url.protocol}//${url.host}/berkeley.db`;
    console.debug('dbUrl', this.dbUrl);
  }

  async connect() {
    console.debug('FrontendDatabase.connect');

    if (this.connected) { return; }

    const size = 1024; // MiB, recommended sizes from sqlite-wasm-http
    const options: any = {
      maxPageSize: size,
      timeout: 10000, // 10s
      cacheSize: size
    };

    // Will autodetect if you can use SharedArrayBuffer or not.
    console.debug('createHttpBackend', options);
    this.httpBackend = createHttpBackend(options);

    // Multiple DB workers can be created, all sharing the same backend cache
    //  db is a raw SQLite Promiser object as described here: https://sqlite.org/wasm/doc/trunk/api-worker1.md
    console.debug('createSQLiteThread');
    this.db = await createSQLiteThread({ http: this.httpBackend });

    // This API is compatible with all SQLite VFS
    console.debug('opening db file', this.dbUrl);
  
    const result = await this.db('open', { filename: 'file:' + encodeURI(this.dbUrl), vfs: 'http' });

    console.debug('db opened', JSON.stringify(result, null, 2));

    this.connected = true;
  }

  async destroy() { 
    console.debug('FrontendDatabase.destroy');

    if (!this.connected) { return; }

    await this.db('close', {});

    this.db.close();

    await this.httpBackend.close();
  }
}

// Because of how we have to build the sqlite-wasm-http package, these interfaces are in two places.
interface IBerkeleySearch {
  init(): Promise<void>;
  search(searchQuery: ISearchQuery): Promise<IListing[] | undefined>;
}

interface IListing {
  id: string;
  name: string;
  modelDownloadUrl: string;
  imageUrl?: string;
  modelPreviewUrl?: string;
  keywords: string;
  colors: string;
  dimensions: {
    width: number;
    depth: number;
    height: number;
  }
}

interface ISearchQuery {
  searchTokens: string[];
  color?: string;
  keyword?: string;
  offset?: number;
  limit?: number;
  sqlStatements?: string;
}

// Because of how we have to build the sqlite-wasm-http package, this file can't be imported, so expose search to the rest of the window.
// @ts-ignore
window.berkeleySearch = new FrontendBerkeleySearch();