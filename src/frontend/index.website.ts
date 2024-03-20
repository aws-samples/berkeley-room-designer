// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for defining the entrypoint to the website.

// Polyfills needed until web components are fully supported: https://developer.mozilla.org/en-US/docs/Web/Web_Components#browser_compatibility
import '@webcomponents/webcomponentsjs/webcomponents-bundle.js';
import '@lit/reactive-element/polyfill-support.js'; 

// Polyfills needed until url patterns are fully supported: https://developer.mozilla.org/en-US/docs/Web/API/URLPattern#browser_compatibility
import 'urlpattern-polyfill';

// import 'popper.js'; FIXME Could not resolve import.
import 'bootstrap';
//import 'bootstrap-icons/font/bootstrap-icons'; FIXME Icons do not show up.

import * as log from 'ts-app-logger';
log.configure({ traceEnabled: globalThis.app_location !== 'aws' , debugEnabled: true, filters: [] });

import './app.website';