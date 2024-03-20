// This file is responsible for defining backend dependencies. See: https://github.com/tsapporg/ts-npm/tree/aws-sample
const awsSDKVersion = '3.427.0';

const npmPackage: any = {
  dependencies: {
    '@openapi-ts/aws-lambda': '1.0.4', // Used for routing of backend business logic when backend deployed to AWS Lambda.

    '@aws-sdk/client-s3': awsSDKVersion, // Used as option for storing room configurations.
    '@aws-sdk/client-dynamodb': awsSDKVersion, // Used as option for storing room configurations.
    '@aws-sdk/client-bedrock-runtime': awsSDKVersion, // Used for generating room configurations with LLMs.
    '@aws-sdk/client-lambda': awsSDKVersion, // Used for starting renders for room configurations.
    
    'sqlite': '5.0.1', // Used by furniture placement algorithms to get dataset listing data.
    'sqlite3': '5.1.6', // ^
    '@types/sqlite3': '3.1.8' // ^
  },
  devDependencies: {
    'typescript': '5.2.2',
    '@types/node': '18.11.18',
    'ts-node': '10.9.1',
    'tslib': '2.4.0',

    'ibm-openapi-validator': '1.14.2', // Used to validate OpenAPI def.
    'fastify': '4.18.0' // Used for local backend HTTP server.
  }
}

export default { npmPackage }