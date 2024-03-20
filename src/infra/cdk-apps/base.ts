#! node
// This file is responsible for defining our CDK app entrypoint for base resources.
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import AppStage from '../stage';
import { BerkeleyRoomDesignerBaseStack } from '../cfn-stacks/base';
import { AwsSolutionsChecks } from 'cdk-nag';
import * as cdkContext from '../cdk.context'; 

const app = new cdk.App();

// Provided at runtime.
const cdkAction = cdkContext.getValidContext(app, 'cdk-action')!;
const cdkNag = (cdkContext.getValidContext(app, 'cdk-nag') === 'true');
const stageName = cdkContext.getValidContext(app, 'stage')!;
const deployId = cdkContext.getValidContext(app, 'deploy-id')!;

const stage = new AppStage(app, 'stage', { name: stageName, deployId, cdkAction });

new BerkeleyRoomDesignerBaseStack(app, stage.getResourceName(stage.getConfig().baseCfnStackSuffix), { stage });

// Add tags to all created resources.
cdk.Tags.of(app).add('cdk-group', stage.getResourcePrefix());
cdk.Tags.of(app).add('cdk-app', stage.getResourceName(stage.getConfig().baseCfnStackSuffix));

if (cdkNag) { cdk.Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true })); }

app.synth();