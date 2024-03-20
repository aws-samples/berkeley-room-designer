# This file is responsible for defining developer commands.
# This approach is the opposite of a framework/build tool approach and prioritizes small libraries and build tools over all-in ones.
# It also happens that this approach works well on a lowish-RAM 'nix machine, while the popular frameworks/build tools give us issues.
# Horses for courses, or something. 
# 
# Also, as you'll see below, ESM + TypeScript has been...difficult.
include makefile.inc

# Lowest supported browser targets for ESM: https://caniuse.com/?search=ESM
#supported_esbuild_browser_targets := chrome60,firefox60,safari11,edge18
# Lowest supported browser targets for BigInt needed by sqlite-wasm-http: https://caniuse.com/bigint
supported_esbuild_browser_targets := chrome67,firefox68,safari14,edge79

# Enables the visualizer for debugging furniture placement algorithms.
visualizer := false

openapi_def_types_dist_dir := src/openapi-def/types
openapi_def_iface_dist_dir := src/openapi-def/iface
cli_visualizer_dist_dir := dist.cli.visualizer

# Repolinter is ran locally as part of the sample release process.
repolinter_rules_path := /Users/$(shell whoami)/Downloads/amazon-ospo-ruleset.json

# Fortify is ran locally as part of the sample release process.
fortify_install_path := /Applications/Fortify/Fortify_SCA_and_Apps_22.1.1
fortify_license_path := /Users/$(shell whoami)/Downloads/fortify.license

# NPM-based.
allowed_licenses := MIT;Apache-2.0;BSD-2-Clause;BSD-3-Clause;BSD*;0BSD;ISC;Python-2.0;CC-BY-4.0;CC-BY-3.0;CC0-1.0;Unlicense;WTFPL

# This command has side-effects and installs a couple of NPM packages globally. 
setup:
	make download-packages-from-github
	make install
	make build/dataset-to-sqlite-db
# Some files are generated so they'll need the license header added.
	make add-license-header-to-files

download-packages-from-github:
# There are currently issues using esbuild with the sqlite-wasm-http package when it's imported by this source.
# This appears to be an issue with both esbuild and how web workers are declared in the sqlite-wasm-http package (see: https://github.com/evanw/esbuild/issues/312).
# If we just download the source to inside this src, then we get this error: node_modules/typescript/lib/lib.dom.d.ts(25,1): error TS6200: Definitions of the following identifiers conflict with those in another file
# So, we found it easiest to:
# * Download the source of sqlite-wasm-http to /tmp and build it
# * Copy our sqlite search (./src/sqlite-search.frontend.ts) into sqlite-wasm-http (could not get it building any other way) 
# * Build (bundle) the sqlite-wasm-http package
# * Copy the bundled wasm and js files (including our sqlite search program) from sqlite-wasm-http to this package
# We can then include the copied files in our HTML and interact with our sqlite search program via an exposed window object.
	make name="sqlite-wasm-http" branch="main" owner="mmomtchev/sqlite-wasm-http" sha="aebdc1673edc2291636d2abf3d2a9c2bcb62e048" download-package-from-github
# npm install in the sqlite-wasm-http package runs a script which builds the package.
# This script fails unless we override the tsconfigs in this package because it's not expecting our parent package's node_modules.
# These sed commands fix the issue.
	if [ "$(shell uname)" == "Linux" ]; then \
		sed -e 's/"esModuleInterop": true,/"skipLibCheck": true,"esModuleInterop": true,/g' /tmp/sqlite-wasm-http/tsconfig.cjs.json; \
		sed -e 's/"esModuleInterop": true,/"skipLibCheck": true,"esModuleInterop": true,/g' /tmp/sqlite-wasm-http/tsconfig.json; \
	fi;
	if [ "$(shell uname)" == "Darwin" ]; then \
		sed -i '' -e 's/"esModuleInterop": true,/"skipLibCheck": true,"esModuleInterop": true,/g' /tmp/sqlite-wasm-http/tsconfig.cjs.json; \
		sed -i '' -e 's/"esModuleInterop": true,/"skipLibCheck": true,"esModuleInterop": true,/g' /tmp/sqlite-wasm-http/tsconfig.json; \
	fi;

