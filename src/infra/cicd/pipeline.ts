// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for defining our CICD pipeline, from source code pull to publish.
// Try to keep defining commands out of this file and instead use the makefile - it's all easier to grok in one place.
import * as CodePipeline from 'aws-cdk-lib/aws-codepipeline';
import * as CodePipelineActions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as Constructs from 'constructs';
import { CICDPipelineStepBuilder, BuildCommand } from './pipeline-step-builder';
import CICDPipelineIAMPolicies from './policies';
import * as constants from '../constants';
import CICDEnvs from './envs';
import Bucket from '../s3.bucket';
import { getRemovalPolicy } from '../resource';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { BerkeleyRoomDesignerBackendStackCfnExports } from '../cfn-stacks/backend';

export default class CICDPipeline extends Constructs.Construct {
  sourceCodeBucket: Bucket;
  artifactsBucket: Bucket;

  private readonly props: constants.CommonProps;
  private readonly pipeline: CodePipeline.Pipeline;
  private readonly pipelineSteps: CodePipeline.StageProps[] = [] as CodePipeline.StageProps[];
  private readonly sourceCode: CodePipeline.Artifact;
  private readonly pipelineIAMPolicies: CICDPipelineIAMPolicies;
  private readonly envs: CICDEnvs;

  constructor(scope: Constructs.Construct, id: string, props: Props) {
    super(scope, id);

    this.props = props;

    this.sourceCodeBucket = new Bucket(this, 'source-code-bucket', {
      removalPolicy: getRemovalPolicy(props.stage)
    });

    this.artifactsBucket = new Bucket(this, 'artifacts-bucket', {
      removalPolicy: getRemovalPolicy(props.stage)
    });

    this.pipeline = new CodePipeline.Pipeline(this, 'codepipeline', {
      pipelineName: props.stage.getResourceName('pipeline'),
      restartExecutionOnUpdate: true,
      artifactBucket: this.artifactsBucket.bucket,
      enableKeyRotation: true
    });

    let backendStackCfnExports: BerkeleyRoomDesignerBackendStackCfnExports | undefined;

    if (props.selfMutatePipeline) {
      backendStackCfnExports = new BerkeleyRoomDesignerBackendStackCfnExports(this, 'base-cfn-exports', props);
    }

    this.pipelineIAMPolicies = new CICDPipelineIAMPolicies(this, 'iam-policies', { 
      stage: props.stage, 
      cicdSourceBucket: this.sourceCodeBucket.bucket,
      websiteBucket: backendStackCfnExports?.websiteBucket, // Only exists after CICD deploys this.
      cloudfrontDistribution: backendStackCfnExports?.cloudfrontDistribution // Only exists after CICD deploys this.
    });

    this.sourceCode = new CodePipeline.Artifact('source-code');

    // A pipeline and its steps might have different access restrictions.
    // For the purposes of this sample, we configure the pipeline and each step to have the _same_ access.
    this.pipelineIAMPolicies.getAllAllowed().forEach(policy => this.pipeline.addToRolePolicy(policy));

    this.envs = new CICDEnvs(this, 'envs', { stage: props.stage, sourceCode: this.sourceCode });

    const pipelineStepBuilder = new CICDPipelineStepBuilder(this, 'pipeline-step', { 
      stage: props.stage, 
      sourceCode: this.sourceCode, 
      pipelineIAMPolicies: this.pipelineIAMPolicies,
      envs: this.envs
    });

    this.pipelineSteps.push(this.getSourceCodeStep(this.sourceCodeBucket.bucket));
    this.pipelineSteps.push(pipelineStepBuilder.createStepFromCommands('Deploy', this.deployCommands));

    this.pipelineSteps.forEach(step => this.pipeline.addStage(step));
  }

  private getSourceCodeStep(bucket: IBucket): CodePipeline.StageProps {
    return { stageName: 'Get-Source', actions: [
      new CodePipelineActions.S3SourceAction({
        actionName: 'From-S3',
        bucket,
        bucketKey: 'source-code.zip', // The name of this zip file is set in the makefile.aws file.
        output: this.sourceCode
      })
    ]};
  }

  private get deployCommands(): BuildCommand[] {
    return [
      { actionName: 'Deploy', exec: `make -f makefile.aws stage=${this.props.stage.name} deploy/from-cicd`, env: 'deploy', runOrder: 1 }
    ];
  }
}

interface Props extends constants.CommonProps {
  readonly selfMutatePipeline: boolean;
}