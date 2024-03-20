// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for defining the backend infra for our API and website.
// References:
// * https://github.com/aws-samples/cloudfront-spa-with-samedomain-multiorigin/blob/main/lib/cloudfront-api-revproxy-spa-stack.ts
import * as Constructs from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as constants from '../constants';
import * as path from 'path';
import * as CloudFront from 'aws-cdk-lib/aws-cloudfront';
import * as CloudFrontOrigins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as APIGateway from 'aws-cdk-lib/aws-apigateway';
import * as Logs from 'aws-cdk-lib/aws-logs';
import * as IAM from 'aws-cdk-lib/aws-iam';
import { getRemovalPolicy } from '../resource';
import TSLambdaFunction from '../lambda.fn';
import Bucket from '../s3.bucket';

export default class BerkeleyRoomDesignerAPIAndWebsite extends Constructs.Construct {
  cloudFrontDistributionAccessLogsBucket: Bucket;
  websiteBucket: Bucket;
  backendFunction: TSLambdaFunction;
  restApi: APIGateway.LambdaRestApi;
  cloudFrontDistribution: CloudFront.Distribution;

  constructor(scope: Constructs.Construct, id: string, props: Props) {
    super(scope, id);

    this.cloudFrontDistributionAccessLogsBucket = new Bucket(this, 'access-logs', {
      removalPolicy: getRemovalPolicy(props.stage)
    });

    this.websiteBucket = new Bucket(this, 'website', {
      removalPolicy: getRemovalPolicy(props.stage),
      serverAccessLogsBucket: this.cloudFrontDistributionAccessLogsBucket
    });

    /* 
    One of the backend dependencies isn't easily bundle-able right now so far as I'm aware because of a dependency on @mapbox/node-pre-gyp. 
    I've commented out the bundled approach below so that when the issue is resolved you should be able to drop the Docker approach.
    See `build/backend` in the makefile for more details.
    
    this.backendFunction = new TSLambdaFunction(this, 'function', {
      functionName: props.stage.getResourceName('backend'),
      code: path.resolve(process.cwd(), `../../${props.backendDistDir}`),
      cmd: `infra_aws_bundle.default`
    });
    */

    this.backendFunction = new TSLambdaFunction(this, 'api-fn', {
      functionName: props.stage.getResourceName('api'),
      docker: true,
      dockerContextPath: path.resolve(process.cwd(), `../../`),
      dockerfilePath: 'build-utils/docker/dockerfile.backend',
      memorySize: 1024
    });

    const allowLLMUse = new IAM.PolicyStatement({
      effect: IAM.Effect.ALLOW,
      resources: ['arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-v2'],
      actions: ['bedrock:InvokeModel']
    });
    this.backendFunction.function.addToRolePolicy(allowLLMUse);
    
    const apiLogGroup = new Logs.LogGroup(this, 'log-group');
    getRemovalPolicy(props.stage) ? apiLogGroup.applyRemovalPolicy(getRemovalPolicy(props.stage)!) : undefined;

    this.restApi = new APIGateway.LambdaRestApi(this, 'api', {
      handler: this.backendFunction.function,
      cloudWatchRole: true,
      deployOptions: {
        accessLogDestination: new APIGateway.LogGroupLogDestination(apiLogGroup),
        accessLogFormat: APIGateway.AccessLogFormat.jsonWithStandardFields(),
        loggingLevel: APIGateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true
      }
    });

    // Our application has no "users" - it's a public tool and a public API -> throttle by default.
    this.restApi.addUsagePlan('usage-plan', { 
      name: 'Default', 
      throttle: { rateLimit: 2, burstLimit: 2 } 
    });

    const websiteS3Origin = new CloudFrontOrigins.S3Origin(this.websiteBucket.bucket);
    const restAPICloudFrontOrigin = new CloudFrontOrigins.RestApiOrigin(this.restApi);
    const datasetOrigin = new CloudFrontOrigins.HttpOrigin('amazon-berkeley-objects.s3-website-us-east-1.amazonaws.com', { 
      protocolPolicy: CloudFront.OriginProtocolPolicy.HTTP_ONLY // Public dataset is HTTP-only.
    });

    //const responseHeadersPolicy = CloudFront.ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS;
    const contentSecurityPolicy = [
      "base-uri 'self'",
      "default-src 'none'",

      // WebAssembly.* APIs prevented from being used if unsafe-eval is disallowed via CSP. 
      // It is easily misused and can lead to various XSS vulnerabilities.
      // sqlite-was-http (and its deps) didn't work w/o unsafe-inline either. 
      // See: https://github.com/WebAssembly/design/issues/1092
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https:",
      
      "require-trusted-types-for 'script'",
      "style-src 'self' https:",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' :blob",
      "worker-src 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "frame-src https:",
      "media-src https:",
      "upgrade-insecure-requests",
      "block-all-mixed-content",
      "manifest-src 'self'"
    ].join('; ');

    const responseHeadersPolicy = new CloudFront.ResponseHeadersPolicy(this, 'response-headers-policy', {
      corsBehavior: {
        accessControlAllowCredentials: false,
        accessControlAllowHeaders: ['*'],
        accessControlAllowMethods: ['GET', 'HEAD', 'PUT', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
        accessControlAllowOrigins: ['*'],
        accessControlExposeHeaders: ['*'],
        accessControlMaxAge: cdk.Duration.minutes(10),
        originOverride: true,
      },
      customHeadersBehavior: {
        customHeaders: [
          { header: 'Permissions-Policy', value: 'fullscreen=(self)', override: true },
          { header: 'Cross-Origin-Opener-Policy', value: 'same-origin', override: true },
          { header: 'Cross-Origin-Embedder-Policy', value: 'require-corp', override: true },
        ],
      },
      securityHeadersBehavior: {
        contentSecurityPolicy: { contentSecurityPolicy, override: true },
        //contentTypeOptions: { override: true }, FIXME This breaks loading 459c285c9d90a7912bcd.wasm but search is working w/o it?
        frameOptions: { frameOption: CloudFront.HeadersFrameOption.DENY, override: true },
        referrerPolicy: { referrerPolicy: CloudFront.HeadersReferrerPolicy.NO_REFERRER, override: true },
        strictTransportSecurity: { accessControlMaxAge: cdk.Duration.minutes(10), includeSubdomains: true, override: true },
        xssProtection: { protection: true, modeBlock: true, override: true }
      }
    });

    this.cloudFrontDistribution = new CloudFront.Distribution(this, 'cloudfront-distribution', {
      defaultBehavior: { 
        origin: websiteS3Origin,
        viewerProtocolPolicy: CloudFront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: CloudFront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        responseHeadersPolicy
      },
      additionalBehaviors: {
        '/berkeley.db': {
          origin: websiteS3Origin,
          viewerProtocolPolicy: CloudFront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: CloudFront.AllowedMethods.ALLOW_ALL,
          cachePolicy: CloudFront.CachePolicy.CACHING_OPTIMIZED,
          originRequestPolicy: CloudFront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        },
        '/api/*': {
          origin: restAPICloudFrontOrigin,
          viewerProtocolPolicy: CloudFront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: CloudFront.AllowedMethods.ALLOW_ALL,
          cachePolicy: CloudFront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: CloudFront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        },
        '/images/*': {
          origin: datasetOrigin,
          viewerProtocolPolicy: CloudFront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: CloudFront.CachePolicy.CACHING_OPTIMIZED,
          originRequestPolicy: CloudFront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER
        },
        '/models/*': {
          origin: datasetOrigin,
          viewerProtocolPolicy: CloudFront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: CloudFront.CachePolicy.CACHING_OPTIMIZED,
          originRequestPolicy: CloudFront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER
        },
        '/3dmodels/*': {
          origin: datasetOrigin,
          viewerProtocolPolicy: CloudFront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: CloudFront.CachePolicy.CACHING_OPTIMIZED,
          originRequestPolicy: CloudFront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER
        },
        '/spins/*': {
          origin: datasetOrigin,
          viewerProtocolPolicy: CloudFront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: CloudFront.CachePolicy.CACHING_OPTIMIZED,
          originRequestPolicy: CloudFront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER
        }
      },
      defaultRootObject: 'index.html',
      // For HTML5 history configuration, see: https://advancedweb.hu/how-to-configure-cloudfront-for-the-html5-history-api/ 
      errorResponses: [{
        httpStatus: 403,
        responseHttpStatus: 200,
        responsePagePath: '/index.html'
      },{
        httpStatus: 404,
        responseHttpStatus: 200,
        responsePagePath: '/index.html'
      }],
      enableLogging: true,
      logBucket: this.cloudFrontDistributionAccessLogsBucket.bucket,
      logFilePrefix: 'distribution-access-logs/',
      logIncludesCookies: true
    });
  }
}

interface Props extends constants.CommonProps {
  backendDistDir: string;
}
