// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for mapping config in the `../config/.env` file to our infra stage config.
// It allows us to heavily type all our config values for each infra stage.
// In our case we just deploy to main, which is syntactic sugar for creating cfn stacks (specific prefixes) that manage resources (with specific prefixes).
// This pattern + typing has allowed me to manage application stacks in multiple stages and accounts the easiest so far.
import * as cdk from 'aws-cdk-lib';
import * as Constructs from 'constructs';
import * as fs from 'fs';
import * as path from 'path';
import { getCustomCfnStackSynthesizer } from './custom-cfn-stack-synthesizer';

export default class AppStage extends Constructs.Construct {
  readonly name: string;
  readonly stackName?: string;
  readonly main: string = 'main';
  readonly deployId: string = '';
  readonly cdkAction: string;
  readonly stackProps: cdk.StackProps;

  constructor(scope: Constructs.Construct, id: string, props: Props) {
    super(scope, id);

    this.name = props.name.toLowerCase();
    this.deployId = props.deployId.toLowerCase();
    this.cdkAction = props.cdkAction;

    // If you don't specify 'env', this stack will be environment-agnostic.
    // Account/Region-dependent features and context lookups will not work,
    //  but a single synthesized template can be deployed anywhere.
    // To use the current AWS CDK CLI configuration:
    //  env: { account: process.env.cdk_DEFAULT_ACCOUNT, region: process.env.cdk_DEFAULT_REGION },
    // For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html
    console.debug('CDK_DEFAULT_ACCOUNT', process.env.CDK_DEFAULT_ACCOUNT);
    console.debug('CDK_DEFAULT_REGION', process.env.CDK_DEFAULT_REGION);
    console.debug('stage account', this.getConfig().accountID);
    console.debug('stage region', this.getConfig().region);
    console.debug('stack props region override (OPTIONAL)', props.region);
    console.debug('stage config', JSON.stringify(this.getConfig(), null, 2));

    let region = this.getConfig().region;
    if (props.region) { region = props.region; }

    // Rely on our own cdk resources so we don't create conflicts w/ other cdk-based application infra.
    const synthesizer = getCustomCfnStackSynthesizer('app', this.getConfig().cdkQualifier);
  
    if (props.stackName) {
      this.stackName = props.stackName;
      this.stackProps = {
        synthesizer,
        env: { account: this.getConfig().accountID, region }, 
        stackName: props.stackName
      };
    } else {
      this.stackProps = {
        synthesizer,
        env: { account: this.getConfig().accountID, region }
      };
    }

    console.debug('stackProps', JSON.stringify(this.stackProps, null, 2));
  }

  getConfig(): IAWSStage { return getAWSStageConfig(this.name); }

  getResourcePrefix(): string { return `${this.getConfig().cfnPrefix}-${this.name}`; }

  getResourceName(resourceName: string): string {
    return `${this.getResourcePrefix()}-${resourceName}-${this.deployId}`;
  }

  // CloudFormation will automatically remove dashes, but be somewhat explicit.
  getCfnExportResourceName(resourceName: string): string {
    return `${this.getResourceName(resourceName).replace(/-/g, '')}`;
  }
}

interface Props {
  readonly name: string;
  readonly deployId: string;
  readonly cdkAction: string;
  readonly stackName?: string; // Used to override stack name where each stack has a unique suffix.
  readonly region?: string; // Used to override our region config (say for us-east-1 certs).
}

