#!/bin/bash
# This file is responsible for emptying an S3 bucket.
# References:
# * https://gist.github.com/wknapik/191619bfa650b8572115cd07197f3baf
# * https://gist.github.com/weavenet/f40b09847ac17dd99d16
set -ex

if [ "$#" -ne 8 ]; then
  echo "Must pass cfn_stack_prefix, stage, deploy_id, cfn_stack_suffix, bucket_cfn_export_name_suffix, supply_cfn_export_key, region, and aws_cli_profile_arg as parameters, exiting"
  exit 1
fi

cfn_stack_prefix="$1"
stage="$2"
deploy_id="$3"
cfn_stack_suffix="$4"
bucket_cfn_export_name_suffix="$5"
supply_cfn_export_key="$6"
region="$7"
aws_cli_profile_arg="$8"

export AWS_PAGER="" 

disable_bucket_logging() {
  local -r bucket="${1:?}"
  aws s3api put-bucket-logging \
    --bucket $bucket \
    --bucket-logging-status "{}" \
    $aws_cli_profile_arg --region "$region"
}

empty_bucket() {
  local -r bucket="${1:?}"
  for object_type in Versions DeleteMarkers; do
    local opt=() next_token=""
    while [[ "$next_token" != null ]]; do
      page="$(aws s3api list-object-versions --bucket "$bucket" $aws_cli_profile_arg --region "$region" --output json --max-items 400 "${opt[@]}" --query="[{Objects: ${object_type}[].{Key:Key, VersionId:VersionId}}, NextToken]")"
      objects="$(jq -r '.[0]' <<<"$page")"
      next_token="$(jq -r '.[1]' <<<"$page")"
      objects_list="$(jq -r '.Objects' <<<"$objects")"

      if [[ "$objects_list" != null ]]; then
        aws s3api delete-objects --bucket "$bucket" $aws_cli_profile_arg --region "$region" --delete "$objects"
        echo "deleted objects, next token: $next_token"
      fi
    done
  done
}

if [ "$supply_cfn_export_key" == "null" ]; then
  cfn_export_key=$(./build-utils/infra/aws.strip-dashes.sh "${aws_cfn_prefix}-${stage}-${bucket_cfn_export_name_suffix}-${deploy_id}")
  echo "lookup cfn export: $cfn_export_key"
else 
  cfn_export_key="$bucket_cfn_export_name_suffix"
  echo "supplied cfn export: $cfn_export_key"
fi

bucket_name=$(aws cloudformation describe-stacks --stack-name "${aws_cfn_prefix}-${stage}-${cfn_stack_suffix}-${deploy_id}" $aws_cli_profile_arg --region "$region" --query 'Stacks[0].Outputs[?OutputKey==`'$cfn_export_key'`].OutputValue' --output text)
echo "found bucket named $bucket_name from cfn export, deleting all objects"

disable_bucket_logging "$bucket_name"
empty_bucket "$bucket_name"