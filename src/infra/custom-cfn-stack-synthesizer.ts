// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
import { DefaultStackSynthesizer } from 'aws-cdk-lib';

interface CDKToolkitResources {
  qualifier: string;
  deployRoleArn: string;
  lookupRoleArn: string;
  fileAssetPublishingRoleArn: string;
  imageAssetPublishingRoleArn: string;
  cloudFormationExecutionRole: string;
}

const defaultCdkResources: CDKToolkitResources = {
  qualifier: 'hnb659fds',
  deployRoleArn: 'arn:${AWS::Partition}:iam::${AWS::AccountId}:role/cdk-${Qualifier}-deploy-role-${AWS::AccountId}-${AWS::Region}',
  lookupRoleArn: 'arn:${AWS::Partition}:iam::${AWS::AccountId}:role/cdk-${Qualifier}-lookup-role-${AWS::AccountId}-${AWS::Region}',
  fileAssetPublishingRoleArn: 'arn:${AWS::Partition}:iam::${AWS::AccountId}:role/cdk-${Qualifier}-file-publishing-role-${AWS::AccountId}-${AWS::Region}',
  imageAssetPublishingRoleArn: 'arn:${AWS::Partition}:iam::${AWS::AccountId}:role/cdk-${Qualifier}-image-publishing-role-${AWS::AccountId}-${AWS::Region}',
  cloudFormationExecutionRole: 'arn:${AWS::Partition}:iam::${AWS::AccountId}:role/cdk-${Qualifier}-cfn-exec-role-${AWS::AccountId}-${AWS::Region}'
}

type WhatResourcesToSynth = 'default' | 'app';

export function getCustomCfnStackSynthesizer(whatResourcesToSynth: WhatResourcesToSynth, qualifier: string) {
  let cdkResources = defaultCdkResources;
  
  if (whatResourcesToSynth === 'app') {
    cdkResources = {
      qualifier,
      deployRoleArn: 'arn:${AWS::Partition}:iam::${AWS::AccountId}:role/cdk-${Qualifier}-deploy-role-${AWS::AccountId}-${AWS::Region}',
      lookupRoleArn: 'arn:${AWS::Partition}:iam::${AWS::AccountId}:role/cdk-${Qualifier}-lookup-role-${AWS::AccountId}-${AWS::Region}',
      fileAssetPublishingRoleArn: 'arn:${AWS::Partition}:iam::${AWS::AccountId}:role/cdk-${Qualifier}-file-publishing-role-${AWS::AccountId}-${AWS::Region}',
      imageAssetPublishingRoleArn: 'arn:${AWS::Partition}:iam::${AWS::AccountId}:role/cdk-${Qualifier}-image-publishing-role-${AWS::AccountId}-${AWS::Region}',
      cloudFormationExecutionRole: 'arn:${AWS::Partition}:iam::${AWS::AccountId}:role/cdk-${Qualifier}-cfn-exec-role-${AWS::AccountId}-${AWS::Region}'
    };
  }

  return new DefaultStackSynthesizer({
    qualifier: cdkResources.qualifier,
    deployRoleArn: cdkResources.deployRoleArn,
    lookupRoleArn: cdkResources.lookupRoleArn,
    fileAssetPublishingRoleArn: cdkResources.fileAssetPublishingRoleArn,
    imageAssetPublishingRoleArn: cdkResources.imageAssetPublishingRoleArn,
    cloudFormationExecutionRole: cdkResources.cloudFormationExecutionRole
  });
}
