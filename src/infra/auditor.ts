// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for managing cloud auditing and compliance.
import * as Constructs from 'constructs';
import * as CloudTrail from 'aws-cdk-lib/aws-cloudtrail';
import Bucket from './s3.bucket';
import { getRemovalPolicy } from './resource';
import * as constants from './constants';

export default class VDAMAuditor extends Constructs.Construct {
  cloudtrail: CloudTrail.Trail;
  cloudtrailBucket: Bucket;

  constructor(scope: Constructs.Construct, id: string, props: Props) {
    super(scope, id);
    
    // Monitoring is the first part of auditing strategy.
    // Need to specify a bucket otherwise it won't get deleted when you delete the CloudFormation stack.
    this.cloudtrailBucket = new Bucket(this, 'cloudtrail-bucket', {
      removalPolicy: getRemovalPolicy(props.stage)
    });

    this.cloudtrail = new CloudTrail.Trail(this, 'cloudtrail-trail', { sendToCloudWatchLogs: false, bucket: this.cloudtrailBucket.bucket });
  }
}

interface Props extends constants.CommonProps {}