download-package-from-github:
	rm -rf /tmp/$(name)_zip || echo ""
	rm -rf /tmp/$(name) || echo ""
	rm -f /tmp/$(name).zip || echo ""

	curl -L -o /tmp/$(name).zip "https://github.com/$(owner)/archive/$(sha).zip"
	unzip /tmp/$(name).zip -d /tmp/$(name)_zip
	mv /tmp/$(name)_zip/$(name)-$(sha) /tmp/$(name)

install:
# We had issues with NPM picking up changes to these packages due to how packages pulled from Github are cached.
# If you run into the same issues, uncomment the lines below.	
	rm -rf ~/.npm-global/lib/node_modules/openapi-includer-cli
	npm uninstall -g ts-npm
	npm uninstall -g openapi-includer-cli

# These packages need to be installed globally.
	npm install -g "github:tsapporg/ts-npm#f1f6e4c6cead9ae5f8877f25da5ff85382079c5c" # Used to install npm packages from npm*.ts files, requires global install ATM.
	npm install -g "github:tsapporg/openapi-includer-cli#1bc75ecb3d37563008a36550560238adfdd11ba1" # Used to assemble OpenAPI files (using dollar includes keyword) to build OpenAPI spec, requires global install ATM.

# These packages are downloaded locally and need dependencies installed.
	cd /tmp/sqlite-wasm-http; npm install

# This generates package.json from our ./.npm/npm*.ts files.
	ts-npm --action=install --absolute-path-to-dependencies=$(shell pwd)/.npm

build/dataset-to-sqlite-db:
	make clean/dataset

# The entire dataset is huge. We don't have enough space on our computer to download them, can't expect you to either.
# We've put a subset of the dataset into a zip file. The files in this zip file were cherry-picked from the dataset. 
ifeq ($(use_dataset_subset),false)
	make download/dataset
else
	unzip $(shell pwd)/build-utils/data/dataset-subset.zip -d $(shell pwd)/build-utils/data/
endif

	npx shx rm -f ./build-utils/data/berkeley.db
	npx cross-env NODE_ENV=$(node_env) node \
		--experimental-specifier-resolution=node --experimental-modules --no-warnings \
		--import $(ts_exec_tsx) \
		./src/dataset-to-sqlite-db/index.ts

