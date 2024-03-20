// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for defining the base AWS infra stack.
import * as cdk from 'aws-cdk-lib';
import * as constants from '../constants';
import Auditor from '../auditor';

export class BerkeleyRoomDesignerBaseStack extends cdk.Stack {
  readonly exported?: CfnExports;

  constructor(scope: cdk.App, id: string, props: Props) {
    super(scope, id, props.stage.stackProps);

    const auditor = new Auditor(this, 'auditor', { stage: props.stage }); // Backend also serves as a "base" for resources needed by both.

    this.exported = {
      cloudtrailArn: new cdk.CfnOutput(this, props.stage.getResourceName(props.stage.getConfig().cloudtrailArnCfnExportNameSuffix), {
        value: auditor.cloudtrail.trailArn,
        exportName: props.stage.getCfnExportResourceName(props.stage.getConfig().cloudtrailArnCfnExportNameSuffix)
      }),
      cloudtrailBucketName: new cdk.CfnOutput(this, props.stage.getResourceName(props.stage.getConfig().cloudtrailBucketNameCfnExportNameSuffix), {
        value: auditor.cloudtrailBucket.bucket.bucketName,
        exportName: props.stage.getCfnExportResourceName(props.stage.getConfig().cloudtrailBucketNameCfnExportNameSuffix)
      })
    };
  }
}

interface Props extends constants.CommonProps {}

interface CfnExports {
  readonly cloudtrailArn: cdk.CfnOutput; // Exported so we can stop logging before destroying resources (it impedes destroy).
  readonly cloudtrailBucketName: cdk.CfnOutput; // Exported so we can try and empty before destroying resources.
}