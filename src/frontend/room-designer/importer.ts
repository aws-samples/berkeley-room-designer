// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for handling import of room configurations.
import * as log from 'ts-app-logger';

import { appState } from '../state';
import * as fileUtils from '../utils.file';

import { IRoomConfiguration } from './iface';
import * as text from './text';

export const importRoomFromYAML = (yaml: string): IRoomConfiguration => {
  log.debug('importRoomFromYAML', yaml);
 
  try {
    const importedRoomConfiguration = fileUtils.importYAMLAsJSON(yaml) as IRoomConfiguration;

    const roomConfiguration = importedRoomConfiguration;
    roomConfiguration.prompt = appState.get().prompt;
    roomConfiguration.imported_room_configuration = JSON.stringify(importedRoomConfiguration); // User will make changes, track original.
    
    log.debug('roomConfiguration', roomConfiguration);

    return roomConfiguration;
  } catch (error) {
    throw Error(text.invalidYamlSupplied);
  }
}