// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for defining the CICD AWS infra stack.
import * as cdk from 'aws-cdk-lib';
import AppStage from '../stage';
import CICDPipeline from '../cicd/pipeline';
import { NagSuppressions } from 'cdk-nag';
import * as cdkNagSuppressions from '../cdk.nag.suppressions';

export class BerkeleyRoomDesignerCICDStack extends cdk.Stack {
  readonly exported?: CfnExports;
  
  constructor(scope: cdk.App, id: string, stage: AppStage, selfMutatePipeline: boolean) {
    super(scope, id, stage.stackProps);

    const pipeline = new CICDPipeline(this, 'cicd-pipeline', { stage, selfMutatePipeline });

    // FIXME Not getting picked up, and this guidance seems to be out of date: https://github.com/cdklabs/cdk-nag/blob/main/README.md#suppressing-aws-cdk-libpipelines-violations
    NagSuppressions.addResourceSuppressionsByPath(
      this, 
      `/${stage.getConfig().cfnPrefix}-${stage.name}-cicd-${stage.deployId}/cicd-pipeline/codepipeline/Role/DefaultPolicy/Resource`, 
      [cdkNagSuppressions.suppressIAM]
    );
    NagSuppressions.addResourceSuppressionsByPath(
      this, 
      `/${stage.getConfig().cfnPrefix}-${stage.name}-cicd-${stage.deployId}/cicd-pipeline/codepipeline/Get-Source/From-S3/CodePipelineActionRole/DefaultPolicy/Resource`, 
      [cdkNagSuppressions.suppressIAM]
    );
    NagSuppressions.addResourceSuppressionsByPath(
      this, 
      `/${stage.getConfig().cfnPrefix}-${stage.name}-cicd-${stage.deployId}/cicd-pipeline/envs/CICDBuildStepDeploy/Deploy/Role/DefaultPolicy/Resource`, 
      [cdkNagSuppressions.suppressIAM]
    );

    this.exported = {
      sourceCodeBucketName: new cdk.CfnOutput(this, stage.getResourceName(stage.getConfig().sourceCodeBucketNameCfnExportNameSuffix), {
        value: pipeline.sourceCodeBucket.bucket.bucketName,
        exportName: stage.getCfnExportResourceName(stage.getConfig().sourceCodeBucketNameCfnExportNameSuffix)
      }),
      artifactsBucketName: new cdk.CfnOutput(this, stage.getResourceName(stage.getConfig().artifactsBucketNameCfnExportNameSuffix), {
        value: pipeline.artifactsBucket.bucket.bucketName,
        exportName: stage.getCfnExportResourceName(stage.getConfig().artifactsBucketNameCfnExportNameSuffix)
      })
    };
  }
}

interface CfnExports {
  readonly sourceCodeBucketName: cdk.CfnOutput; // Exported so we can lookup and use to start CICD by uploading source code, and also so we can empty before destroy.
  readonly artifactsBucketName: cdk.CfnOutput; // Exported so we can empty before destroy.
}