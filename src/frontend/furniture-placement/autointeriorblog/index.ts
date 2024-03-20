// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for providing a furniture placement algorithm originally defined here: https://autointeriorblog.wordpress.com/.
// It's been translated from C# and modified to use the berkeley.db listings, among other things.
// This algorithm is planar and doesn't handle Y (height), so semantics for objects that should be placed on the ceiling are shoehorned in. 
// Also, as a result of this "planarity", the output gets gets adjusted to take into account objects that should be placed on the ceiling.
// Similar approaches that may interest you:
// * https://medium.com/@svoboel5/evolving-interior-designs-with-simulated-annealing-and-genetic-algorithm-7c4acc83ee9e
import * as log from 'ts-app-logger';

import * as fileUtils from '../../utils.file';

import { IRoomCreationArgs } from '../iface';

import { IRoom, IFittingModels, IFittingPriority, IFittingModel } from './iface';
import { Room } from './room';
import { generateFittingSemantics as generateDefaultFittingSemantics } from './fitting-semantics.default';
import { importance } from './fitting-priority';
import * as fittingModels from './fitting-models';
import { FittingLayout } from './fitting-layout';
import * as fittings from './fittings'; 

export const generateRoomConfiguration = async (roomCreationArgs: IRoomCreationArgs): Promise<string> => {
  log.debug('generateRoomConfiguration', roomCreationArgs.roomDescription);

  const fittingSemantics = await generateDefaultFittingSemantics(roomCreationArgs);

  const room = Room.fromFittingSemanticsAndDescription(fittingSemantics, roomCreationArgs.roomDescription);
  roomCreationArgs.visualizer?.tryRender(roomCreationArgs.roomDescription, 'room description');

  const roomFurnisher = new AutoInteriorBlogRoomFurnisher(fittingSemantics, roomCreationArgs, room);
  const fittingLayout = roomFurnisher.generateFittingLayout();
  log.debug('fittingLayout', fittingLayout);

  roomCreationArgs.visualizer?.tryRender(fittingLayout, 'final fitting layout');

  return fileUtils.convertJSONToYAML(fittingLayout.toRoomConfiguration());
}

export class AutoInteriorBlogRoomFurnisher {
  private readonly fittingSemantics: IFittingModels;
  
  private readonly roomCreationArgs: IRoomCreationArgs;
  private readonly room: IRoom;

  // Simulated annealing method to solve placements.
  private iteration = 0;
  private temperature = 1;
  private coolingRate = 0.0002;
  private minTemperature = 0.00001; 

  constructor(fittingSemantics: IFittingModels, roomCreationArgs: IRoomCreationArgs, room: IRoom) {
    this.fittingSemantics = fittingSemantics;
    this.roomCreationArgs = roomCreationArgs;
    this.room = room;
  }

  generateFittingLayout(): FittingLayout {
    log.debug('AutoInteriorBlogRoomFurnisher.generateFittingLayout');

    const fittingModelsToBePlaced = this.selectFittingModels();
    log.debug('fittingModelsToBePlaced', fittingModelsToBePlaced.length);

    // Initialize initial solution.
    let currentFittingLayout = FittingLayout.withFittingsPlacedAtOrigin(this.room, fittingModelsToBePlaced, this.fittingSemantics);
    this.roomCreationArgs.visualizer?.tryRender(currentFittingLayout, 'initial fitting layout');

    let currentCost = currentFittingLayout.getCost();

    // Set as current best.
    let bestFittingLayout = currentFittingLayout.clone();
    let bestCost = currentCost;

    log.debug('initial cost', bestCost);

    return this.findBestFittingLayout({
      currentFittingLayout, 
      currentCost,
      bestFittingLayout,
      bestCost
    });
  }

