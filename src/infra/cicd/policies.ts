// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for defining all IAM policies used in the pipeline and its steps.
import * as IAM from 'aws-cdk-lib/aws-iam';
import * as Constructs from 'constructs';
import * as constants from '../constants';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import * as S3 from 'aws-cdk-lib/aws-s3';
import * as CloudFront from 'aws-cdk-lib/aws-cloudfront';

export default class CICDPipelineIAMPolicies extends Constructs.Construct {
  readonly props: Props;

  readonly allowCDK: IAM.PolicyStatement;
  readonly allowGetInfoFor: IAM.PolicyStatement;
  readonly allowSourceCodeBucketAccess: IAM.PolicyStatement;
  readonly allowWebsiteBucketAccess?: IAM.PolicyStatement;
  readonly allowCloudFrontInvalidationAccess?: IAM.PolicyStatement;

  constructor(scope: Constructs.Construct, id: string, props: Props) {
    super(scope, id);

    this.props = props;

    // Needed to use the CDK in CodeBuild. 
    // We don't like using saved CDK context.json, but alternately you can. See: 
    // * https://stackoverflow.com/questions/71836645/cannot-assume-lookup-role
    // * https://stackoverflow.com/questions/68275460/default-credentials-can-not-be-used-to-assume-new-style-deployment-roles
    this.allowCDK = new IAM.PolicyStatement({
      actions: [
        'sts:AssumeRole', 
        'iam:PassRole'
      ],
      resources: [
        `arn:aws:iam::*:role/cdk-${props.stage.getConfig().cdkQualifier}-deploy-role-*`,
        `arn:aws:iam::*:role/cdk-${props.stage.getConfig().cdkQualifier}-file-publishing-*`,
        `arn:aws:iam::*:role/cdk-${props.stage.getConfig().cdkQualifier}-image-publishing-*`,
        `arn:aws:iam::*:role/cdk-${props.stage.getConfig().cdkQualifier}-lookup-*`
      ]
    });

    this.allowGetInfoFor = new IAM.PolicyStatement({
      actions: [
        'cloudformation:DescribeStacks',
        'ssm:GetParameter'
      ],
      resources: ['*']
    });

    this.allowSourceCodeBucketAccess = new IAM.PolicyStatement({
      actions: ['s3:Get*', 's3:List*'],
      resources: [
        this.props.cicdSourceBucket.bucketArn,
        `${this.props.cicdSourceBucket.bucketArn}/*`
      ]
    });

    // Website S3 bucket gets created after initial CICD deploy, 
    //  so pipeline needs to update its permissions after it's created.
    if (props.websiteBucket) {
      this.allowWebsiteBucketAccess = new IAM.PolicyStatement({
        actions: [
          's3:Get*', 
          's3:List*', 
          's3:PutObject',
          //'s3:PutObjectAcl',
          's3:DeleteObject'
        ],
        resources: [
          this.props.websiteBucket?.bucketArn!,
          `${this.props.websiteBucket?.bucketArn!}/*`
        ]
      });
    }

    // CloudFront distribution gets created after initial CICD deploy, 
    //  so pipeline needs to update its permissions after it's created.
    if (props.cloudfrontDistribution) {
      this.allowCloudFrontInvalidationAccess = new IAM.PolicyStatement({
        actions: [
          'cloudfront:UpdateDistribution',
          'cloudfront:DeleteDistribution',
          'cloudfront:CreateInvalidation'
        ],
        resources: [`arn:aws:cloudfront::${props.stage.getConfig().accountID}:distribution/${this.props.cloudfrontDistribution?.distributionId}`]
      });
    }
  }

  getAllAllowed(): IAM.PolicyStatement[] {
    const allowedPolicies = [
      this.allowCDK,
      this.allowGetInfoFor,
      this.allowSourceCodeBucketAccess
    ];

    if (this.allowWebsiteBucketAccess) {
      allowedPolicies.push(this.allowWebsiteBucketAccess);
    }

    if (this.allowCloudFrontInvalidationAccess) {
      allowedPolicies.push(this.allowCloudFrontInvalidationAccess);
    }

    return allowedPolicies;
  }
}

interface Props extends constants.CommonProps {
  readonly cicdSourceBucket: IBucket;
  readonly websiteBucket?: S3.IBucket;
  readonly cloudfrontDistribution?: CloudFront.IDistribution;
}