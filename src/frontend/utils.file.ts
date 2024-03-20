// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for providing "file" interaction utilities.
import * as log from 'ts-app-logger';
import YAML from 'yaml';

import { SaveTo, IExport } from './iface';

export const getGLBFileLocation = (url: string): string => { 
  const segments = url.split('/');
  segments.pop();

  return `${segments.join('/')}/`;
}

export const getGLBFileName = (url: string): string => { 
  return url.substring(url.lastIndexOf('/') + 1); 
}

export const importYAMLAsJSON = (data: string) => {
  const yaml = YAML.parse(data);
  log.debug('yaml', yaml);

  return yaml;
}

export const exportJSONAsYAML = (json: any, saveArgs: { dryRun: boolean, saveTo: SaveTo, fileNameNoExtension: string }): IExport => {
  const yaml = convertJSONToYAML(json);
  const exportName = `${saveArgs.fileNameNoExtension}.yaml`;

  return { exportName, yaml }
}

export const convertJSONToYAML = (json: any): string => {
  const yaml = new YAML.Document();
  yaml.contents = json;
  log.debug('yaml', yaml.toString());

  return yaml.toString();
}