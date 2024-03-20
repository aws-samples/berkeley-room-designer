// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for defining common cloud resource functionality.
import AppStage from './stage';
import * as cdk from 'aws-cdk-lib';

export const getRemovalPolicy = (stage: AppStage): cdk.RemovalPolicy | undefined => {
  return stage.name === stage.main ? cdk.RemovalPolicy.DESTROY : undefined;
}