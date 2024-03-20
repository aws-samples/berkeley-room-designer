// This file is responsible for defining additional dataset to sqlite db dependencies. See: https://github.com/tsapporg/ts-npm/tree/aws-sample
const npmPackage: any = {
  dependencies: {},
  devDependencies: {
    'csv-reader': '1.0.12', // Used to parse berkeley dataset.

    'sqlite': '5.0.1', // Used to store berkeley listings in sqlite3 db (FYI: backend also needs and declares these dependencies).
    'sqlite3': '5.1.6', // ^
    '@types/sqlite3': '3.1.8' // ^
  }
}

export default { npmPackage }