  findBestFittingLayout(fittingLayoutCostState: IFittingLayoutCostState): FittingLayout {
    while (this.temperature > this.minTemperature) {
      //log.debug('iteration', this.iteration, 'temperature', this.temperature);

      // Base new neighbour solution on current solution.
      const neighbourFittingLayout = fittingLayoutCostState.currentFittingLayout.clone();

      // Move neighbour solution "one step" away from current solution.
      const randomFittingInNeighbourSolution = neighbourFittingLayout.getRandomFitting();

      if (this.iteration % 2 == 0) {
        fittings.moveInDirection(randomFittingInNeighbourSolution, 0.1, Math.random() * 2 * Math.PI);
      }

      if (this.iteration % 2 == 1) {
        fittings.rotateCounterClockwiseInRadians(randomFittingInNeighbourSolution, (Math.random() % 4) * 0.5 * Math.PI);
      }

      //this.roomCreationArgs.visualizer?.tryRender(neighbourFittingLayout, `iteration ${this.iteration}'s adjusted fitting layout`);

      // Get cost of neighbour solution.
      const neighbourCost = neighbourFittingLayout.getCost();

      // Decide if neighbour solution should be accepted.
      const acceptanceProbabilityValue = acceptanceProbability(fittingLayoutCostState.currentCost, neighbourCost, this.temperature);
      log.trace('acceptanceProbabilityValue', acceptanceProbabilityValue);

      if (acceptanceProbabilityValue > Math.random()) {
        fittingLayoutCostState.currentFittingLayout = neighbourFittingLayout;

        // Update current cost to new current solution.
        fittingLayoutCostState.currentCost = neighbourCost;
      }

      if (fittingLayoutCostState.currentCost < fittingLayoutCostState.bestCost) {
        fittingLayoutCostState.bestFittingLayout = fittingLayoutCostState.currentFittingLayout.clone();
        fittingLayoutCostState.bestCost = fittingLayoutCostState.currentCost;
      }

      // Cool system.
      this.temperature *= 1 - this.coolingRate;

      this.iteration += 1;

      log.debug('iteration', this.iteration, 'temperature', this.temperature, 'current cost', fittingLayoutCostState.currentCost, 'best cost', fittingLayoutCostState.bestCost);

      if (this.temperature <= this.minTemperature) {
        log.debug('found best fitting layout', this.iteration);
      }
    }

    return fittingLayoutCostState.bestFittingLayout;
  }

  private selectFittingModels(): IFittingModel[] {
    log.trace('AutoInteriorBlogRoomFurnisher.selectFittingModels');

    const selectedFittingModels: IFittingModel[] = [];

    const areaToBeOccupied = this.room.area() * this.roomCreationArgs.fillTarget;
   
    let areaOccupied = 0, selectedCount = 0;
    while (areaOccupied < areaToBeOccupied) {
      log.trace('areaOccupied', areaOccupied, 'areaToBeOccupied', areaToBeOccupied);

      const fittingPriorities = this.getFittingPrioritiesForRoomType();
      const totalImportance = this.getTotalImportance(areaToBeOccupied, fittingPriorities);

      let result = Math.random() * totalImportance;
      let importanceCounter = 0;

      for (const fittingPriority of fittingPriorities) { 
        importanceCounter += importance(fittingPriority, areaToBeOccupied, selectedCount);

        if (result < importanceCounter) {
          const fittingModelsForCurrentPriorityFittingType = this.fittingSemantics.fittingModels.filter(fittingModel => fittingModel.fittingCategory === fittingPriority.fittingCategory);

          const modelFittingToBeAdded = fittingModelsForCurrentPriorityFittingType[Math.floor(Math.random() * fittingModelsForCurrentPriorityFittingType.length)];
          if (!modelFittingToBeAdded) { throw Error(`No fitting model found for fitting priority with fitting category: ${fittingPriority.fittingCategory}`); }
          
          //log.debug('modelFittingToBeAdded', modelFittingToBeAdded);
          selectedFittingModels.push(modelFittingToBeAdded);
          areaOccupied += fittingModels.baseArea(modelFittingToBeAdded);
          selectedCount += 1;

          break; // A fitting has been selected.
        }
      }
    }

    return selectedFittingModels;
  }

  private getTotalImportance(areaToBeOccupied: number, fittingPriorities: IFittingPriority[]): number {
    log.trace('AutoInteriorBlogRoomFurnisher.getTotalImportance');

    let totalImportance = 0;

    fittingPriorities.forEach(fittingPriority => { totalImportance += importance(fittingPriority, areaToBeOccupied); });
    
    return totalImportance;
  }

  private getFittingPrioritiesForRoomType(): IFittingPriority[] {
    log.trace('AutoInteriorBlogRoomFurnisher.getFittingPrioritiesForRoomType');

    const roomType = Room.getRoomType(this.fittingSemantics, this.room.description.roomCategory);

    return roomType.fittingPriorities;
  }
}

interface IFittingLayoutCostState {
  currentFittingLayout: FittingLayout;
  currentCost: number;
  bestFittingLayout: FittingLayout;
  bestCost: number;
}

const acceptanceProbability = (cost: number, otherCost: number, temperature: number): number => {
  // If the other solution is better, accept it.
  if (otherCost < cost) { return 1; }
   
  // If the other solution is worse, calculate an acceptance probability.
  return Math.exp((cost - otherCost) / temperature);
}