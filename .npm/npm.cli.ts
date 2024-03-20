// This file is responsible for defining additional CLI dependencies. See: https://github.com/tsapporg/ts-npm/tree/aws-sample
const npmPackage: any = {
  dependencies: {},
  devDependencies: {
    'ts-command-line-args': '2.5.1', // Used to process CLI args.
  }
}

export default { npmPackage }