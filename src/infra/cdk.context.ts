// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for providing CDK context utils.
import * as cdk from 'aws-cdk-lib';

const getValidContext = (app: cdk.App, contextKey: string, shouldExit?: boolean): string | undefined => {
  const context = app.node.tryGetContext(contextKey);

  if (!context && shouldExit !== undefined && shouldExit === true) {
    console.error(`No ${contextKey} provided in context runtime.`);
    process.exit(1);
  }

  // Sanitize user input.
  if (context) { return (context as string).trim(); }

  return context;
}

export { getValidContext }