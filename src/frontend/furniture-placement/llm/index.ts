// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for providing a way to generate room configurations using an LLM.
import * as log from 'ts-app-logger';
import { BedrockRuntimeClient, InvokeModelCommandInput, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import * as turf from '@turf/turf';

import * as fileUtils from '../../utils.file';
import AWSAuth from '../../aws.auth';

import { findListing, getListing } from '../../berkeley-search/search';

import { IRoomConfiguration } from '../../room-designer/iface';
import * as text from '../../room-designer/text';

import { IRoomCreationArgs } from '../iface';

const modelId = 'anthropic.claude-v2';

export const generateRoomConfiguration = async (roomCreationArgs: IRoomCreationArgs): Promise<string> => {
  const roomConfiguration = await _generateRoomConfiguration(roomCreationArgs);

  return fileUtils.convertJSONToYAML(roomConfiguration);
}

export const _generateRoomConfiguration = async (roomCreationArgs: IRoomCreationArgs): Promise<IRoomConfiguration> => {
  log.debug('_generateRoomConfiguration', roomCreationArgs.roomDescription);

  roomCreationArgs.visualizer?.tryRender(roomCreationArgs.roomDescription, 'room description');

  const roomFurnisher = new LLMRoomFurnisher(roomCreationArgs);
  const roomConfiguration = await roomFurnisher.generateRoomConfiguration();
  log.debug('roomConfiguration', roomConfiguration);

  roomCreationArgs.visualizer?.tryRender(roomConfiguration, 'final room configuration');

  return roomConfiguration;
}

export class LLMRoomFurnisher {
  private readonly mininumNumberOfFurniture = 10;

  private readonly roomCreationArgs: IRoomCreationArgs;

  private prompt?: string;

  constructor(roomCreationArgs: IRoomCreationArgs) {
    this.roomCreationArgs = roomCreationArgs;
  }

  async generateRoomConfiguration(): Promise<IRoomConfiguration> {
    log.trace('LLMRoomFurnisher.generateRoomConfiguration');

    const roomConfiguration = await this.generateRoomConfigurationFromPrompt();
    this.ensureAllFittingsInRoomBounds(roomConfiguration);

    return roomConfiguration;
  }

  private async generateRoomConfigurationFromPrompt(): Promise<IRoomConfiguration> {
    this.prompt = this.getPrompt();

    let bedrockRuntime = new BedrockRuntimeClient();
    if (process.env.app_location === 'local') {
      bedrockRuntime = new BedrockRuntimeClient(new AWSAuth().getLocalConfigWithCredentials());
    }

    const invokeModelCommandInput: InvokeModelCommandInput = { 
      modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        prompt: this.prompt,
        max_tokens_to_sample: 2048,
        temperature: 0.1,
        //top_k: 250,
        top_p: 0.9,
        //stop_sequences: ['\n\nHuman:'],
        anthropic_version: 'bedrock-2023-05-31'
      })
    };
    log.debug('invokeModelCommandInput', invokeModelCommandInput);

    const command = new InvokeModelCommand(invokeModelCommandInput);

    const invokeModelCommandOutput = await bedrockRuntime.send(command);
    log.debug('invokeModelCommandOutput', invokeModelCommandOutput);

    const body = new TextDecoder().decode(invokeModelCommandOutput?.body);
    log.debug('body', body);

    const response = JSON.parse(body).completion;
    log.debug('response', response);

    const rawRoom = response.substring(response.indexOf('\`\`\`json') + 1, response.lastIndexOf('\`\`\`')).replace('``json', '');
    log.debug('rawRoom', rawRoom);

    const roomConfiguration = await this.rawRoomToRoomConfiguration(rawRoom);

    log.debug('roomConfiguration', roomConfiguration);

    return roomConfiguration;
  }

  getPrompt(): string {
    return `\n\nHuman:You are an interior designer tasked with furnishing a ${this.roomCreationArgs.roomDescription.roomCategory} room with up to ${this.roomCreationArgs.fillTarget * 100} percent furniture. The room dimensions - length by width by height - are ${this.roomCreationArgs.roomDescription.widthInMeters} meters (x) by ${this.roomCreationArgs.roomDescription.depthInMeters} meters (z) by ${this.roomCreationArgs.roomDescription.heightInMeters} meters (y). The room is divided into four quadrants and the room center coordinate is { x: 0, z: 0 }. The y axis is height and 0 means the piece of furniture is placed on the floor. First generate a list of at least ${this.mininumNumberOfFurniture} of the most commonly found pieces of furniture placed in rooms of type ${this.roomCreationArgs.roomDescription.roomCategory}. Do not include appliances like TVs, or other items like books; just furniture. Each piece of furniture you place in the room should have a name, i.e. chair, color, i.e. blue, and coordinates (in meters) relative to the center of the room, e.g. { x: -1, y: 0, z: -1 }. Furniture should be placed in a position and orientation which creates the most functional layout possible, and they shouldn't overlap. Do not place every piece of furniture next to each other, but in functional groups. Items that go on the wall should have coordinates at the bounds of what we have supplied. All furniture must be within the bounds of the room dimensions. You answer by responding with JSON that describes the room and the furniture you furnished it with. Here are the corresponding TypeScript typings which describe the JSON format you should return:\\n\\
    interface IRoomConfiguration {
      objects: IRoomObject[];
    }\n
    interface IRoomObject {
      name: string;
      category: string;
      colors: string[];
      x: number;
      y: number;
      z: number;
      orientation?: number;
    }\n
    Remember, you only return JSON that describes how you furnished the room. Please do not respond with 'Here is the JSON describing how I would furnish', your response should be just JSON.\n\nAssistant:
  `;
  }

  private async rawRoomToRoomConfiguration(rawRoom: string): Promise<IRoomConfiguration> {
    // Map to IRoomConfiguration, fill in bad output:
    const roomConfiguration = JSON.parse(rawRoom) as IRoomConfiguration;
    log.debug('roomConfiguration', roomConfiguration);
  
    if (!roomConfiguration || (roomConfiguration && !roomConfiguration.objects) || (roomConfiguration && roomConfiguration.objects.length === 0)) { 
      throw Error(`${text.llmError}, room missing objects`); 
    }
  
    roomConfiguration.id = new Date().getTime().toString();
    roomConfiguration.prompt = this.prompt;
    roomConfiguration.area_size_x = this.roomCreationArgs.roomDescription.widthInMeters;
    //roomConfiguration.area_size_y = this.roomCreationArgs.roomDescription.heightInMeters;
    roomConfiguration.area_size_z = this.roomCreationArgs.roomDescription.depthInMeters;
  
    roomConfiguration.objects = roomConfiguration.objects
      .filter(roomObject => {
        log.debug(roomObject);

        if (!roomObject.category || !roomObject.name) {
          log.warn('Room object missing category or name, ignoring');

          return;
        }

        return roomObject;
      });

    //if (roomCreationArgs.furnitureSelectionType === 'matching search') { // Only "matching search" is used currently.
      for (const roomObject of roomConfiguration.objects) {
        //if (roomObject.model_location === 'berkeley' && roomObject.model_id) { // Only Berkeley dataset is used currently.
          // Normalize output of LLM.
          const searchText = roomObject.name.replaceAll('_', ' ').replaceAll('-', ' ').toLowerCase();
   
          let color: string | undefined;
          if (roomObject?.colors && roomObject.colors.length > 0) {
            color = roomObject.colors[0].toLowerCase();
          }
          
          const keyword = roomObject.category.toLowerCase();

          const listing = await findListing({ searchText, color, keyword });

          // FIXME Need other info for category, listing type, dimensions, where to place, etc., in order to place fittings properly.
          if (listing) { 
            roomObject.model_location = 'berkeley';
            roomObject.model_id = listing.id; 
          }
        //}
      }
    //}

    let id = new Date().getTime();

    // Fixup roomObject output.
    roomConfiguration.objects.map(roomObject => {
      log.debug(roomObject);

      roomObject.id = (id++).toString();
  
      if (!roomObject.orientation) { roomObject.orientation = 0; }
  
      return roomObject;
    });
  
    return roomConfiguration;
  }

  private async ensureAllFittingsInRoomBounds(roomConfiguration: IRoomConfiguration) {
    const halfRoomWidth = roomConfiguration.area_size_x / 2;
    const halfRoomDepth = roomConfiguration.area_size_z / 2;
    log.debug('halfRoomWidth', halfRoomWidth, 'halfRoomDepth', halfRoomDepth);

    const roomBoundingBox = turf.polygon([[ // TL, TR, BR, BL
      [-halfRoomWidth, halfRoomDepth],
      [halfRoomWidth, halfRoomDepth],
      [halfRoomWidth, -halfRoomDepth],
      [-halfRoomWidth, -halfRoomDepth],
      [-halfRoomWidth, halfRoomDepth] // End at start to close.
    ]]);
    log.debug('roomBoundingBox', roomBoundingBox);

    roomConfiguration.objects.map(async roomObject => {
      const listing = await getListing(roomObject);
      if (!listing) { throw Error('Should not be non-existent listing in room configuration'); }

      const halfFittingWidth = listing.dimensions.width / 2;
      const halfFittingDepth = listing.dimensions.depth / 2;

      // FIXME Take into account orientation.
      // FIXME Take into account clearances.

      const fittingBoundingBox = turf.polygon([[ // TL, TR, BR, BL
        [roomObject.x - halfFittingWidth, roomObject.z + halfFittingDepth],
        [roomObject.x + halfFittingWidth, roomObject.z + halfFittingDepth],
        [roomObject.x + halfFittingWidth, roomObject.z - halfFittingDepth],
        [roomObject.x - halfFittingWidth, roomObject.z - halfFittingDepth],
        [roomObject.x - halfFittingWidth, roomObject.z + halfFittingDepth] // End at start to close.
      ]]);

      if (!turf.booleanContains(roomBoundingBox, fittingBoundingBox)) {
        log.warn('fittting model needs adjustment', roomObject.id, roomObject.x, roomObject.y, roomObject.z);
      } else {
        log.debug('fittting model ok', roomObject.id);
      }

      return roomObject;
    });
  }
}