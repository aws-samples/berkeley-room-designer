// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for defining CICD envs (Docker images + config) used in pipeline steps.
import * as CodePipeline from 'aws-cdk-lib/aws-codepipeline';
import * as Constructs from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as CodeBuild from 'aws-cdk-lib/aws-codebuild';
import CICDBuildStep from './build-step';
import { BuildCommand } from './pipeline-step-builder';
import * as constants from '../constants';

export default class CICDEnvs extends Constructs.Construct {
  private readonly props: Props;

  constructor(scope: Constructs.Construct, id: string, props: Props) {
    super(scope, id);

    this.props = props;
  }

  getEnv(env: Env, buildCommand: BuildCommand): CICDBuildStep {
    if (env === 'deploy') { return this.standardEnv(buildCommand); }

    return this.standardEnv(buildCommand);
  }

  private standardEnv(buildCommand: BuildCommand): CICDBuildStep {
    return new CICDBuildStep(this, buildCommand.actionName, {
      stage: this.props.stage,
      actionName: buildCommand.actionName,
      input: this.props.sourceCode,
      osType: 'linux',
      buildImage: CodeBuild.LinuxBuildImage.STANDARD_7_0, // STANDARD_6)0
      installCommands: [
        'n 20', // See: https://github.com/aws/aws-codebuild-docker-images/issues/580
        
        // See: https://docs.aws.amazon.com/codebuild/latest/userguide/sample-docker-custom-image.html#sample-docker-custom-image-files
        'nohup dockerd --host=unix:///var/run/docker.sock --host=tcp://127.0.0.1:2375 &',
        'timeout 15 sh -c "until docker info; do echo .; sleep 1; done"'
      ],
      timeout: cdk.Duration.minutes(20 + 15), // 20 minutes to pull image (woof!), 15 minutes to build 
      buildCommands: [buildCommand.exec],
      //environmentVariables: {},
      outputs: buildCommand.outputs,
      //artifacts: {},
      policyStatements: buildCommand.policyStatements // Step inherits the pipeline permissions.
    });
  }
}

interface Props extends constants.CommonProps {
  readonly sourceCode: CodePipeline.Artifact;
}

export type Env = 'deploy';