clean/dataset:
	npx shx rm -f ./build-utils/data/*.csv
	npx shx rm -f ./build-utils/data/*.json

download/dataset:
#curl -L -o /tmp/abo-3dmodels.tar https://amazon-berkeley-objects.s3.amazonaws.com/archives/abo-3dmodels.tar
	curl -L -o /tmp/abo-listings.tar https://amazon-berkeley-objects.s3.amazonaws.com/archives/abo-listings.tar
	curl -L -o /tmp/abo-images-small.tar https://amazon-berkeley-objects.s3.amazonaws.com/archives/abo-images-small.tar
	curl -L -o /tmp/abo-spins.tar https://amazon-berkeley-objects.s3.amazonaws.com/archives/abo-spins.tar

	tar -xzf /tmp/abo-listings.tar
	tar -xzf /tmp/abo-images-small.tar
	tar -xzf /tmp/abo-spins.tar

	ls -al /tmp/abo-listings
	ls -al /tmp/abo-images-small
	ls -al /tmp/abo-spins

# You can enable a GUI when running synthetic data generation to help in visualizing the algorithms used for furniture placement:
# * make algorithm=autointeriorblog generate-synthetic-room-data
# * make algorithm=random generate-synthetic-room-data
# * make algorithm=llm stage=main generate-synthetic-room-data # Requires AWS backend/frontend deployment.
#
# We broke this up into 3 processes because of esbuild bundling issues, but I'm sure you can find a way to consolidate:
# * generate-synthetic-room-data.ts (Runs furniture placement algorithms)
# * renderer.ts (Renders whatever furniture placement algorithms deem important to render for debugging)
# * visualizer/index.ts (Allows for GUI interaction - slideshow - of local rendering images)
#
# References:
# * https://github.com/sedwards2009/nodegui-simple-starter
generate-synthetic-room-data:
	make clean/visualizer

ifeq ($(visualizer),true)
	make build/visualizer
	npx concurrently --kill-others \
		"make generate-synthetic-room-data/visualizer" \
		"npx wait-on tcp:3304 && make generate-synthetic-room-data/renderer" \
		"npx wait-on tcp:3305 && make visualizer=true algorithm=$(algorithm) stage=$(stage) generate-synthetic-room-data/algorithm"
else 
	make visualizer=false algorithm=$(algorithm) stage=$(stage) generate-synthetic-room-data/algorithm
endif

clean/visualizer:
	npx shx rm -f ./build-utils/renders/*.png

build/visualizer:
	npx shx rm -rf ./${cli_visualizer_dist_dir}
	npx tsc --project ./config/tsconfig.cli.visualizer.json
	npx esbuild ./${cli_visualizer_dist_dir}/index.js \
		--sourcemap --bundle --platform=node --format=cjs \
		--outfile=./${cli_visualizer_dist_dir}/bundle.cjs \
		--define:global=window \
		--external:@nodegui/nodegui --external:nodegui-plugin-*

generate-synthetic-room-data/visualizer:
	npx qode --inspect=9229 ./${cli_visualizer_dist_dir}/bundle.cjs

generate-synthetic-room-data/renderer:
	npx cross-env NODE_ENV=$(node_env) node \
		--experimental-specifier-resolution=node --experimental-modules --no-warnings \
		--import $(ts_exec_tsx) \
		./src/cli/generate-synthetic-room-data.renderer.ts

generate-synthetic-room-data/algorithm:
ifeq ($(algorithm),llm)
	$(eval aws_cli_profile_arg := $(shell echo "--profile ${aws_$(stage)_cli_profile}"))
	@echo "aws_cli_profile_arg: $(aws_cli_profile_arg)"
	
	$(eval cfn_export_key := $(shell ./build-utils/infra/aws.strip-dashes.sh "${aws_cfn_prefix}-$(stage)-${aws_backend_app_url_cfn_export_name_suffix}-${aws_$(stage)_deploy_id}"))
	@echo "lookup cfn export: $(cfn_export_key)"
	$(eval app_url := $(shell aws cloudformation describe-stacks --stack-name "${aws_cfn_prefix}-$(stage)-${aws_backend_cfn_stack_suffix}-${aws_$(stage)_deploy_id}" $(aws_cli_profile_arg) --region "${aws_$(stage)_region}" --query 'Stacks[0].Outputs[?OutputKey==`$(cfn_export_key)`].OutputValue' --output text))
	@echo "found resource app_url: $(app_url)"
endif

# Just passing visualizer=true here won't work - you need the other IPC processes as outlined in "make generate-synthetic-room-data-with-visualizer".
	npx cross-env NODE_ENV=$(node_env) AWS_REGION=${aws_$(stage)_region} AWS_PROFILE=${aws_$(stage)_cli_profile} node \
		--experimental-specifier-resolution=node --experimental-modules --no-warnings \
		--import $(ts_exec_tsx) \
		./src/cli/generate-synthetic-room-data.ts \
			--visualizer=$(visualizer) --algorithm=$(algorithm)

develop/website:
	make node_env=$(node_env) build
	make node_env=$(node_env) build/backend
	npx concurrently --kill-others \
		"make develop/watch/styles" \
		"make node_env=$(node_env) develop/watch/scripts" \
		"make node_env=$(node_env) develop/watch/bundle/website" \
		"make node_env=$(node_env) develop/watch/html" \
		"make node_env=$(node_env) develop/watch/public" \
		"make node_env=$(node_env) serve/website" \
		"make node_env=$(node_env) stage=$(stage) serve/backend"

build:
	make clean/frontend
	make node_env=$(node_env) build/styles
	make node_env=$(node_env) build/scripts
	make node_env=$(node_env) build/dependencies/styles
	make build/public
	make node_env=$(node_env) app_location=$(app_location) build/html

clean:
	npx shx rm -rf ./${frontend_dist_dir}
	npx shx rm -rf ./${backend_dist_dir}
	npx shx rm -rf ./${cli_visualizer_dist_dir}

build/styles:
	npx shx mkdir -p ./${frontend_dist_dir}

	npx esbuild ./src/frontend/styles/index.css --bundle \
		--outfile=./${frontend_dist_dir}/bundle.css

build/scripts:
	make build/openapi-def
	make compile/scripts
	make bundle/scripts/website

build/openapi-def:
# Assemble OpenAPI YAML definitions into one file. Currently need to pass absolute YAML path.
	openapi-includer-cli \
		--absolute-input-openapi-def-path=$(shell pwd)/src/openapi-def/api.yaml \
		--absolute-output-openapi-def-path=$(shell pwd)/src/openapi-def/_api.yaml

# Validate OpenAPI def.
# FIXME Ignore ibm-path-segment-casing-convention or find a way to adjust to lowercase.
#npx ibm-openapi-validator ibm-path-segment-casing-convention=ignore -e ./src/openapi-def/_api.yaml

# Generate TypeScript interfaces used by openapi-fetch for frontend HTTP client, and also some places in backend.
	npx openapi-typescript ./src/openapi-def/_api.yaml --output ./${openapi_def_types_dist_dir}/index.d.ts
# Generate types for our backend routing to map operationIds to business logic with @openapi-ts/backend et. al.
# openapi-ts-backend doesn't seem to generate interfaces we can use on the backend? Leaning on index.d.ts intead.
	npx openapi-ts-backend generate-types $(shell pwd)/src/openapi-def/_api.yaml $(shell pwd)/${openapi_def_iface_dist_dir}

compile/scripts:
	npx cross-env NODE_ENV=$(node_env) npx tsc --project ./config/tsconfig.frontend.json

bundle/scripts/website:
	npx esbuild ./${frontend_dist_dir}/frontend/index.website.js $(watch_flag)--bundle \
		"--external:./fonts/bootstrap-icons.woff*" \
		--sourcemap \
		--define:global=window \
		--target=${supported_esbuild_browser_targets} \
		--outfile=./${frontend_dist_dir}/bundle.website.js

build/dependencies/styles:
	npx shx mkdir -p ./${frontend_dist_dir}
	npx clean-css-cli --output ./${frontend_dist_dir}/deps.css \
		./node_modules/bootstrap/dist/css/bootstrap.css \
		./node_modules/bootstrap-icons/font/bootstrap-icons.css

build/html:
# Save .env variables as JSON to temp file so we can inject these in our HTML template.
	cat ./config/.env | npx dotenv-to-json > /tmp/berkeley-room-designer-env-website.json
	make stage=$(stage) \
		app_location=$(app_location) \
		aws_cli_profile_arg="--profile ${aws_main_cli_profile}" \
		build/html/website

build/html/website:
# Also lookup and save AWS resource variables to JSON to temp file so we can inject these in our HTML template. 
	$(eval cfn_export_key := $(shell ./build-utils/infra/aws.strip-dashes.sh "${aws_cfn_prefix}-$(stage)-${aws_backend_app_url_cfn_export_name_suffix}-${aws_$(stage)_deploy_id}"))
	@echo "lookup cfn export: $(cfn_export_key)"
	$(eval app_url := $(shell aws cloudformation describe-stacks --stack-name "${aws_cfn_prefix}-$(stage)-${aws_backend_cfn_stack_suffix}-${aws_$(stage)_deploy_id}" $(aws_cli_profile_arg) --region "${aws_$(stage)_region}" --query 'Stacks[0].Outputs[?OutputKey==`$(cfn_export_key)`].OutputValue' --output text))
	@echo "found resource app_url: $(app_url)"

	$(eval scripts_with_csp_hashes := $(shell npx cross-env NODE_ENV=development node --experimental-specifier-resolution=node --experimental-modules --no-warnings --import tsx/esm ./build-utils/infra/build-script-hashes.ts --app-location="$(app_location)"))
	@echo "scripts_with_csp_hashes: $(scripts_with_csp_hashes)"

	jq --argjson addobj '{"app_location": "$(app_location)"}' '. + $$addobj' /tmp/berkeley-room-designer-env-website.json > input.tmp && mv input.tmp /tmp/berkeley-room-designer-env-website.json
	jq --argjson addobj '{"scripts_with_csp_hashes": "$(scripts_with_csp_hashes)"}' '. + $$addobj' /tmp/berkeley-room-designer-env-website.json > input.tmp && mv input.tmp /tmp/berkeley-room-designer-env-website.json

# Add AWS resources to created JSON temp file.
	jq --argjson addobj '{"api_url": "$(app_url)/api"}' '. + $$addobj' /tmp/berkeley-room-designer-env-website.json > input.tmp && mv input.tmp /tmp/berkeley-room-designer-env-website.json

	make build/html/template/website

build/html/template/website:
	$(eval website_template_data := $(shell cat /tmp/berkeley-room-designer-env-website.json))
	npx cross-env NODE_ENV=$(node_env) npx ejs-cli ./src/frontend/index.html --out ./${frontend_dist_dir}/index.html --options '${website_template_data}'

build/public:
	npx shx cp -R ./src/frontend/public/* ./${frontend_dist_dir}/
	npx shx cp -R ./build-utils/data/berkeley.db ./${frontend_dist_dir}/

# Currently not bundle-able, need to be included in HTML.
	npx shx cp ./src/sqlite-search.frontend.ts /tmp/sqlite-wasm-http/examples/index.ts
	cd /tmp/sqlite-wasm-http; npx tsc && npx webpack --mode=development
	npx shx cp /tmp/sqlite-wasm-http/docs/examples/*.js ./${frontend_dist_dir}/
	npx shx cp /tmp/sqlite-wasm-http/docs/examples/*.wasm ./${frontend_dist_dir}/

	npx shx cp -R ./node_modules/bootstrap-icons/font/fonts ./${frontend_dist_dir}/
	
develop/watch/styles:
	npx onchange -v -k "src/frontend/styles/**/*.css" -- make build/styles

