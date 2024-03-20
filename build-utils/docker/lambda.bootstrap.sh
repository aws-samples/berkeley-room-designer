#!/bin/sh
# This file is responsible for defining our Lambda custom runtime which invokes a function handler.
# References: 
# * https://docs.aws.amazon.com/lambda/latest/dg/runtimes-walkthrough.html
# * https://docs.aws.amazon.com/lambda/latest/dg/images-test.html
# curl "http://localhost:9000/2015-03-31/functions/function/invocations" -d '{"payload":"hello world!"}'
set -euxo pipefail

# Initialization - load function handler.
source $LAMBDA_TASK_ROOT/"$(echo $_HANDLER | cut -d. -f1).sh"

ls -al /function
ls -al /function/packages

echo "Processing"
while true
do
  HEADERS="$(mktemp)"

  echo "Get an event. The HTTP request will block until one is received"
  EVENT_DATA=$(curl -sS -LD "$HEADERS" -X GET "http://${AWS_LAMBDA_RUNTIME_API}/2018-06-01/runtime/invocation/next")

  echo "Extract request ID by scraping response headers received above"
  REQUEST_ID=$(grep -Fi Lambda-Runtime-Aws-Request-Id "$HEADERS" | tr -d '[:space:]' | cut -d: -f2)

  echo "Clear last response (if any)"
  set +e
  rm -f /tmp/response.log
  set -e

  echo "Run the handler function from the script"
  OUTPUT=$($(echo "$_HANDLER" | cut -d. -f3) "$EVENT_DATA") # -f3 gets the handler function name from function.sh.handler
  
  # This seems to log OK when deployed to Lambda.
  if [[ "$app_location" != "aws" ]]; then
    echo "Function output: $OUTPUT"
  fi

  RESPONSE=$(cat /tmp/response.log)
  echo "Got response: $RESPONSE"

  echo "Send the response"
  curl -X POST "http://${AWS_LAMBDA_RUNTIME_API}/2018-06-01/runtime/invocation/$REQUEST_ID/response"  -d "$RESPONSE"
done