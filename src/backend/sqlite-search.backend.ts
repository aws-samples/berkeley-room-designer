// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for providing the backend and build utils database interface.
import * as log from 'ts-app-logger';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

import { IBerkeleySearch } from '../frontend/iface';
import { ISearchQuery } from '../frontend/berkeley-search/iface';
import { IListing } from '../frontend/room-designer/iface';

export class BackendBerkeleySearch implements IBerkeleySearch {
  dbFilePath?: string;

  private database?: BackendDatabase;

  constructor(dbFilePath?: string) {
    this.dbFilePath = dbFilePath;
  }

  async init() {
    try {
      this.database = new BackendDatabase(this.dbFilePath);
      await this.database.connect();
  
      log.debug('sqlite database connected');
    } catch (error) {
      log.error('Error during searchInit', error);

      throw error;
    }
  }

  async search(searchQuery: ISearchQuery): Promise<IListing[] | undefined> {
    log.trace('BackendBerkeleySearch.search', searchQuery);

    if (!this.database?.connected) { await this.database?.connect(); }

    if (!searchQuery.sqlStatements) { return; }

    for (const sqlStatement of searchQuery.sqlStatements) {
      const listings = await this.execListingsQuery(sqlStatement);
      
      if (listings.length !== 0) { return listings; }
    }

    return; // All queries failed.
  }

  private async execListingsQuery(sql: string): Promise<IListing[]> {
    log.trace('BackendBerkeleySearch.execListingsQuery', sql);

    return new Promise((resolve, reject) => {
      const listings: IListing[] = [];

      try {
        this.database?.db?.each(sql, (error: Error | null, row: any) => {
          if (error) { return reject(error); }

          log.trace('row', row);

          const dimensions = row.dimensions.split(',');

          const listing = row as IListing;
          listing.dimensions = {
            width: dimensions[0],
            depth: dimensions[1],
            height: dimensions[2]
          };

          listings.push(listing);
        }, (error: Error | null, count: number) => {
          if (error) { return reject(error); }

          log.trace('Found listings', count);
          
          return resolve(listings); 
        }); 
      } catch (error: any) {
        log.error('Catching db error', error);
      }
    });
  }

  destroy() { this.database?.destroy(); }
}

export class BackendDatabase {
  static readonly listingsTableName = 'listings';

  connected = false;

  private dbFilePath = `${process.cwd()}/build-utils/data/berkeley.db`;

  db?: sqlite3.Database;

  constructor(dbFilePath?: string) {
    if (dbFilePath) { this.dbFilePath = dbFilePath; } // Different b/t build-utils and backend deployed to AWS.
  }

  async connect() {
    log.trace('BackendDatabase.connect', this.dbFilePath);

    if (this.connected) { return; }

    const db = await open({
      filename: this.dbFilePath,
      driver: sqlite3.Database
    });

    this.db = db.db;

    this.connected = true;
  }

  async createSearchTables() {
    log.trace('BackendDatabase.createSearchTables');

    if (!this.connected) { await this.connect(); }

    const createListingsTableQuery = `
      create table ${BackendDatabase.listingsTableName}(id text primary key, name text not null, model_url text not null, image_url text, model_preview_url text, keywords text not null, colors text not null, dimensions text not null);
    `;

    await this.db?.exec(createListingsTableQuery.trim());
  }

  async insertListings(sqliteInsertStatements: string[]) {
    log.trace('BackendDatabase.insertListings');

    if (!this.connected) { await this.connect(); }

    for (const sqliteInsertStatement of sqliteInsertStatements) {
      log.trace('sqlite exec', sqliteInsertStatement);

      // FIXME Try/catch not working, see: https://stackoverflow.com/questions/40884153/try-catch-blocks-with-async-await
      try {
        await this.db?.exec(sqliteInsertStatement);
      } catch (error: any) {
        log.warn('error message', error.message);
        
        if (error.message.indexOf('UNIQUE constraint failed:') !== -1) {
          log.warn('Duplicate record in listings data');
        } else { throw error; }
      }
    }
  }

  // See: https://www.npmjs.com/package/sqlite-wasm-http and https://github.com/phiresky/sql.js-httpvfs
  async optimize() {
    log.trace('BackendDatabase.optimize');
    
    await this.db?.exec('PRAGMA JOURNAL_MODE = DELETE;');
    await this.db?.exec('PRAGMA page_size = 1024;');

    // VACUUM is needed on a populated database to make a page size change actually take effect.
    await this.db?.exec(`VACUUM;`);
  }

  destroy() { 
    if (!this.connected) { return; }

    this.db?.close(); 
  }
}