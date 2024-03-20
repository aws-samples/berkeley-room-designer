// This file is responsible for defining additional AWS infra dependencies. See: https://github.com/tsapporg/ts-npm/tree/aws-sample
const awsCdkVersion = '2.99.0';
const npmPackage: any = {
  dependencies: {},
  devDependencies: {
    'aws-cdk': awsCdkVersion,
    'aws-cdk-lib': awsCdkVersion,
    'cdk-nag': '2.28.0',
    'constructs': '10.1.196',
    'source-map-support': '0.5.21'
  }
}

export default { npmPackage }