export const getAWSStageConfig = (stageName?: any): IAWSStage => {
  const envFile = fs.readFileSync(path.resolve(process.cwd(), '../../config/.env')).toString();
  //console.debug('envFile', envFile);

  const env = envFileToJSON(envFile);
  //console.debug('env', env);

  const baseStage = {
    cfnPrefix: env.aws_cfn_prefix,

    stageName,

    baseCfnStackSuffix: env.aws_base_cfn_stack_suffix,
    cicdCfnStackSuffix: env.aws_cicd_cfn_stack_suffix,
    backendCfnStackSuffix: env.aws_backend_cfn_stack_suffix,
    frontendCfnStackSuffix: env.aws_frontend_cfn_stack_suffix,

    sourceCodeBucketNameCfnExportNameSuffix: env.aws_cicd_source_code_bucket_name_cfn_export_name_suffix,
    artifactsBucketNameCfnExportNameSuffix: env.aws_cicd_artifacts_bucket_name_cfn_export_name_suffix,
    
    cloudtrailArnCfnExportNameSuffix: env.aws_base_cloudtrail_arn_cfn_export_name_suffix,
    cloudtrailBucketNameCfnExportNameSuffix: env.aws_base_cloudtrail_bucket_name_cfn_export_name_suffix,
 
    cloudFrontDistributionAccessLogsBucketNameCfnExportNameSuffix: env.aws_backend_cloudfront_access_logs_bucket_name_cfn_export_name_suffix,
    websiteBucketNameCfnExportNameSuffix: env.aws_backend_website_bucket_name_cfn_export_name_suffix,
    appURLCfnExportNameSuffix: env.aws_backend_app_url_cfn_export_name_suffix,
    backendFunctionARNCfnExportNameSuffix: env.aws_backend_function_arn_cfn_export_name_suffix,
    restApiIdCfnExportNameSuffix: env.aws_backend_rest_api_id_cfn_export_name_suffix,
    distributionIdCfnExportNameSuffix: env.aws_backend_distribution_id_cfn_export_name_suffix,
  } as IAWSStage;

  if (stageName === 'main') { 
    return {
      ...baseStage, 

      cliProfile: env.aws_main_cli_profile,
      region: env.aws_main_region,
      accountID: env.aws_main_account_id,
      deployID: env.aws_main_deploy_id,
      cdkQualifier: env.aws_main_cdk_qualifier
    } as IAWSStage;
  }

  /*
  if (stageName === 'dev') { 
    return {
      ...baseStage, 

      cliProfile: env.aws_dev_cli_profile,
      region: env.aws_dev_region,
      accountID: env.aws_dev_account_id,
      deployID: env.aws_dev_deploy_id,
      cdkQualifier: env.aws_dev_cdk_qualifier
    } as IAWSStage;
  }
  */

  throw new Error('No valid stage config found!');
};

const envFileToJSON = (envFile: string): IDotEnv => {
  const keyValues: any = {};
  
  envFile.split(/\r?\n/).forEach(line => {
    if (line === '') { return; } // Ignore empty lines.
    if (line.startsWith('#')) { return; } // Ignore comments.
    const keyValue = line.split('=');

    keyValues[keyValue[0]] = keyValue[1];
  });

  return keyValues as IDotEnv;
}

export interface IAWSStage {
  readonly cfnPrefix: string;

  readonly stageName: string;

  readonly cliProfile: string;
  readonly region: string;
  readonly accountID: string;
  readonly deployID: string;
  readonly cdkQualifier: string;

  readonly baseCfnStackSuffix: string;
  readonly cicdCfnStackSuffix: string;
  readonly backendCfnStackSuffix: string;
  readonly frontendCfnStackSuffix: string;

  readonly sourceCodeBucketNameCfnExportNameSuffix: string;
  readonly artifactsBucketNameCfnExportNameSuffix: string;

  readonly cloudtrailArnCfnExportNameSuffix: string;
  readonly cloudtrailBucketNameCfnExportNameSuffix: string;

  readonly cloudFrontDistributionAccessLogsBucketNameCfnExportNameSuffix: string;
  readonly websiteBucketNameCfnExportNameSuffix: string;
  readonly appURLCfnExportNameSuffix: string;
  readonly backendFunctionARNCfnExportNameSuffix: string;
  readonly restApiIdCfnExportNameSuffix: string;
  readonly distributionIdCfnExportNameSuffix: string;
}

export interface IDotEnv {
  readonly 'aws_cfn_prefix': string;

  readonly 'aws_base_cfn_stack_suffix': string;
  readonly 'aws_cicd_cfn_stack_suffix': string;
  readonly 'aws_backend_cfn_stack_suffix': string;
  readonly 'aws_frontend_cfn_stack_suffix': string;

  readonly 'aws_main_cli_profile': string;
  readonly 'aws_main_account_id': string;
  readonly 'aws_main_region': string;
  readonly 'aws_main_deploy_id': string;
  readonly 'aws_main_cdk_qualifier': string;

  /*
  readonly 'aws_dev_cli_profile': string;
  readonly 'aws_dev_account_id': string;
  readonly 'aws_dev_region': string;
  readonly 'aws_dev_deploy_id': string;
  readonly 'aws_dev_cdk_qualifier': string;
  */

  readonly 'aws_cicd_source_code_bucket_name_cfn_export_name_suffix': string;
  readonly 'aws_cicd_artifacts_bucket_name_cfn_export_name_suffix': string;

  readonly 'aws_base_cloudtrail_arn_cfn_export_name_suffix': string;
  readonly 'aws_base_cloudtrail_bucket_name_cfn_export_name_suffix': string;
 
  readonly 'aws_backend_cloudfront_access_logs_bucket_name_cfn_export_name_suffix': string;
  readonly 'aws_backend_website_bucket_name_cfn_export_name_suffix': string;
  readonly 'aws_backend_app_url_cfn_export_name_suffix': string;
  readonly 'aws_backend_function_arn_cfn_export_name_suffix': string;
  readonly 'aws_backend_rest_api_id_cfn_export_name_suffix': string;
  readonly 'aws_backend_distribution_id_cfn_export_name_suffix': string;
}