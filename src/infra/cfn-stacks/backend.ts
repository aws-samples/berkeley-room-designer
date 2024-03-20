// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for defining the backend AWS infra stack.
import * as cdk from 'aws-cdk-lib';
import * as Lambda from 'aws-cdk-lib/aws-lambda';
import * as Constructs from 'constructs';
import * as constants from '../constants';
import * as APIGateway from 'aws-cdk-lib/aws-apigateway';
import * as S3 from 'aws-cdk-lib/aws-s3';
import * as CloudFront from 'aws-cdk-lib/aws-cloudfront';
import BerkeleyRoomDesignerAPIAndWebsite from '../backend/api-and-website';

export class BerkeleyRoomDesignerBackendStack extends cdk.Stack {
  readonly exported?: CfnExports;

  constructor(scope: cdk.App, id: string, props: Props) {
    super(scope, id, props.stage.stackProps);

    const apiAndWebsite = new BerkeleyRoomDesignerAPIAndWebsite(this, 'api-and-website', props); 

    this.exported = {
      cloudFrontDistributionAccessLogsBucketName: new cdk.CfnOutput(this, props.stage.getResourceName(props.stage.getConfig().cloudFrontDistributionAccessLogsBucketNameCfnExportNameSuffix), {
        value: apiAndWebsite.cloudFrontDistributionAccessLogsBucket.bucket.bucketName,
        exportName: props.stage.getCfnExportResourceName(props.stage.getConfig().cloudFrontDistributionAccessLogsBucketNameCfnExportNameSuffix)
      }),
      websiteBucketName: new cdk.CfnOutput(this, props.stage.getResourceName(props.stage.getConfig().websiteBucketNameCfnExportNameSuffix), {
        value: apiAndWebsite.websiteBucket.bucket.bucketName,
        exportName: props.stage.getCfnExportResourceName(props.stage.getConfig().websiteBucketNameCfnExportNameSuffix)
      }),
      appURL: new cdk.CfnOutput(this, props.stage.getResourceName(props.stage.getConfig().appURLCfnExportNameSuffix), {
        value: apiAndWebsite.cloudFrontDistribution.distributionDomainName,
        exportName: props.stage.getCfnExportResourceName(props.stage.getConfig().appURLCfnExportNameSuffix)
      }),
      restApiId: new cdk.CfnOutput(this, props.stage.getResourceName(props.stage.getConfig().restApiIdCfnExportNameSuffix), {
        value: apiAndWebsite.restApi.restApiId,
        exportName: props.stage.getCfnExportResourceName(props.stage.getConfig().restApiIdCfnExportNameSuffix)
      }),
      backendFunctionARN: new cdk.CfnOutput(this, props.stage.getResourceName(props.stage.getConfig().backendFunctionARNCfnExportNameSuffix), {
        value: apiAndWebsite.backendFunction.function.functionArn,
        exportName: props.stage.getCfnExportResourceName(props.stage.getConfig().backendFunctionARNCfnExportNameSuffix)
      }),
      distributionId: new cdk.CfnOutput(this, props.stage.getResourceName(props.stage.getConfig().distributionIdCfnExportNameSuffix), {
        value: apiAndWebsite.cloudFrontDistribution.distributionId,
        exportName: props.stage.getCfnExportResourceName(props.stage.getConfig().distributionIdCfnExportNameSuffix)
      })
    };
  }
}

interface Props extends constants.CommonProps {
  backendDistDir: string;
}

interface CfnExports {
  readonly cloudFrontDistributionAccessLogsBucketName: cdk.CfnOutput; // Exported so we can cleanup.
  readonly websiteBucketName: cdk.CfnOutput; // Exported so we lookup to sync website files during deploy and cleanup.
  readonly appURL: cdk.CfnOutput; // Exported so we can use when running furniture placement algorithms via CLI (frontend can just lookup window.location.href).
  readonly restApiId: cdk.CfnOutput; // Exported so we can authorize identity pool to execute it.
  readonly backendFunctionARN: cdk.CfnOutput; // Exported so we can add to ops dashboard.
  readonly distributionId: cdk.CfnOutput; // Exported so we can invalidate CloudFront distribution on website deploy.
}

// Exported values imported in other cdk cfn constructs.
export class BerkeleyRoomDesignerBackendStackCfnExports extends Constructs.Construct {
  readonly websiteBucket: S3.IBucket; // Imported so we can grant access to CICD to sync files to it.
  readonly backendFunction: Lambda.IFunction;
  readonly restApi: APIGateway.IRestApi;
  readonly cloudfrontDistribution: CloudFront.IDistribution; // Imported so we can authorize CICD to invalidate it.

  constructor(scope: Constructs.Construct, id: string, props: constants.CommonProps) {
    super(scope, id);

    const websiteBucketName = cdk.Fn.importValue(props.stage.getCfnExportResourceName(props.stage.getConfig().websiteBucketNameCfnExportNameSuffix)).toString();
    this.websiteBucket = S3.Bucket.fromBucketAttributes(this, 'imported-website-bucket', {
      bucketName: websiteBucketName
    });

    const backendFunctionARN = cdk.Fn.importValue(props.stage.getCfnExportResourceName(props.stage.getConfig().backendFunctionARNCfnExportNameSuffix)).toString();
    this.backendFunction = Lambda.Function.fromFunctionArn(this, 'imported-backend-fn', backendFunctionARN);

    const restApiId = cdk.Fn.importValue(props.stage.getCfnExportResourceName(props.stage.getConfig().restApiIdCfnExportNameSuffix)).toString();
    this.restApi = APIGateway.RestApi.fromRestApiId(this, 'imported-api', restApiId);

    const appURL = cdk.Fn.importValue(props.stage.getCfnExportResourceName(props.stage.getConfig().appURLCfnExportNameSuffix)).toString();
    const distributionId = cdk.Fn.importValue(props.stage.getCfnExportResourceName(props.stage.getConfig().distributionIdCfnExportNameSuffix)).toString();
    this.cloudfrontDistribution = CloudFront.Distribution.fromDistributionAttributes(this, 'imported-distribution', { domainName: appURL, distributionId });
  }
}