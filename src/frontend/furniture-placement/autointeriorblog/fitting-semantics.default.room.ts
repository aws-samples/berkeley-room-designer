// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for defining the default fitting semantics regarding rooms and their relationship to objects in them.
// These are just sample semantics - adjust as necessary.
import { fittingCategories } from '../iface';
import { IFittingPriority, IRoomSemantics } from './iface';

export const getLivingRoomSemantics = (): IRoomSemantics => {
  return {
    roomCategory: 'living room',
    fittingPriorities: [
      {
        fittingCategory: 'chair',
        initialImportance: 1,
        subsequentImportanceFactor: 0.8
      },
      {
        fittingCategory: 'table',
        initialImportance: 0.8,
        subsequentImportanceFactor: 0.1
      },
      {
        fittingCategory: 'sofa',
        initialImportance: 0.5,
        subsequentImportanceFactor: 0.2
      },
      {
        fittingCategory: 'media cabinet',
        initialImportance: 0.5,
        subsequentImportanceFactor: 0.2
      },
      {
        fittingCategory: 'armchair',
        initialImportance: 0.4,
        subsequentImportanceFactor: 0.2
      },
      {
        fittingCategory: 'ottoman',
        initialImportance: 0.4,
        subsequentImportanceFactor: 0.2
      },
      {
        fittingCategory: 'floor light',
        initialImportance: 0.4,
        subsequentImportanceFactor: 0.5
      },
      {
        fittingCategory: 'coffee table',
        initialImportance: 0.3,
        subsequentImportanceFactor: 0.2
      },
      {
        fittingCategory: 'ceiling light',
        initialImportance: 0.2,
        subsequentImportanceFactor: 0.0
      }
    ]
  }
}

export const getDiningRoomSemantics = (): IRoomSemantics => {
  return {
    roomCategory: 'dining room',
    fittingPriorities: [
      {
        fittingCategory: 'table',
        initialImportance: 1,
        subsequentImportanceFactor: 0.1
      },
      {
        fittingCategory: 'chair',
        initialImportance: 0.8,
        subsequentImportanceFactor: 0.7
      },
      {
        fittingCategory: 'armchair',
        initialImportance: 0.6,
        subsequentImportanceFactor: 0.5
      },
      {
        fittingCategory: 'ottoman',
        initialImportance: 0.5,
        subsequentImportanceFactor: 0.
      },
      {
        fittingCategory: 'side table',
        initialImportance: 0.5,
        subsequentImportanceFactor: 0.4
      },
      {
        fittingCategory: 'bookcase',
        initialImportance: 0.4,
        subsequentImportanceFactor: 0.3
      },
      {
        fittingCategory: 'floor light',
        initialImportance: 0.3,
        subsequentImportanceFactor: 0.2
      },
      {
        fittingCategory: 'ceiling light',
        initialImportance: 0.2,
        subsequentImportanceFactor: 0.0
      }
    ]
  }
}

export const getFamilyRoomSemantics = (): IRoomSemantics => {
  return getLivingRoomSemantics(); // I'm from the Mid-West, they are the same.
}

export const getOfficeRoomSemantics = (): IRoomSemantics => {
  return {
    roomCategory: 'office',
    fittingPriorities: [
      {
        fittingCategory: 'desk',
        initialImportance: 1,
        subsequentImportanceFactor: 0.0
      },
      {
        fittingCategory: 'chair',
        initialImportance: 0.9,
        subsequentImportanceFactor: 0.5
      },
      {
        fittingCategory: 'bookcase',
        initialImportance: 0.7,
        subsequentImportanceFactor: 0.2
      },
      {
        fittingCategory: 'wall planter',
        initialImportance: 0.5,
        subsequentImportanceFactor: 0.1
      },
      {
        fittingCategory: 'wall clock',
        initialImportance: 0.5,
        subsequentImportanceFactor: 0.0
      },
      {
        fittingCategory: 'wall art',
        initialImportance: 0.5,
        subsequentImportanceFactor: 0.2
      },
      {
        fittingCategory: 'floor light',
        initialImportance: 0.8,
        subsequentImportanceFactor: 0.2
      },
      {
        fittingCategory: 'ceiling light',
        initialImportance: 0.2,
        subsequentImportanceFactor: 0.0
      }
    ]
  }
}

