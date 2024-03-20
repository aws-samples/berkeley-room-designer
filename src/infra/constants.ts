// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for defining infra constants.
import * as IAM from 'aws-cdk-lib/aws-iam';
import AppStage from './stage';

export interface CommonProps {
  readonly stage: AppStage;
}

export const allowPutMetrics = new IAM.PolicyStatement({
  effect: IAM.Effect.ALLOW,
  resources: ['*'],
  actions: ['cloudwatch:PutMetricData']
});

export const allowPutLogs = new IAM.PolicyStatement({
  effect: IAM.Effect.ALLOW,
  resources: ['*'],
  actions: ['logs:PutLogEventsBatch', 'logs:PutLogEvents', 'logs:CreateLogStream']
});