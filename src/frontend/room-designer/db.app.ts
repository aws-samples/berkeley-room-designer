// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for storing room configurations in the app (IndexDB).
import Dexie, { Table } from 'dexie';

import { IExport, ISaveArgs } from '../iface';

import { IRoomConfiguration, IRoomData } from './iface';
import { importRoomFromYAML } from './importer';

export default class RoomConfigurationAppStorage extends Dexie {
  public roomConfigurations!: Table<IExport, string>;

  constructor() {
    super('RoomConfigurationAppStorage');

    //this.version(1).stores({ roomConfigurations: '++id,exportName,yaml' });
    this.version(1).stores({ roomConfigurations: 'exportName,yaml' });
  }
}

const db = new RoomConfigurationAppStorage();

export const saveRoomToApp = async (exportedRoom: IExport, saveArgs: ISaveArgs) => {
  if (saveArgs.dryRun) { return; }

  await db.transaction('rw', db.roomConfigurations, async () => {
    await db.roomConfigurations.add(exportedRoom);
  });
}

export const removeRoomConfigurationFromApp = async (roomData: IRoomData) => {
  await db.transaction('rw', db.roomConfigurations, async () => {
    await db.roomConfigurations.delete(roomData.exportedRoom.exportName);
  });
}

export const listRoomConfigurationsForApp = async (): Promise<IRoomData[]> => {
  return await db.transaction('rw', db.roomConfigurations, async () => {
    const exportedRooms = await db.roomConfigurations.toCollection().toArray();
    
    return exportedRooms.map(exportedRoom => {
      return { exportedRoom, roomConfiguration: importRoomFromYAML(exportedRoom.yaml) }; 
    });
  });
}

export const getRoomConfigurationFromApp = async (roomConfigurationId: string): Promise<IRoomConfiguration | undefined> => {
  return await db.transaction('rw', db.roomConfigurations, async () => {
    const exportedRooms = await db.roomConfigurations.toCollection().toArray();

    const roomConfigurations = exportedRooms.map(exportedRoom => {
      return importRoomFromYAML(exportedRoom.yaml);
    });

    return roomConfigurations.find(roomConfiguration => roomConfiguration.id === roomConfigurationId);
  });
}