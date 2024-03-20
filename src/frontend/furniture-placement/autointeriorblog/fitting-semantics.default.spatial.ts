// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for defining the spatial constants for the default fitting semantics this furniture placement algorithm uses.
// For each fitting category in the berkeley.db, e.g. chair, table, we need to define how best to place it in a room  - 
//  at what orientation, should it be placed along a wall?, what if else it should be placed with, and how much clearance does it need on which side?
// Some of these values are static, some are probablistic.
import { FittingCategoryType } from '../iface';
import { IClearanceArea, IFittingCategorySpatialSemantics } from './iface';

const getDefaultFittingCategorySpatialSemantics = (fittingCategory: FittingCategoryType): IFittingCategorySpatialSemantics => {
  return {
    fittingCategory,
    orientedness: 'equilateral',
    hasIdealWallContact: false,
    idealOrientationToWall: 0,
    spatialRelations: []
  };
}

const rugFittingCategorySpatialSemantics = getDefaultFittingCategorySpatialSemantics('rug');

const floorLightFittingCategorySpatialSemantics = getDefaultFittingCategorySpatialSemantics('floor light');
const wallLightFittingCategorySpatialSemantics = getDefaultFittingCategorySpatialSemantics('wall light');
const ceilingLightFittingCategorySpatialSemantics = getDefaultFittingCategorySpatialSemantics('ceiling light');
const lightFittingCategorySpatialSemantics = getDefaultFittingCategorySpatialSemantics('light');

const chairFittingCategorySpatialSemantics: IFittingCategorySpatialSemantics = {
  fittingCategory: 'chair',
  orientedness: 'oriented',
  hasIdealWallContact: false,
  idealOrientationToWall: 0,
  spatialRelations: [
    {
      relatedFittingCategory: 'table',
      idealDistance: 0.2,
      idealOrientation: 0,
      rightSidePropability: 1,
      backSidePropability: 1,
      leftSidePropability: 0.5,
      frontSidePropability: 0.5
    }
  ]
};
const sofaFittingCategorySpatialSemantics: IFittingCategorySpatialSemantics = {
  fittingCategory: 'sofa',
  orientedness: 'oriented',
  hasIdealWallContact: true,
  idealOrientationToWall: 0,
  spatialRelations: []
};
const armchairFittingCategorySpatialSemantics: IFittingCategorySpatialSemantics = {
  fittingCategory: 'armchair',
  orientedness: 'oriented',
  hasIdealWallContact: false,
  idealOrientationToWall: 0,
  spatialRelations: [
    {
      relatedFittingCategory: 'side table',
      idealDistance: 0.25,
      idealOrientation: 0,
      rightSidePropability: 1,
      backSidePropability: 0,
      leftSidePropability: 0.1,
      frontSidePropability: 0.1
    }
  ]
};
const patioChairFittingCategorySpatialSemantics = chairFittingCategorySpatialSemantics;
const stoolFittingCategorySpatialSemantics = chairFittingCategorySpatialSemantics;
const ottomanFittingCategorySpatialSemantics = chairFittingCategorySpatialSemantics;
const benchFittingCategorySpatialSemantics = chairFittingCategorySpatialSemantics;

const mirrorFittingCategorySpatialSemantics = getDefaultFittingCategorySpatialSemantics('mirror');

const bedFittingCategorySpatialSemantics = getDefaultFittingCategorySpatialSemantics('bed');
const headboardFittingCategorySpatialSemantics = getDefaultFittingCategorySpatialSemantics('headboard');

const wardrobeFittingCategorySpatialSemantics = getDefaultFittingCategorySpatialSemantics('wardrobe');
const dresserFittingCategorySpatialSemantics = getDefaultFittingCategorySpatialSemantics('dresser');
const bookcaseFittingCategorySpatialSemantics = getDefaultFittingCategorySpatialSemantics('bookcase');
const vanityFittingCategorySpatialSemantics = getDefaultFittingCategorySpatialSemantics('vanity');
const deskFittingCategorySpatialSemantics = getDefaultFittingCategorySpatialSemantics('desk');
const cupboardFittingCategorySpatialSemantics = getDefaultFittingCategorySpatialSemantics('cupboard');
const mediaCabinetFittingCategorySpatialSemantics = getDefaultFittingCategorySpatialSemantics('media cabinet');
const kitchenCartFittingCategorySpatialSemantics = getDefaultFittingCategorySpatialSemantics('kitchen cart');
const chestFittingCategorySpatialSemantics = getDefaultFittingCategorySpatialSemantics('chest');
const wallShelvingUnitFittingCategorySpatialSemantics = getDefaultFittingCategorySpatialSemantics('wall shelving unit');
const shelvingUnitFittingCategorySpatialSemantics = getDefaultFittingCategorySpatialSemantics('shelving unit');