develop/watch/scripts:
	npx cross-env NODE_ENV=$(node_env) npx tsc --watch --project ./config/tsconfig.frontend.json

develop/watch/bundle/website:
	make watch_flag="--watch " bundle/scripts/website

develop/watch/html:
	npx onchange -v -k "src/frontend/index.html" -- make build/html

develop/watch/public:
	npx onchange -v -k "src/frontend/public/**/*" -- make build/public

serve/website:
	npx webpack serve --config ./config/webpack-dev-server.config.mjs --open true --mode=development --node-env $(node_env)

serve/backend:
	npx cross-env NODE_ENV=$(node_env) AWS_REGION=${aws_$(stage)_region} AWS_PROFILE=${aws_$(stage)_cli_profile} node \
		--experimental-specifier-resolution=node --experimental-modules --no-warnings \
		--import $(ts_exec_tsx) \
		./src/backend/infra_local.ts

clean/frontend:
	npx shx rm -rf ./${frontend_dist_dir}

build/backend:
	make clean/backend
	make build/openapi-def

# Validate the backend compiles.
	npx cross-env NODE_ENV=$(node_env) npx tsc --project ./config/tsconfig.backend.lambda.docker.json

# Sqlite3 isn't easily bundle-able right now so far as I'm aware because of a dependency on @mapbox/node-pre-gyp. See: https://github.com/mapbox/node-pre-gyp/issues/661
# Instead we build a custom Lambda runtime as a Docker image and ship to ECR so Lambda can use it.
# I've commented out the steps below for bundling so that when the issue is resolved you should be able to drop the Docker dependency in this step.
# Only build the Docker-based Lambda backend if we're deploying to AWS - otherwise we can just invoke TypeScript with Node.js.
#
# This is how we bundle TypeScript based-Lambdas normally, but it's broken here due to above notes.
#make clean/backend
#
# The backend needs a dependency file to build package.json using ts-npm.
#npx shx cp ./npm.backend.ts ./src/backend/npm.ts
#
# The backend needs TypeScript types for the API generated for use in routing requests with @openapi-ts/backend.
#make build/openapi-def
#
# Install backend dependencies and compile TypeScript.
#cd ./src/backend; ts-npm --action=install --absolute-path-to-dependencies=$(shell pwd)/src/backend
#npx cross-env NODE_ENV=$(node_env) npx tsc --project ./config/tsconfig.backend.json
#npx shx cp ./src/openapi-def/_api.yaml ./${backend_dist_dir}/
#npx shx cp ./build-utils/data/berkeley.db ./${backend_dist_dir}/
#
#npx esbuild ./${backend_dist_dir}/backend/infra_aws.js \
#  --platform=node --bundle --target=node18 --format=esm --outfile=./${backend_dist_dir}/infra_aws_bundle.mjs
#cat ./${backend_dist_dir}/infra_aws_bundle.mjs | node ./build-utils/infra/importify_esbuild_output.cjs > ./${backend_dist_dir}/infra_aws_bundle_override.mjs
#mv ./${backend_dist_dir}/infra_aws_bundle_override.mjs ./${backend_dist_dir}/infra_aws_bundle.mjs

