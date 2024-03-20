// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for parsing command-line arguments passed to the respectively named CLI program.
import { parse } from 'ts-command-line-args';

class ArgParser {
  readonly args: CLIArgs;
  private readonly appLocations = ['local', 'aws'];
  
  constructor() {
    this.args = parse<CLIArgs>(
      {
        'app-location': { type: String, description: 'local|aws' }
      }
    );

    if (!this.appLocations.includes(this.args['app-location'])) {
      throw new Error('Invalid app-location supplied as arg, must be one of: local|aws');

      process.exit(1);
    }
  }
}

interface CLIArgs {
  readonly 'app-location': string;
}

const argparser = new ArgParser();

export { argparser }