const tableFittingCategorySpatialSemantics: IFittingCategorySpatialSemantics = {
  fittingCategory: 'table',
  orientedness: 'equilateral',
  hasIdealWallContact: false,
  idealOrientationToWall: 0,
  spatialRelations: []
};
const sideTableFittingCategorySpatialSemantics = tableFittingCategorySpatialSemantics;
const coffeeTableFittingCategorySpatialSemantics: IFittingCategorySpatialSemantics = {
  fittingCategory: 'coffee table',
  orientedness: 'equilateral',
  hasIdealWallContact: false,
  idealOrientationToWall: 0,
  spatialRelations: [
    {
      relatedFittingCategory: 'sofa',
      idealDistance: 0.25,
      idealOrientation: 0,
      rightSidePropability: 1,
      backSidePropability: 0,
      leftSidePropability: 0.1,
      frontSidePropability: 0.1
    }
  ]
};
const nightStandFittingCategorySpatialSemantics = getDefaultFittingCategorySpatialSemantics('night stand');

const floorPlanterFittingCategorySpatialSemantics = getDefaultFittingCategorySpatialSemantics('floor planter');
const wallPlanterFittingCategorySpatialSemantics = getDefaultFittingCategorySpatialSemantics('wall planter');
const planterFittingCategorySpatialSemantics = getDefaultFittingCategorySpatialSemantics('planter');

const ceilingFanFittingCategorySpatialSemantics = getDefaultFittingCategorySpatialSemantics('ceiling fan');

const wallClockFittingCategorySpatialSemantics = getDefaultFittingCategorySpatialSemantics('wall clock');

const wallArtFittingCategorySpatialSemantics = getDefaultFittingCategorySpatialSemantics('wall art');

const pictureFrameFittingCategorySpatialSemantics = getDefaultFittingCategorySpatialSemantics('picture frame');

const fittingCategorySpatialSemantics: Map<FittingCategoryType, IFittingCategorySpatialSemantics> = new Map<FittingCategoryType, IFittingCategorySpatialSemantics>();
fittingCategorySpatialSemantics.set('rug', rugFittingCategorySpatialSemantics);

fittingCategorySpatialSemantics.set('floor light', floorLightFittingCategorySpatialSemantics);
fittingCategorySpatialSemantics.set('wall light', wallLightFittingCategorySpatialSemantics);
fittingCategorySpatialSemantics.set('ceiling light', ceilingLightFittingCategorySpatialSemantics);
fittingCategorySpatialSemantics.set('light', lightFittingCategorySpatialSemantics);

fittingCategorySpatialSemantics.set('chair', chairFittingCategorySpatialSemantics);
fittingCategorySpatialSemantics.set('sofa', sofaFittingCategorySpatialSemantics);
fittingCategorySpatialSemantics.set('armchair', armchairFittingCategorySpatialSemantics);
fittingCategorySpatialSemantics.set('patio chair', patioChairFittingCategorySpatialSemantics);
fittingCategorySpatialSemantics.set('stool', stoolFittingCategorySpatialSemantics);
fittingCategorySpatialSemantics.set('ottoman', ottomanFittingCategorySpatialSemantics);
fittingCategorySpatialSemantics.set('bench', benchFittingCategorySpatialSemantics);

fittingCategorySpatialSemantics.set('mirror', mirrorFittingCategorySpatialSemantics);

fittingCategorySpatialSemantics.set('bed', bedFittingCategorySpatialSemantics);
fittingCategorySpatialSemantics.set('headboard', headboardFittingCategorySpatialSemantics);