clean/backend:
	make src_dir=./src/backend dist_dir=${backend_dist_dir} clean-bundled-typescript-src

	npx shx rm -f ./src/openapi-def/_api.yaml
	npx shx rm -f ./src/openapi-def/types/*.ts

# Every time deploy/backend/<stage> is called, cdk.out fills up with new CDK Docker assets.
# You can remove this if you get rid of Docker-based custom Lambda runtime deploy via CDK.
	npx shx rm -rf ./src/infra/cdk.out

run:
	make node_env=$(node_env) build
	make node_env=$(node_env) serve/website

# We write Lambda functions in infra_aws.ts files in the src/**/* folders and bundle the source refeferenced in that file. 
# We know these files have underscores (_) while the rest of the files have dashes (-);
#  this is because when Lambda tries to import a Node.js function + handler named "infra.aws.handler", it will fail.
bundle-typescript-src-for-aws-lambda:
# The "package" needs a dependency file to build package.json using ts-npm.
	npx shx cp $(npm_file) $(src_dir)/npm.ts

# Install dependencies and compile TypeScript.
	cd $(src_dir); ts-npm --action=install --absolute-path-to-dependencies=$(src_dir)
	npx cross-env NODE_ENV=$(node_env) npx tsc --project $(tsconfig_path)

	npx esbuild $(src_dir)/infra_aws.js \
		--platform=node --bundle --target=node18 --format=esm --outfile=$(dist_dir)/infra_aws_bundle.mjs
	cat $(dist_dir)/infra_aws_bundle.mjs | node ./build-utils/infra/importify_esbuild_output.cjs > $(dist_dir)/infra_aws_bundle_override.mjs
	mv $(dist_dir)/infra_aws_bundle_override.mjs $(dist_dir)/infra_aws_bundle.mjs

