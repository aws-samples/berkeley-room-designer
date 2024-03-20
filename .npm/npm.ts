// This file is responsible for defining the NPM package and the application's shared build dependencies. See: https://github.com/tsapporg/ts-npm/tree/aws-sample
const awsSDKVersion = '3.427.0';

const npmPackage: any = {
  name: 'berkeley-room-designer',
  version: '0.0.0',
  private: false,
  type: 'module',
  dependencies: {
    // Common deps used in more than one src/ folder:

    // Logging:
    'ts-app-logger': 'github:tsapporg/ts-app-logger#ccc4245cb7ca21cb5713d714eb67f1d507ceaefc',
    
    // AWS auth:
    '@aws-sdk/credential-providers': awsSDKVersion,

    '@types/aws-lambda': '8.10.125', // Used to get AWS Lambda handler types anywhere src is deployed as Node.js-based AWS Lambda (not custom container image).

    // Error handling:
    'serialize-error': '11.0.2', // Used to handle error stringifying.

    'yaml': '2.3.2', // Used to import and export room configurations.

    // Furniture placement:
    'ts-matrix': '1.3.2', // Used by furniture placement algorithms.
    '@turf/turf': '6.5.0', // ^
    '@turf/bbox-polygon': '6.5.0' // ^
  },
  devDependencies: {
    'typescript': '5.2.2',
    '@types/node': '20.10.0',
    'ts-node': '10.9.1', // Used for TypeScript execution. Had issues with execution, started to replace with tsx.
    'tsx': '4.6.0', // Used for TypeScript execution, starting to move to this if ts-node fails.
    'tslib': '2.4.0',

    // Cross-platform build support:
    'shx': '0.3.4', // Used to invoke cross-platform build commands.
    'cross-env': '5.2.1', // Used to set cross-platform env variables.

    // Auditing:
    'license-checker-rseidelsohn': '4.3.0', // Used to ensure NPM licenses in dependencies are OK to use. 
    'repolinter': 'github:todogroup/repolinter#main', // Need main branch. See: https://github.com/todogroup/repolinter/issues/299
    'license-report': '6.5.0', // Used to generate a license report.
    'source-licenser': '2.0.6', // Used to add license header to files.

    // Develop:
    'concurrently': '7.5.0', // Used to invoke multiple watch commands concurrently.
    'wait-on': '7.2.0' // Used to wait-on ports to run multiple Node.js processes at once (used with furniture placement algorithm visualizer).
  }
}

export default { npmPackage }