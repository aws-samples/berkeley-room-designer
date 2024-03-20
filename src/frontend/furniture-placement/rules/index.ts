// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This algorithm is not in use! We left it here for consideration later.
// I'm not 100% sure of this, but we think the algorithmic approach to placing room furniture could
//  just be boiled down to different rule sets with various knobs.
// For example, "generate room - midwest farmhouse" might place more
//  shelving along the walls for knick-knacks (rules), add lots of types of chairs everywhere (rules),
//  dial up the density of objects (knob), and place plastic on the furniture (joke) :)
export interface IFittingRule {
  name: string;
  description: string;
  roomSemantics: RoomType[];
  spaceType: SpaceType[];
  fittingType: FittingType[];
  apply: CallableFunction;
}

export type RoomType = '*' | 'living room' | 'bedroom';
export type SpaceType = '*' | 'small' | 'large';
export type SpaceShapeType = '*' | 'square' | 'rectangle';
export type SpaceClassificationType = '*' | 'long and narrow';
export type FittingType = '*' | 'chair' | 'sofa' | 'floor lamp';

export class DefaultFittingRules {
  // See: https://www.invaluable.com/blog/how-to-arrange-furniture/
  rules: IFittingRule[] = [
    {
      name: 'Keep walkable space between furniture pieces.',
      description: '',
      roomSemantics: [],
      spaceType: [],
      fittingType: [],
      apply: () => { }
    },
    {
      name: 'Create room at the entryway with a long bench that will also serve as a drop-off spot for purses, shoes, etc.',
      description: '',
      roomSemantics: ['living room'],
      spaceType: [],
      fittingType: [],
      apply: () => { }
    },
    {
      name: 'Set up seating around the fireplace or another focal point of the room so it\'s visually balanced.',
      description: '',
      roomSemantics: ['living room'],
      spaceType: [],
      fittingType: [],
      apply: () => { }
    },

    {
      name: 'In a large living room with lots of windows, arrange furniture front and center.',
      description: '',
      roomSemantics: ['living room'],
      spaceType: [],
      fittingType: [],
      apply: () => { }
    },
    {
      name: 'Seating arrangements should face each other, no more than 8 feet apart, encouraging conversation.',
      description: '',
      roomSemantics: ['living room'],
      spaceType: [],
      fittingType: [],
      apply: () => { }
    },
    {
      name: 'Anchor the seating with a large area rug.',
      description: '',
      roomSemantics: ['living room'],
      spaceType: [],
      fittingType: [],
      apply: () => { }
    },
    {
      name: 'Tuck extra seating and storage around the outskirts of the living room close to the walls.',
      description: '',
      roomSemantics: [],
      spaceType: [],
      fittingType: [],
      apply: () => { }
    },

    {
      name: 'For small living rooms, add visual height to the design by incorporating taller pieces.',
      description: '',
      roomSemantics: [],
      spaceType: [],
      fittingType: [],
      apply: () => { }
    },
    {
      name: 'Offset coffee tables and centerpieces to open up room in the walkway.',
      description: '',
      roomSemantics: [],
      spaceType: [],
      fittingType: [],
      apply: () => { }
    },
    {
      name: 'Pair shelving units tucked into either side of the mantle for extra storage.',
      description: '',
      roomSemantics: [],
      spaceType: [],
      fittingType: [],
      apply: () => { }
    },
    {
      name: 'Decorate with mirrors to make the space appear larger.',
      description: '',
      roomSemantics: [],
      spaceType: [],
      fittingType: [],
      apply: () => { }
    },

    {
      name: 'Place the bed facing the window as far from the door as possible.',
      description: '',
      roomSemantics: [],
      spaceType: [],
      fittingType: [],
      apply: () => { }
    },
    {
      name: 'A large area rug will make the space feel cozy and add an extra design element.',
      description: '',
      roomSemantics: [],
      spaceType: [],
      fittingType: [],
      apply: () => { }
    },
    {
      name: 'Include a desk or vintage dressing table and mirror directly across from the doorway.',
      description: '',
      roomSemantics: [],
      spaceType: [],
      fittingType: [],
      apply: () => { }
    },
    {
      name: 'Nightstands the same height as your bed and on either side will balance the room.',
      description: '',
      roomSemantics: [],
      spaceType: [],
      fittingType: [],
      apply: () => { }
    },
    {
      name: 'Place a bench at the end of the bed for extra seating.',
      description: '',
      roomSemantics: [],
      spaceType: [],
      fittingType: [],
      apply: () => { }
    },



    {
      name: 'The bed should be the focal point of a square layout anchored with an area rug.',
      description: '',
      roomSemantics: [],
      spaceType: [],
      fittingType: [],
      apply: () => { }
    },
    {
      name: 'A tall, long storage piece like an armoire will add height to the room.',
      description: '',
      roomSemantics: [],
      spaceType: [],
      fittingType: [],
      apply: () => { }
    },
    {
      name: 'Less furniture will help to maximize the space, so play around until you discover an optimal layout.',
      description: '',
      roomSemantics: [],
      spaceType: [],
      fittingType: [],
      apply: () => { }
    },

    {
      name: 'Place the bed along the room\'s largest wall.',
      description: '',
      roomSemantics: [],
      spaceType: [],
      fittingType: [],
      apply: () => { }
    },
    {
      name: 'Add a dresser directly across from the bed. This is a great place for your media center.',
      description: '',
      roomSemantics: [],
      spaceType: [],
      fittingType: [],
      apply: () => { }
    },
    {
      name: 'Use small freestanding furniture like a stool for extra seating in a small room.',
      description: '',
      roomSemantics: [],
      spaceType: [],
      fittingType: [],
      apply: () => { }
    },
    {
      name: 'Don\'t forget to consider the location of wall outlets in the room—this will impact your furniture arrangement.',
      description: '',
      roomSemantics: [],
      spaceType: [],
      fittingType: [],
      apply: () => { }
    },
    {
      name: 'Prioritize functionality.',
      description: '',
      roomSemantics: [],
      spaceType: [],
      fittingType: [],
      apply: () => { }
    },

  ]
}