export const getBedroomSemantics = (): IRoomSemantics => {
  return {
    roomCategory: 'bedroom',
    fittingPriorities: [
      {
        fittingCategory: 'bed',
        initialImportance: 0.9,
        subsequentImportanceFactor: 0.1
      },
      {
        fittingCategory: 'wardrobe',
        initialImportance: 0.8,
        subsequentImportanceFactor: 0.1
      },
      {
        fittingCategory: 'dresser',
        initialImportance: 0.7,
        subsequentImportanceFactor: 0.1
      },
      {
        fittingCategory: 'mirror',
        initialImportance: 0.7,
        subsequentImportanceFactor: 0.1
      },
      {
        fittingCategory: 'rug',
        initialImportance: 0.6,
        subsequentImportanceFactor: 0.1
      },
      {
        fittingCategory: 'armchair',
        initialImportance: 0.5,
        subsequentImportanceFactor: 0.2
      },
      {
        fittingCategory: 'bookcase',
        initialImportance: 0.4,
        subsequentImportanceFactor: 0.3
      },
      {
        fittingCategory: 'floor planter',
        initialImportance: 0.4,
        subsequentImportanceFactor: 0.3
      },
      {
        fittingCategory: 'floor light',
        initialImportance: 0.3,
        subsequentImportanceFactor: 0.2
      },
      {
        fittingCategory: 'ceiling light',
        initialImportance: 0.2,
        subsequentImportanceFactor: 0.0
      }
    ]
  }
}

export const getKitchenRoomSemantics = (): IRoomSemantics => {
  return {
    roomCategory: 'kitchen',
    fittingPriorities: [
      {
        fittingCategory: 'table',
        initialImportance: 1,
        subsequentImportanceFactor: 0.1
      },
      {
        fittingCategory: 'chair',
        initialImportance: 0.8,
        subsequentImportanceFactor: 0.7
      },
      {
        fittingCategory: 'kitchen cart',
        initialImportance: 0.6,
        subsequentImportanceFactor: 0.5
      },
      {
        fittingCategory: 'stool',
        initialImportance: 0.5,
        subsequentImportanceFactor: 0.4
      },
      {
        fittingCategory: 'floor planter',
        initialImportance: 0.3,
        subsequentImportanceFactor: 0.2
      },
      {
        fittingCategory: 'ceiling light',
        initialImportance: 0.2,
        subsequentImportanceFactor: 0.0
      }
    ]
  }
}

export const getConferenceRoomSemantics = (): IRoomSemantics => {
  return {
    roomCategory: 'conference room',
    fittingPriorities: [
      {
        fittingCategory: 'table',
        initialImportance: 1,
        subsequentImportanceFactor: 0.1
      },
      {
        fittingCategory: 'chair',
        initialImportance: 0.8,
        subsequentImportanceFactor: 0.7
      },
      {
        fittingCategory: 'media cabinet',
        initialImportance: 0.7,
        subsequentImportanceFactor: 0.3
      },
      {
        fittingCategory: 'wall shelving unit',
        initialImportance: 0.6,
        subsequentImportanceFactor: 0.3
      },
      {
        fittingCategory: 'ceiling light',
        initialImportance: 0.2,
        subsequentImportanceFactor: 0.0
      }
    ]
  }
}

export const getGenericRoomSemantics = (): IRoomSemantics => {
  const fittingPriorities: IFittingPriority[] = []; // Just randomize selections from all fitting categories.

  let currentFittingPriority = 1;
  
  fittingCategories.forEach(fittingCategory => {
    fittingPriorities.push({
      fittingCategory: fittingCategory.name,
      initialImportance: currentFittingPriority,
      subsequentImportanceFactor: 0.1
    });
    currentFittingPriority = currentFittingPriority - 0.1;
  });

  return {
    roomCategory: 'generic',
    fittingPriorities
  }
}