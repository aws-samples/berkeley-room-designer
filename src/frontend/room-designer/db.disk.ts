// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for storing room configurations to disk.
import * as log from 'ts-app-logger';

import { IExport, ISaveArgs } from '../iface';

export const saveRoomToDisk = async (roomExport: IExport, saveArgs: ISaveArgs) => {
  log.debug('saveRoomToDisk', roomExport);

  if (saveArgs.dryRun) { return; }

  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([roomExport.yaml], { type: 'application/yaml' }));
  a.setAttribute('download', roomExport.exportName);

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}