fittingCategorySpatialSemantics.set('wardrobe', wardrobeFittingCategorySpatialSemantics);
fittingCategorySpatialSemantics.set('dresser', dresserFittingCategorySpatialSemantics);
fittingCategorySpatialSemantics.set('bookcase', bookcaseFittingCategorySpatialSemantics);
fittingCategorySpatialSemantics.set('vanity', vanityFittingCategorySpatialSemantics);
fittingCategorySpatialSemantics.set('desk', deskFittingCategorySpatialSemantics);
fittingCategorySpatialSemantics.set('cupboard', cupboardFittingCategorySpatialSemantics);
fittingCategorySpatialSemantics.set('media cabinet', mediaCabinetFittingCategorySpatialSemantics);
fittingCategorySpatialSemantics.set('kitchen cart', kitchenCartFittingCategorySpatialSemantics);
fittingCategorySpatialSemantics.set('chest', chestFittingCategorySpatialSemantics);
fittingCategorySpatialSemantics.set('wall shelving unit', wallShelvingUnitFittingCategorySpatialSemantics);
fittingCategorySpatialSemantics.set('shelving unit', shelvingUnitFittingCategorySpatialSemantics);

fittingCategorySpatialSemantics.set('table', tableFittingCategorySpatialSemantics);
fittingCategorySpatialSemantics.set('side table', sideTableFittingCategorySpatialSemantics);
fittingCategorySpatialSemantics.set('coffee table', coffeeTableFittingCategorySpatialSemantics);
fittingCategorySpatialSemantics.set('night stand', nightStandFittingCategorySpatialSemantics);

fittingCategorySpatialSemantics.set('floor planter', floorPlanterFittingCategorySpatialSemantics);
fittingCategorySpatialSemantics.set('wall planter', wallPlanterFittingCategorySpatialSemantics);
fittingCategorySpatialSemantics.set('planter', planterFittingCategorySpatialSemantics);

fittingCategorySpatialSemantics.set('ceiling fan', ceilingFanFittingCategorySpatialSemantics);

fittingCategorySpatialSemantics.set('wall clock', wallClockFittingCategorySpatialSemantics);

fittingCategorySpatialSemantics.set('wall art', wallArtFittingCategorySpatialSemantics);
fittingCategorySpatialSemantics.set('picture frame', pictureFrameFittingCategorySpatialSemantics);

const defaultClearanceAreas: IClearanceArea[] = [
  {
    side: 'front',
    perpendicularLength: 0
  },
  {
    side: 'back',
    perpendicularLength: 0
  },
  {
    side: 'right',
    perpendicularLength: 0
  },
  {
    side: 'left',
    perpendicularLength: 0
  }
];

// FIXME Can listings be placed on top? Will 0's works for this?
const rugClearanceAreas: IClearanceArea[] = defaultClearanceAreas;

const floorLightClearanceAreas: IClearanceArea[] = defaultClearanceAreas;
const wallLightClearanceAreas = floorLightClearanceAreas;
const ceilingLightClearanceAreas = floorLightClearanceAreas;
const lightClearanceAreas = floorLightClearanceAreas;

const chairClearanceAreas: IClearanceArea[] = [
  {
    side: 'front',
    perpendicularLength: 0.27
  },
  {
    side: 'back',
    perpendicularLength: 0.27
  },
  {
    side: 'right',
    perpendicularLength: 0.1
  },
  {
    side: 'left',
    perpendicularLength: 0.1
  }
];
const sofaClearanceAreas: IClearanceArea[] = [
  {
    side: 'front',
    perpendicularLength: 0.25
  },
  {
    side: 'back',
    perpendicularLength: 0
  },
  {
    side: 'right',
    perpendicularLength: 0
  },
  {
    side: 'left',
    perpendicularLength: 0
  }
];
const armchairClearanceAreas: IClearanceArea[] = [
  {
    side: 'front',
    perpendicularLength: 0.25
  },
  {
    side: 'back',
    perpendicularLength: 0
  },
  {
    side: 'right',
    perpendicularLength: 0
  },
  {
    side: 'left',
    perpendicularLength: 0
  }
];
const patioChairClearanceAreas = chairClearanceAreas;
const stoolClearanceAreas = chairClearanceAreas;
const ottomanClearanceAreas = chairClearanceAreas;
const benchClearanceAreas = chairClearanceAreas;

const mirrorClearanceAreas = defaultClearanceAreas;

const bedClearanceAreas = defaultClearanceAreas;
const headboardClearanceAreas = defaultClearanceAreas;

