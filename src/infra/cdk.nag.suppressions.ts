// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for defining nag suppressions. 
export const suppressCodeBuildProjectNotUsingKMS = {
  id: 'AwsSolutions-CB4',   
  reason: 'This is a non-production sample and adding KMS encryption for build artifacts costs ~$1 per month.'
}

export const suppressPrivilegedMode = {
  id: 'AwsSolutions-CB3',   
  reason: 'The CDK needs to build Docker images.'
}

export const suppressECRAuth = {
  id: 'F4',   
  reason: 'There is no resource associated with ecr:GetAuthorizationToken.'
}

export const suppressIAM = {
  id: ' AwsSolutions-IAM5',   
  reason: 'The wildcard permissions required for CICD are generally scoped to resources (unless defined by CDK by default) - and in some cases - short-hand for S3 "read" operations.',
  appliesTo: [
    'Action::s3:GetObject*',
    'Action::s3:GetBucket*',
    'Action::s3:List*',
    'Action::s3:Abort*',
    'Resource::<cicdpipelineartifactbuckets3bucket*.Arn>/*',
    'Resource::arn:aws:iam::*:role/cdk-*-deploy-role-*',
    'Resource::arn:aws:iam::*:role/cdk-*-file-publishing-*',
    'Resource::arn:aws:iam::*:role/cdk-*-image-publishing-*',
    'Resource::arn:aws:iam::*:role/cdk-*-lookup-*',
    'Resource::*', // Default CodePipeline policy created by CDK.
    'Resource::<cicdpipelinesourcecodebuckets3bucket*.Arn>/*',
    'Action::s3:DeleteObject*',
    'Resource::arn:<AWS::Partition>:logs:*:*:log-group:/aws/codebuild/*:*',
    'Resource::arn:<AWS::Partition>:codebuild:*:*:report-group/*-*',
 ],
}