clean-bundled-typescript-src:
	npx shx rm -rf $(dist_dir)
	npx shx rm -f $(src_dir)/npm.ts 
	npx shx rm -f $(src_dir)/package.json 
	npx shx rm -f $(src_dir)/package-lock.json

tests/integration:
	npx cross-env NODE_ENV=$(node_env) node \
		--experimental-specifier-resolution=node --experimental-modules --no-warnings \
		--import $(ts_exec_tsx) \
		./src/tests.integration/infra_local.ts
		
# If we shared this as a zip file, what would we need to remove?
superclean:
	make clean/frontend
	make clean/backend
	make clean/visualizer
	make clean/dataset
	make -f makefile.aws clean/infra

	npx shx rm -rf /tmp/sqlite-wasm-http
	npx shx rm -rf /tmp/sqlite-wasm-http_zip
	npx shx rm -f /tmp/sqlite-wasm-http.zip

# Bundled as Lambdas with a subset of node_modules.
	npx shx rm -rf ./src/backend/node_modules

	npx shx rm -rf ./node_modules

scan:
#make lint/repo
	make scan/licenses
#make scan/source
	make aws_cfn_prefix=$(aws_cfn_prefix) stage=$(stage) scan/cloudformation-templates
#make generate-license-report 

lint/repo:
	NODE_OPTIONS=max-old-space-size=127284016 node $(shell pwd)/node_modules/repolinter/bin/repolinter.js lint --dryRun -r $(repolinter_rules_path) \
		--allowPaths $(shell pwd)/build-utils/**/* --allowPaths $(shell pwd)/config/**/* --allowPaths $(shell pwd)/readme/**/* --allowPaths $(shell pwd)/src/**/* \
		.