const wardrobeClearanceAreas = defaultClearanceAreas;
const dresserClearanceAreas = defaultClearanceAreas;
const bookcaseClearanceAreas = defaultClearanceAreas;
const vanityClearanceAreas = defaultClearanceAreas;
const deskClearanceAreas = defaultClearanceAreas;
const cupboardClearanceAreas = defaultClearanceAreas;
const mediaCabinetClearanceAreas = defaultClearanceAreas;
const kitchenCartClearanceAreas = defaultClearanceAreas;
const chestClearanceAreas = defaultClearanceAreas;
const wallShelvingUnitClearanceAreas = defaultClearanceAreas;
const shelvingUnitClearanceAreas = defaultClearanceAreas;

const tableClearanceAreas = defaultClearanceAreas;
const sideTableClearanceAreas = defaultClearanceAreas;
const coffeeTableClearanceAreas: IClearanceArea[] = [
  {
    side: 'front',
    perpendicularLength: 0
  },
  {
    side: 'back',
    perpendicularLength: 0
  },
  {
    side: 'right',
    perpendicularLength: 0
  },
  {
    side: 'left',
    perpendicularLength: 0
  }
];
const nightStandClearanceAreas = defaultClearanceAreas;

const floorPlanterClearanceAreas = defaultClearanceAreas;
const wallPlanterClearanceAreas = defaultClearanceAreas;
const planterClearanceAreas = defaultClearanceAreas;

const ceilingFanClearanceAreas = defaultClearanceAreas;

const wallClockClearanceAreas = defaultClearanceAreas;

const wallArtClearanceAreas = defaultClearanceAreas;

const pictureFrameClearanceAreas = defaultClearanceAreas;

const clearanceAreas: Map<FittingCategoryType, IClearanceArea[]> = new Map<FittingCategoryType, IClearanceArea[]>();
clearanceAreas.set('rug', rugClearanceAreas);

clearanceAreas.set('floor light', floorLightClearanceAreas);
clearanceAreas.set('wall light', wallLightClearanceAreas);
clearanceAreas.set('ceiling light', ceilingLightClearanceAreas);
clearanceAreas.set('light', lightClearanceAreas);

clearanceAreas.set('chair', chairClearanceAreas);
clearanceAreas.set('sofa', sofaClearanceAreas);
clearanceAreas.set('armchair', armchairClearanceAreas);
clearanceAreas.set('patio chair', patioChairClearanceAreas);
clearanceAreas.set('stool', stoolClearanceAreas);
clearanceAreas.set('ottoman', ottomanClearanceAreas);
clearanceAreas.set('bench', benchClearanceAreas);

clearanceAreas.set('mirror', mirrorClearanceAreas);

clearanceAreas.set('bed', bedClearanceAreas);
clearanceAreas.set('headboard', headboardClearanceAreas);

clearanceAreas.set('wardrobe', wardrobeClearanceAreas);
clearanceAreas.set('dresser', dresserClearanceAreas);
clearanceAreas.set('bookcase', bookcaseClearanceAreas);
clearanceAreas.set('vanity', vanityClearanceAreas);
clearanceAreas.set('desk', deskClearanceAreas);
clearanceAreas.set('cupboard', cupboardClearanceAreas);
clearanceAreas.set('media cabinet', mediaCabinetClearanceAreas);
clearanceAreas.set('kitchen cart', kitchenCartClearanceAreas);
clearanceAreas.set('chest', chestClearanceAreas);
clearanceAreas.set('wall shelving unit', wallShelvingUnitClearanceAreas);
clearanceAreas.set('shelving unit', shelvingUnitClearanceAreas);

clearanceAreas.set('table', tableClearanceAreas);
clearanceAreas.set('side table', sideTableClearanceAreas);
clearanceAreas.set('coffee table', coffeeTableClearanceAreas);
clearanceAreas.set('night stand', nightStandClearanceAreas);

clearanceAreas.set('floor planter', floorPlanterClearanceAreas);
clearanceAreas.set('wall planter', wallPlanterClearanceAreas);
clearanceAreas.set('planter', planterClearanceAreas);

clearanceAreas.set('ceiling fan', ceilingFanClearanceAreas);

clearanceAreas.set('wall clock', wallClockClearanceAreas);

clearanceAreas.set('wall art', wallArtClearanceAreas);
clearanceAreas.set('picture frame', pictureFrameClearanceAreas);

export { getDefaultFittingCategorySpatialSemantics, fittingCategorySpatialSemantics, clearanceAreas, defaultClearanceAreas }