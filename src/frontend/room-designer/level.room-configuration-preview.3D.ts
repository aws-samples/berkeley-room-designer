// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for defining our room configuration preview logic.
// It's similar to the room configuration page,
//  in that we have a room configuration and need to download the models associated with it,
//  rendering them as the information comes in, but lacks any ability to modify the room configuration. 
// The idea originally was that this would be a "photorealistic" rendering of the room 
//  (generated by a more capable renderer, perhaps on the backend), 
//  but getting one to work properly proved to be outside the scope of this sample.
import * as log from 'ts-app-logger';
import { IScene, ALevel } from 'ts-app-renderer';
import { SceneLoader } from '@babylonjs/core';
import { Scene } from '@babylonjs/core/scene';
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';

import { appState } from '../state';
import { appContext } from '../context';
import * as fileUtils from '../utils.file';
import { CommunicationsManager } from '../comms';

import { IListing, IRoomObject, IExportMeshPositionState } from './iface';
import * as mesh from './level.3D.mesh';

export default class RoomConfigurationPreview extends ALevel {
  // All the initial scene meshes - floor, etc. - that we should ignore while watching scene for new meshes.
  private meshesToIgnore: Map<number, AbstractMesh> = new Map<number, AbstractMesh>([]);
  
  private stateSubscriberId: number = -1;
  private contextSubscriberId: number = -1;

  private communicationsManager: CommunicationsManager;

  constructor(scene: IScene) { 
    super(scene); 

    this.communicationsManager = new CommunicationsManager(window);
  }

  protected override async loadBabylonLevel() {
    this.trackMeshesToIgnore();
  }

  private trackMeshesToIgnore() {
    for (const mesh of this.scene.cast<Scene>().meshes) {
      log.debug('tracking mesh to ignore it', mesh.uniqueId, mesh.name);
      
      this.meshesToIgnore.set(mesh.uniqueId, mesh);
    }

    log.debug('meshesToIgnore', this.meshesToIgnore);
  }

  protected override async afterBabylonLevelLoaded() {
    // On scene load.
  }

  protected override async babylonOnUpdate() {
    // Every update loop...
  }

  protected override async babylonOnRender() {
    // Every frame render...
  }

  async addListingToRoom(listing: IListing, importedRoomObject: IRoomObject): Promise<void> {
    log.trace('addListingToRoom', listing, importedRoomObject);

    log.info('url', listing.modelDownloadUrl);

    const listingId = new Date().getTime().toString(); //crypto.randomUUID();
    listing.inFlightId = listingId;

    const fileName = fileUtils.getGLBFileName(listing.modelDownloadUrl);

    // Download GLB and add to scene. Mesh representing listing in room now rendered but needs modification.
    const meshes = await SceneLoader.ImportMeshAsync(
      '',
      fileUtils.getGLBFileLocation(listing.modelDownloadUrl),
      fileName, 
      this.scene.cast<Scene>()
    );

    // The first mesh of an imported GLB is not a true mesh, 
    //  it is a transform node that handles the left handed/right handed system conversion.
    // FIXME Can't seem to remove __root__ this way.
    //this.scene.cast<Scene>().getMeshByName('__root__')?.getChildren().forEach((item: Node | TransformNode) => { (item as TransformNode).setParent(null); });

    // https://forum.babylonjs.com/t/removing-root-from-nodes-hierarchy-in-glb-file/28664/2
    // https://forum.babylonjs.com/t/imported-files-taking-objects-out-of-root/32762
    // https://playground.babylonjs.com/#G69660#1
    log.debug('meshes', meshes.meshes);
    const filteredMeshes = meshes.meshes.filter(mesh => mesh.name !== '__root__');
    log.debug('meshes', filteredMeshes[0]);

    // GLB import seems to either have mesh named as Berkeley dataset ID or "RootNode". 
    // We change to our unique room listing ID.
    filteredMeshes[0].name = listingId;

    // The file will have position and possibly orientation data.
    // This data to be used to set position/orientation of mesh representation of listing.
    const meshPositionStateInCm: IExportMeshPositionState = {
      distanceFromRoomOriginInCm: {
        x: importedRoomObject.x,
        y: importedRoomObject.y,
        z: importedRoomObject.z 
      },
      rotationInDegrees: importedRoomObject.orientation || 0
    }

    mesh.setPositionAndOrientationForRoomListingMesh(filteredMeshes[0], meshPositionStateInCm); 

    // FIXME Doesn't seem to do anything?
    filteredMeshes[0].computeWorldMatrix();
  }

  async reset() {
    log.trace('room-configuration-preview reset');

    const meshIDsToIgnore = Array.from(this.meshesToIgnore.keys());
    for (const mesh of this.scene.cast<Scene>().meshes) {
      if (!meshIDsToIgnore.includes(mesh.uniqueId)) { mesh.dispose(); }
    }
  }

  async destroy() {
    log.trace('destroy room-configuration-preview level');
    
    appState.unsubscribe(this.stateSubscriberId);
    appContext.unsubscribe(this.contextSubscriberId);

    this.communicationsManager.destroy();
  }
}