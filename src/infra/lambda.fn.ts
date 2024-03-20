// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for defining our Lambda function abstraction.
import * as Constructs from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as Lambda from 'aws-cdk-lib/aws-lambda';
import * as EC2 from 'aws-cdk-lib/aws-ec2';
import * as constants from './constants';

export default class TSLambdaFunction extends Constructs.Construct {
  readonly function: Lambda.Function;

  constructor(scope: Constructs.Construct, id: string, props: Props) {
    super(scope, id);

    if (props.docker) {
      if (!props.dockerContextPath || !props.dockerfilePath) { throw Error('TSLambdaFunction missing props: dockerContextPath || dockerfilePath'); }

      console.debug('Beginning cdk docker lambda build...');
      console.debug('dockerContextPath', props.dockerContextPath);
      console.debug('dockerfilePath', props.dockerfilePath);

      this.function = new Lambda.DockerImageFunction(this, 'docker-fn', {
        functionName: `${props.functionName || id}-fn`,
        code: Lambda.DockerImageCode.fromImageAsset(props.dockerContextPath, { 
          file: props.dockerfilePath,
          // FIXME Couldn't get "DOCKER" to work because it recursively copies cdk-out dir (even though it's in the "dockerignore" file), 
          //  but the "GIT" approach seems to work with some tweaks to .gitignore during CICD (we need some files in .gitignore NOT ignored during Docker build).
          ignoreMode: cdk.IgnoreMode.GIT
        }),
        timeout: cdk.Duration.minutes(15), 
        memorySize: props.memorySize,
        ephemeralStorageSize: props.ephemeralStorageSize,
        environment: props.environment,
        vpc: props.vpc,
        layers: props.layers
      });
    } else {
      if (!props.cmd || !props.code) { throw Error('TSLambdaFunction missing props: cmd || code'); }

      this.function = new Lambda.Function(this, 'nodejs-fn', {
        functionName: `${props.functionName || id}-fn`,
        code: Lambda.Code.fromAsset(props.code),
        handler: props.cmd,
        runtime: Lambda.Runtime.NODEJS_18_X,
        timeout: cdk.Duration.minutes(15), 
        memorySize: props.memorySize,
        ephemeralStorageSize: props.ephemeralStorageSize,
        environment: props.environment,
        vpc: props.vpc,
        layers: props.layers
      });
    }

    this.function.addToRolePolicy(constants.allowPutMetrics);
    this.function.addToRolePolicy(constants.allowPutLogs);
  }
}

interface Props {
  readonly functionName?: string;
  readonly memorySize?: number;
  readonly ephemeralStorageSize?: cdk.Size;
  readonly environment?: { [key: string]: string; }
  readonly vpc?: EC2.IVpc;
  readonly layers?: Lambda.ILayerVersion[];

  readonly docker?: boolean;
  readonly dockerContextPath?: string;
  readonly dockerfilePath?: string;

  readonly code?: string;
  readonly cmd?: string;
}