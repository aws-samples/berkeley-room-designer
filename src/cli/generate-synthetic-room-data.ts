#! node
// This file is responsible for running furniture placement algorithms for development purposes.
import '../node-globals';
globalThis.app_location = 'local';

import * as log from 'ts-app-logger';
log.configure({ traceEnabled: globalThis.app_location !== 'aws' , debugEnabled: true, filters: [] });

import { BackendBerkeleySearch } from '../backend/sqlite-search.backend';

import { generateRoomConfiguration as generateRandomRoomConfiguration } from '../frontend/furniture-placement/random';
import { generateRoomConfiguration as generateAutoInteriorBlogRoomConfiguration } from '../frontend/furniture-placement/autointeriorblog';
import { generateRoomConfiguration as generateLLMRoomConfiguration } from '../frontend/furniture-placement/llm';
import { IRoomCreationArgs, ISimpleRoomDescription } from '../frontend/furniture-placement/iface';

import { RendererClient } from './generate-synthetic-room-data.ipc';
import { argparser } from './generate-synthetic-room-data.argparser';

const visualizer = new RendererClient();
if (argparser.args.visualizer) { await visualizer.init(); }

globalThis.berkeleySearch = new BackendBerkeleySearch(`${process.cwd()}/build-utils/data/berkeley.db`);
await globalThis.berkeleySearch.init();

const startTime = new Date().getTime();
let exitCode = 0;

try {
  // A simple rectangular room centered around the origin.
  // This room has no windows and doors.
  const roomDescription: ISimpleRoomDescription = { 
    widthInMeters: 4.572, // 180 inches or 15ft
    depthInMeters: 3.6576, // 144 inches or 12ft
    heightInMeters: 2.4384, // 96 inches or 8ft
    roomCategory: 'living room'
  };
  log.debug('roomDescription', roomDescription);

  const roomCreationArgs: IRoomCreationArgs = {
    roomDescription,
    fillTarget: .3,
    furniturePlacementType: 'llm', 
    furnitureSelectionType: 'matching search',
    furnitureSearchSelectionKeywords: ['Amazon Brand'],
    visualizer
  }

  switch (argparser.args.algorithm) {
    case 'random': 
      roomCreationArgs.furniturePlacementType = 'random';
    
      await generateRandomRoomConfiguration(roomCreationArgs);
      break;
    case 'autointeriorblog': 
      log.configure({ traceEnabled: false, debugEnabled: true, filters: [] }); // Too slow otherwise.

      roomCreationArgs.furniturePlacementType = 'autointeriorblog';

      await generateAutoInteriorBlogRoomConfiguration(roomCreationArgs);
      break;
    case 'llm': 
      roomCreationArgs.furniturePlacementType = 'llm';

      await generateLLMRoomConfiguration(roomCreationArgs);
      break;
  }
} catch (error) {
  log.error('Error generating room configuration', error);

  exitCode = 1;
} finally {
  const durationInMs = new Date().getTime() - startTime;

  log.info('Algorithm took', durationInMs / 1000, 'seconds');

  // Leave visualizer running if enabled.
  if (exitCode === 1) { process.exit(exitCode); }
  if (!argparser.args.visualizer && exitCode === 0) {
    process.exit(exitCode);
  }
}