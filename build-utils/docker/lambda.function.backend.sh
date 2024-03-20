#!/bin/sh
# This file is responsible for defining our backend Lambda function handler.
# References: 
# * https://docs.aws.amazon.com/lambda/latest/dg/runtimes-walkthrough.html
set -x

function handler () {
  EVENT_DATA="${1}"
  echo "Inside handler"
  echo "$EVENT_DATA"

  cd /function
  
  # This writes response to /tmp/response.
  NODE_ENV=production node --experimental-specifier-resolution=node --experimental-modules --no-warnings --loader ts-node/esm ./src/backend/infra_aws.ts "$EVENT_DATA"
}