#!/bin/bash
set -ex

ls -al /opt/app
cd /opt/app

make node_env=development stage=$stage serve/backend 2>&1 &
make node_env=development serve/website
#make node_env=development stage=$stage serve/backend 2>&1 &
#make node_env=development serve/website 2>&1 &