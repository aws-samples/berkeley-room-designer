# This file is responsible for shared makefile logic.
.NOTPARALLEL:
.DEFAULT_GOAL: null
null: 
	@echo 'Nothing to see here.'

ifeq ($(OS),Windows_NT) 
  SHELL := powershell
else
  SHELL := /bin/bash
endif

# Include environment configuration.
ifneq (,$(wildcard ./config/.env))
	include ./config/.env
	export
endif

# Default to using resources in AWS main stage if using AWS resources. See ./config/.env file for stage configuration.
stage ?= main

# local | aws
# Some business logic is determined by where the application is running.
app_location ?= local

# development | production
# Determines if Javascript is minified or not.
node_env ?= development

# true | false
# Determines if we should download the Amazon Berkeley dataset or use the subset included in this source.
use_dataset_subset ?= true

# Configure path variables without "./" in front since some CLI programs don't like relative paths.
frontend_dist_dir := dist.frontend
backend_dist_dir := dist.backend

# Moved to tsx because of globalThis issue, but ts-node/esm still used to invoke CDK apps.
ts_exec_ts_node = ts-node/esm
ts_exec_tsx = tsx/esm