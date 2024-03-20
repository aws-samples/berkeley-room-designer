#!/bin/bash
# This file is responsible for removing dashes from input.
# It's used to lookup CloudFormation export keys when they have dashes in them,
#  since CloudFormation strips them automatically.
set -e

input=$1
output="${input//-/}"
echo "$output"