#!/bin/bash
# This file is responsible for translating the .gitignore file to a zip-ignore list used to deploy CICD from a zip file.
# It also adds a few items we DON'T want to git-ignore but do want to zip-ignore.
set -e

ignore_args=""
while read -r line; do
  if [[ "$line" =~ ^#.*$ ]]; then
    echo "ignore $line" # Removes comments.
  else 
    if [[ ! -z "$line" ]]; then
      ignore_args="$ignore_args -x '$line'"
    fi
  fi
done < ".gitignore"

ignore_args=$(echo $ignore_args | sed "s/-x ''//g") # Removes -x '' from unscrubbed newlines if there are any.

cmd="zip -r ../source-code.zip ./ $ignore_args -x '*.git/*' -x 'readme/*'"
echo "$cmd"
eval $cmd