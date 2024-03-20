// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for defining our S3 bucket abstraction.
// It defines common configuration for S3 buckets.
import * as Constructs from 'constructs';
import * as S3 from 'aws-cdk-lib/aws-s3';
import * as cdk from 'aws-cdk-lib';

export default class Bucket extends Constructs.Construct {
  readonly bucket: S3.IBucket;

  constructor(scope: Constructs.Construct, id: string, props: Props) {
    super(scope, id);

    this.bucket = new S3.Bucket(this, 's3-bucket', {
      bucketName: props.bucketName,
      removalPolicy: props.removalPolicy,
      autoDeleteObjects: true,
      enforceSSL: true,
      versioned: true,
      accessControl: S3.BucketAccessControl.LOG_DELIVERY_WRITE,
      serverAccessLogsPrefix: 'access-logs/',
      objectOwnership: S3.ObjectOwnership.OBJECT_WRITER, // See: https://stackoverflow.com/questions/76097031/aws-s3-bucket-cannot-have-acls-set-with-objectownerships-bucketownerenforced-s
      blockPublicAccess: S3.BlockPublicAccess.BLOCK_ALL,
      encryption: S3.BucketEncryption.S3_MANAGED,
      cors: props.cors,
      serverAccessLogsBucket: props.serverAccessLogsBucket?.bucket,

      websiteIndexDocument: props.websiteIndexDocument,
      websiteErrorDocument: props.websiteErrorDocument
    });
  }
}

interface Props {
  readonly bucketName?: string;
  readonly removalPolicy?: cdk.RemovalPolicy;
  readonly websiteIndexDocument?: string;
  readonly websiteErrorDocument?: string;
  readonly cors?: S3.CorsRule[];
  readonly serverAccessLogsBucket?: Bucket;
}
