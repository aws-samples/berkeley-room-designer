// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for creating an abstraction around CodeBuild projects by
//  supplying a builder that allows you to pass (more-or-less) a command and a container image to run it in.
// Typically commands are grouped with the container image to form a CodeBuild project,
//  but we found it really helpful to be able to see all the commands in code next to one another,
//  regardless of what container image they run in.
// The abstraction isn't pretty (yet) or finished - and I'm sure there is a better way - but what it provides is:
// const buildCommands = [ // runOrder of 1 means they both run at same time
//   { actionName: 'InOneContainer', exec: `make this-command`, env: 'codebuild-project-with-container1', outputs: [this.buildArtifacts.oneArtifact], runOrder: 1] },
//   { actionName: 'InOtherContainer', exec: `make other-command`, env: 'other-codebuild-project-with-container-2', outputs: [this.buildArtifacts.otherArtifact], runOrder: 1] }
// ];
// Normally that ^ would be in 2 separate build project specs but we found this easier to understand at-a-glance and debug.
import * as CodePipeline from 'aws-cdk-lib/aws-codepipeline';
import * as IAM from 'aws-cdk-lib/aws-iam';
import * as cdk from 'aws-cdk-lib';
import * as constants from '../constants';
import * as Constructs from 'constructs';
import CICDPipelineIAMPolicies from './policies';
import CICDBuildStep from './build-step';
import CICDEnvs, { Env } from './envs';

export class CICDPipelineStepBuilder extends Constructs.Construct {
  props: Props;

  constructor(scope: Constructs.Construct, id: string, props: Props) {
    super(scope, `CICDPipelineStepBuilder${id}`);

    this.props = props;
  }

  createStepFromCommands(stepName: string, buildCommands: BuildCommand[]): CodePipeline.StageProps {
    const buildSteps = new Map<string, CICDBuildStep>();

    buildCommands.forEach(buildCommand => {
      if (!buildSteps.has(buildCommand.actionName)) {
        console.debug('Creating build action', buildCommand.actionName, 'for build stage', stepName, 'runOrder', buildCommand.runOrder);

        if (!buildCommand.policyStatements) { buildCommand.policyStatements = []; }

        // The pipeline and its steps might have different access restrictions.
        // For the purposes of this sample, we configure the pipeline and each step to have the _same_ access.
        this.props.pipelineIAMPolicies.getAllAllowed().forEach(policy => buildCommand.policyStatements?.push(policy));

        const buildStep = new CICDBuildStep(this, buildCommand.actionName, {
          stage: this.props.stage,
          actionName: buildCommand.actionName,
          runOrder: buildCommand.runOrder,
          timeout: cdk.Duration.minutes(45),
          input: this.props.sourceCode,
          outputs: buildCommand.outputs,
          installCommands: [],
          buildCommands: [],
          policyStatements: buildCommand.policyStatements
        });

        buildSteps.set(buildCommand.actionName, buildStep);
      }

      if (buildCommand.env) { // If an env was specified...
        if (buildCommand.dontExecIf === undefined || buildCommand.dontExecIf.length === 0) { // Add the build command, no logic to evaluate.
          console.debug('(new env) Adding command to action', buildCommand.actionName, 'for build stage', stepName, 'exec', buildCommand.exec);
        
          const buildEnv = this.props.envs.getEnv(buildCommand.env, buildCommand);
          buildSteps.set(buildCommand.actionName, buildEnv);
        } else {
          const shouldNotExec = buildCommand.dontExecIf?.some(condition => condition === true);

          // Conditional build command, e.g. if a secret is not found, then we don't add the build command.
          if (!shouldNotExec) {
            console.debug('(conditional new env) Adding command to action', buildCommand.actionName, 'for build stage', stepName, 'exec', buildCommand.exec);

            const buildEnv = this.props.envs.getEnv(buildCommand.env, buildCommand);
            buildSteps.set(buildCommand.actionName, buildEnv);
          }
        }
      } else { // ...use previously specified env
        console.debug('(previous env) Adding command to action', buildCommand.actionName, 'for build stage', stepName, 'exec', buildCommand.exec);

        const buildStep = buildSteps.get(buildCommand.actionName);
        buildStep?.props.buildCommands.push(buildCommand.exec);
      }
    });

    const actions = [];
    for (const cicdBuildStep of buildSteps.values()) {
      actions.push(cicdBuildStep.getAction());
    }

    // CodeBuild "stage names" are different than stages here, so refer to them as "step names".
    return { stageName: stepName, actions };
  }
}

interface Props extends constants.CommonProps {
  readonly sourceCode: CodePipeline.Artifact;
  readonly pipelineIAMPolicies: CICDPipelineIAMPolicies;
  readonly envs: CICDEnvs;
}

export interface BuildCommand {
  readonly actionName: string;
  readonly runOrder?: number; // Only set in initial command def.
  readonly exec: string;
  policyStatements?: IAM.PolicyStatement[];
  readonly dontExecIf?: boolean[]; // Only set in initial command def.
  readonly env?: Env; // Only set in initial command def.
  readonly outputs?: CodePipeline.Artifact[]; // Only set in initial command def.
}