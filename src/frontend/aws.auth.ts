// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for handling AWS auth.
// The application only requires AWS credentials when furniture placement algorithms
//  are run via the CLI since it does't use the API.
// The API the frontend calls is unauthenticated but rate-limited since this is a sample
//  and user management is outside scope.
import * as log from 'ts-app-logger';
import { fromIni } from '@aws-sdk/credential-providers';

export default class AWSAuth {
  getLocalConfigWithCredentials(): any {
    log.debug('getLocalConfigWithCredentials', process.env.AWS_REGION, process.env.AWS_PROFILE);

    if (!process.env.AWS_PROFILE || !process.env.AWS_REGION) { throw Error('Please set AWS_PROFILE or AWS_REGION env vars.'); }

    const awsCredentialIdentityProvider = fromIni({ profile: process.env.AWS_PROFILE });

    return {
      //logger: log.debug,
      region: process.env.AWS_REGION,
      credentials: awsCredentialIdentityProvider
    }
  }
}