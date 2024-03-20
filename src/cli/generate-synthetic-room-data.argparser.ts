// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for parsing command-line arguments passed to the respectively named CLI program.
import * as log from 'ts-app-logger';

import { parse } from 'ts-command-line-args';

@log.LogClass()
class ArgParser {
  readonly args: CLIArgs;
  private readonly algorithms = ['random', 'autointeriorblog', 'llm'];
  
  constructor() {
    log.debug('argv', process.argv); 

    this.args = parse<CLIArgs>(
      {
        visualizer: { type: Boolean, description: 'Enable visualizer (and IPC to it).' },
        algorithm: { type: String, description: 'random|autointeriorblog|llm' }
      }
    );

    if (!this.algorithms.includes(this.args.algorithm)) {
      log.error('Invalid algorithm supplied as arg, must be one of: random|autointeriorblog|llm');

      process.exit(1);
    }
    
    log.debug('args', this.args);
  }
}

interface CLIArgs {
  readonly visualizer: boolean;
  readonly algorithm: string;
}

const argparser = new ArgParser();

export { argparser }