// This file is responsible for defining additional CLI visualizer dependencies used in developing furniture placement algorithms. See: https://github.com/tsapporg/ts-npm/tree/aws-sample
const npmPackage: any = {
  dependencies: {},
  devDependencies: {
    // Used to create GUI:
    '@nodegui/nodegui': '0.63.0',
    'source-map-support': '0.5.21',
    '@types/source-map-support': '0.5.8',

    // Used for inter-process communication b/t processes uses to run furniture placement algorithms,
    //  render useful debugging visuals, and display them. See makefile for details.
    'crocket': '1.0.15',
  
    // Used in various GUI visualizations:
    'fabric': 'beta',  // Used for visualizing furniture placement algorithms in 2D. See: https://github.com/fabricjs/fabric.js/issues/8299
    'canvas': '2.11.2', // Required by fabric (FIXME Not sure how many deps below are still required in their latest version, but previously they were required).
    'jsdom': '22.1.0', // ^
    '@types/jsdom': '21.1.3', // ^
    'xmldom': '0.6.0', // ^
  }
}

export default { npmPackage }