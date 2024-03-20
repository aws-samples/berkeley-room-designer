// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for defining fitting priority utilities.
import { IFittingPriority } from './iface';

const referenceArea: number = 10; // FIXME What is this constant?

export const importance = (fittingPriority: IFittingPriority, targetArea: number, selectedCount: number = 0): number => {
  const importanceValue = (fittingPriority.initialImportance * Math.pow(fittingPriority.subsequentImportanceFactor, selectedCount * referenceArea / targetArea));

  //log.trace('fitting-priority.importance', importanceValue);

  return importanceValue;
}