scan/licenses:
# License notes:
# * Package ts-matrix specifies its own license, see: https://github.com/Kapcash/ts-matrix/blob/master/LICENSE.md
# * Package turf-jsts@1.2.3 specifies a BSD-3-Clause license but is not picked up, see: https://github.com/DenisCarriere/turf-jsts/blob/master/package.json#L27C26-L27C26
# * Package buffers@0.1.1 specifies an MIT license but is not picked up, see: https://web.archive.org/web/20140802165612/https://github.com/substack/node-buffers
# * Packages jackspeak@2.3.6 and path-scurry@1.10.1 specify BlueOak-1.0.0 license, see: https://blueoakcouncil.org/license/1.0.0
	npx license-checker-rseidelsohn --summary --onlyAllow '$(allowed_licenses)' --excludePackages 'buffers@0.1.1;ts-matrix@1.3.2;turf-jsts@1.2.3;jackspeak@2.3.6;path-scurry@1.10.1'
scan/source:
	$(fortify_install_path)/bin/sourceanalyzer -b DatasetToSqliteDBTypeScript $(shell pwd)/src/dataset-to-sqlite-db/**/*.ts --exclude node_modules --verbose
	$(fortify_install_path)/bin/sourceanalyzer -b CLITypeScript $(shell pwd)/src/cli/**/*.ts --exclude node_modules --verbose
	$(fortify_install_path)/bin/sourceanalyzer -b CLIVisualizerTypeScript $(shell pwd)/src/cli.visualizer/**/*.ts --exclude node_modules --verbose
	$(fortify_install_path)/bin/sourceanalyzer -b FrontendTypeScript $(shell pwd)/src/frontend/**/*.ts --exclude node_modules --verbose
	$(fortify_install_path)/bin/sourceanalyzer -b BackendTypeScript $(shell pwd)/src/backend/**/*.ts --exclude node_modules --verbose
	$(fortify_install_path)/bin/sourceanalyzer -b InfraTypeScript $(shell pwd)/src/infra/**/*.ts --exclude node_modules --verbose
scan/cloudformation-templates:
# FIXME See CICD stack definition for why it's not getting scanned.
#make -f makefile.aws cdk_action=synth cdk_nag=true stage=$(stage) deploy/cicd
	make -f makefile.aws cdk_action=synth cdk_nag=true stage=$(stage) deploy/base
	make -f makefile.aws cdk_action=synth cdk_nag=true stage=$(stage) deploy/backend
generate-license-report:
	npx license-report --output=csv --fields=name --fields=licenseType --delimiter=" - " 

build-script-hashes:
	npx cross-env NODE_ENV=$(node_env) node \
		--experimental-specifier-resolution=node --experimental-modules --no-warnings \
		--import $(ts_exec_tsx) \
		./build-utils/infra/build-script-hashes.ts --app-location="$(app_location)"

add-license-header-to-files:
	npx source-licenser --config-file ./config/source-licenser.yaml './'