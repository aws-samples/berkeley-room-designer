#!/bin/bash
# This file is responsible for deleting a CloudFormation stack (and waiting for it to delete).
set -ex

if [ "$#" -ne 6 ]; then
  echo "Must pass aws_cfn_prefix, stage, cfn_stack_suffix, deploy_id, region, and aws_cli_profile_arg as parameters, exiting"
  exit 1
fi

aws_cfn_prefix="$1"
stage="$2"
cfn_stack_suffix="$3"
deploy_id="$4"
region="$5"
aws_cli_profile_arg="$6"

aws cloudformation delete-stack \
  $aws_cli_profile_arg \
  --stack-name "${aws_cfn_prefix}-${stage}-${cfn_stack_suffix}-${deploy_id}" \
  --region "$region"

aws cloudformation wait stack-delete-complete \
  $aws_cli_profile_arg \
  --stack-name "${aws_cfn_prefix}-${stage}-${cfn_stack_suffix}-${deploy_id}" \
  --region "$region"