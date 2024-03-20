#!/bin/bash
# This file is responsible for emptying an ECR repo.
set -ex

if [ "$#" -ne 8 ]; then
  echo "Must pass cfn_stack_prefix, stage, deploy_id, cfn_stack_suffix, repo_cfn_export_name_suffix, supply_cfn_export_key, region, and aws_cli_profile_arg as parameters, exiting"
  exit 1
fi

cfn_stack_prefix="$1"
stage="$2"
deploy_id="$3"
cfn_stack_suffix="$4"
repo_cfn_export_name_suffix="$5"
supply_cfn_export_key="$6"
region="$7"
aws_cli_profile_arg="$8"

export AWS_PAGER="" 

empty_repo() {
  repo_name=$1

  aws ecr batch-delete-image $aws_cli_profile_arg --region "$region" \
    --repository-name "$repo_name" \
    --image-ids "$(aws ecr list-images $aws_cli_profile_arg --region "$region" --repository-name "$repo_name" --query 'imageIds[*]' --output json)" || true
}

if [ "$supply_cfn_export_key" == "null" ]; then
  cfn_export_key=$(./build-utils/infra/aws.strip-dashes.sh "${aws_cfn_prefix}-${stage}-${repo_cfn_export_name_suffix}-${deploy_id}")
  echo "lookup cfn export: $cfn_export_key"
else 
  cfn_export_key="$repo_cfn_export_name_suffix"
  echo "supplied cfn export: $cfn_export_key"
fi

repo_name=$(aws cloudformation describe-stacks --stack-name "${aws_cfn_prefix}-${stage}-${cfn_stack_suffix}-${deploy_id}" $aws_cli_profile_arg --region "$region" --query 'Stacks[0].Outputs[?OutputKey==`'$cfn_export_key'`].OutputValue' --output text)
echo "found repo named $repo_name from cfn export, deleting all objects"

empty_repo "$repo_name"