// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for defining our room configuration logic.
import * as log from 'ts-app-logger';
import { IScene, ALevel, BabylonRenderer } from 'ts-app-renderer';
import { SceneLoader } from '@babylonjs/core';
import { Vector3 } from '@babylonjs/core/Maths/math';
import { Scene } from '@babylonjs/core/scene';
import { PointerEventTypes } from '@babylonjs/core/Events/pointerEvents';
import { KeyboardEventTypes } from '@babylonjs/core/Events/keyboardEvents';
import { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh';
import { BoundingInfo } from '@babylonjs/core';
import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera';

import { IAppState, IAppContext } from '../iface';
import { appState } from '../state';
import { appContext } from '../context';
import * as fileUtils from '../utils.file';
import { CommunicationsManager, bus } from '../comms';

import { IListing, IRoomDesignerListing, IMeshPositionState, IRoomObject, CameraView, IExportMeshPositionState } from './iface';
import * as constants from './constants';
import * as roomEvents from './events';
import * as debug from './debug';
import RoomScene from './scene.room.3D';
import * as mesh from './level.3D.mesh';

export default class RoomConfiguration extends ALevel {
  private readonly visible = 1; // Default listing transparency and also used to highlight select listing.
  private readonly lessVisible = .1; // Listing transparency when not selected and there's a selected listing.

  // All the initial scene meshes - floor, etc. - that we should ignore while watching scene for new meshes.
  private meshesToIgnore: Map<number, AbstractMesh> = new Map<number, AbstractMesh>([]);
  
  private selectedRoomListing?: IRoomDesignerListing;
  private cameraView?: CameraView;
  private cameraHeightOffset: number = 0;

  private readonly defaultMeshPositionState: IExportMeshPositionState = {
    distanceFromRoomOriginInCm: { x: 0, y: 0, z: 0 },
    rotationInDegrees: 0
  }
  
  private stateSubscriberId: number = -1;
  private contextSubscriberId: number = -1;

  private communicationsManager: CommunicationsManager;

  constructor(scene: IScene) { 
    super(scene); 

    this.communicationsManager = new CommunicationsManager(window);
  }

  protected override async loadBabylonLevel() {
    this.trackMeshesToIgnore();
    this.useMouseAndKeyboardEvents();
    this.useCameraEvents();
    this.useSelectedListingEvents();
    this.useStateAndContextEvents();
  }

  /*
  private removeBoundingBox(meshForListing: AbstractMesh) {
    meshForListing.showBoundingBox = false;
  }
  */

  private trackMeshesToIgnore() {
    for (const mesh of this.scene.cast<Scene>().meshes) {
      log.debug('tracking mesh to ignore it', mesh.uniqueId, mesh.name);
      
      this.meshesToIgnore.set(mesh.uniqueId, mesh);
    }

    log.debug('meshesToIgnore', this.meshesToIgnore);
  }

  private useMouseAndKeyboardEvents() {
    this.scene.cast<Scene>().onPointerObservable.add((pointerInfo) => {
      switch (pointerInfo.type) {
        case PointerEventTypes.POINTERDOWN:
          log.debug('POINTERDOWN');

          // FIXME Not getting GLB "hit" this way, falling back to keyboard controls.
          if (pointerInfo.pickInfo?.hit) {
            log.debug('hit mesh');
            log.debug(pointerInfo.pickInfo?.pickedMesh?.name);

            // FIXME Set selected listing here.
          }

          break;
      }
    });

    this.scene.cast<Scene>().onKeyboardObservable.add((keyboardInfo) => {
      switch (keyboardInfo.type) {
        case KeyboardEventTypes.KEYDOWN:
          log.debug('KEYDOWN', keyboardInfo.event.key);

          if (keyboardInfo.event.key === 'a' && this.selectedRoomListing !== undefined) {
            switch ((this.scene as RoomScene).cameraView) {
              case 'back': 
                mesh.moveMeshPositiveX(this.getRenderedMeshByRenderId(this.selectedRoomListing?.renderId), this.selectedRoomListing);
                break;
              case 'left': 
                mesh.moveMeshNegativeZ(this.getRenderedMeshByRenderId(this.selectedRoomListing?.renderId), this.selectedRoomListing);
                break;
              case 'right': 
                mesh.moveMeshPositiveZ(this.getRenderedMeshByRenderId(this.selectedRoomListing?.renderId), this.selectedRoomListing);
                break;
              default:
                mesh.moveMeshNegativeX(this.getRenderedMeshByRenderId(this.selectedRoomListing?.renderId), this.selectedRoomListing);
            }
          }

          if (keyboardInfo.event.key === 'd' && this.selectedRoomListing !== undefined) {
            switch ((this.scene as RoomScene).cameraView) {
              case 'back': 
                mesh.moveMeshNegativeX(this.getRenderedMeshByRenderId(this.selectedRoomListing?.renderId), this.selectedRoomListing);
                break;
              case 'left': 
                mesh.moveMeshPositiveZ(this.getRenderedMeshByRenderId(this.selectedRoomListing?.renderId), this.selectedRoomListing);
                break;
              case 'right': 
                mesh.moveMeshNegativeZ(this.getRenderedMeshByRenderId(this.selectedRoomListing?.renderId), this.selectedRoomListing);
                break;
              default:
                mesh.moveMeshPositiveX(this.getRenderedMeshByRenderId(this.selectedRoomListing?.renderId), this.selectedRoomListing);
            }
          }

          if (keyboardInfo.event.key === 'w' && this.selectedRoomListing !== undefined) {
            switch ((this.scene as RoomScene).cameraView) {
              case 'back': 
                mesh.moveMeshPositiveZ(this.getRenderedMeshByRenderId(this.selectedRoomListing?.renderId), this.selectedRoomListing);
                break;
              case 'left': 
                mesh.moveMeshPositiveX(this.getRenderedMeshByRenderId(this.selectedRoomListing?.renderId), this.selectedRoomListing);
                break;
              case 'right': 
                mesh.moveMeshNegativeX(this.getRenderedMeshByRenderId(this.selectedRoomListing?.renderId), this.selectedRoomListing);
                break;
              default:
                mesh.moveMeshNegativeZ(this.getRenderedMeshByRenderId(this.selectedRoomListing?.renderId), this.selectedRoomListing);
            }
          }

          if (keyboardInfo.event.key === 's' && this.selectedRoomListing !== undefined) {
            switch ((this.scene as RoomScene).cameraView) {
              case 'back': 
                mesh.moveMeshNegativeZ(this.getRenderedMeshByRenderId(this.selectedRoomListing?.renderId), this.selectedRoomListing);
                break;
              case 'left': 
                mesh.moveMeshNegativeX(this.getRenderedMeshByRenderId(this.selectedRoomListing?.renderId), this.selectedRoomListing);
                break;
              case 'right': 
                mesh.moveMeshPositiveX(this.getRenderedMeshByRenderId(this.selectedRoomListing?.renderId), this.selectedRoomListing);
                break;
              default:
                mesh.moveMeshPositiveZ(this.getRenderedMeshByRenderId(this.selectedRoomListing?.renderId), this.selectedRoomListing);
            }
          }

          if (keyboardInfo.event.key === 'r' && this.selectedRoomListing !== undefined) {
            log.debug('rotate selected room listing');

            mesh.updateMeshWithModifiedRotation(this.getRenderedMeshByRenderId(this.selectedRoomListing?.renderId), constants.rotationIncrementInDegrees, this.selectedRoomListing);
          }

          break;
      }
    });
  }

  private getRenderedMeshByRenderId(renderId: number): AbstractMesh {
    const meshForListing = this.scene.cast<Scene>().meshes.find(mesh => mesh.uniqueId === renderId);
    if (!meshForListing) { throw Error('Can not find mesh for listing renderId'); }

    return meshForListing;
  }

  private useCameraEvents() {
    this.communicationsManager.addSubscriber(bus.subscribe(roomEvents.centerOnSelectedListing, async (_event) => {
      log.trace(`room-configuration got ${roomEvents.centerOnSelectedListing} event`);

      if (!this.selectedRoomListing) { return; }

      const meshForListing = this.getRenderedMeshByRenderId(this.selectedRoomListing.renderId);

      (this.scene.getRenderer() as BabylonRenderer<UniversalCamera>).camera.position = new Vector3(meshForListing.position.x, constants.cameraHeightInUnits, meshForListing.position.z + constants.cameraDistanceInUnits);
      (this.scene.getRenderer() as BabylonRenderer<UniversalCamera>).camera.setTarget(new Vector3(meshForListing.position.x, meshForListing.position.y, meshForListing.position.z));
    }));
  }

  private useSelectedListingEvents() {
    this.communicationsManager.addSubscriber(bus.subscribe(roomEvents.moveSelectedListingToOrigin, async (_event) => {
      log.trace(`room-configuration got ${roomEvents.moveSelectedListingToOrigin} event`);

      if (!this.selectedRoomListing) { return; }
      
      const meshForListing = this.getRenderedMeshByRenderId(this.selectedRoomListing.renderId);
      meshForListing.position = Vector3.Zero(); // Not handling y at the moment.

      this.selectedRoomListing.meshPositionState.distanceFromRoomOrigin.x = 0;
      this.selectedRoomListing.meshPositionState.distanceFromRoomOrigin.z = 0;

      // Updates our state to reflect scene change.
      appState.upsertRoomListing(this.selectedRoomListing);
    }));

    this.communicationsManager.addSubscriber(bus.subscribe(roomEvents.resetSelectedListingPosition, async (_event) => {
      log.trace(`room-configuration got ${roomEvents.resetSelectedListingPosition} event`);

      if (this.selectedRoomListing?.importedRoomObject) {
        const meshForListing = this.getRenderedMeshByRenderId(this.selectedRoomListing.renderId);

        const meshPositionState = mesh.setPositionAndOrientationForRoomListingMesh(meshForListing, { 
          distanceFromRoomOriginInCm: {
            x: this.selectedRoomListing.importedRoomObject.x,
            y: this.selectedRoomListing.importedRoomObject.y,
            z: this.selectedRoomListing.importedRoomObject.z
          }, 
          rotationInDegrees: this.selectedRoomListing.importedRoomObject.orientation || 0
        });

        // Update room listing's data to reflect what's rendered.
        this.selectedRoomListing.meshPositionState = meshPositionState;

        // Updates our state to reflect scene change.
        appState.upsertRoomListing(this.selectedRoomListing);
      }
    }));
  }

  private async useStateAndContextEvents() {
    this.stateSubscriberId = appState.subscribe((state: IAppState) => {
      log.trace('room-configuration got state update', state);
    });

    this.contextSubscriberId = appContext.subscribe((context: IAppContext) => {
      log.trace('room-configuration got context update', context);

      if (context.cameraView) {
        this.setCameraView(context.cameraView);
      }

      if (context.cameraHeightOffset !== this.cameraHeightOffset) {
        this.changeCameraHeight(context.cameraHeightOffset);
      }

      if (context.selectedRoomListing) {
        this.selectRoomListing(context.selectedRoomListing);
      } else {
        if (this.selectedRoomListing) { this.unselectRoomListing(); }
      }
    });
  }

  private setCameraView(cameraView: CameraView) {
    log.trace('setCameraView', cameraView);

    this.cameraView = cameraView;

    (this.scene as RoomScene).cameraView = this.cameraView;
    log.debug('cameraView', (this.scene as RoomScene).cameraView);

    const desiredCameraPosition = (this.scene as RoomScene).cameraViewPositions.get((this.scene as RoomScene).cameraView);
    if (!desiredCameraPosition) { 
      log.warn('Can not set camera view');

      return;
    }

    const offsetCameraPosition = this.getCameraPositionWithHeightOffset(desiredCameraPosition);

    (this.scene.getRenderer() as BabylonRenderer<UniversalCamera>).camera.position = offsetCameraPosition;
    (this.scene.getRenderer() as BabylonRenderer<UniversalCamera>).camera.setTarget(Vector3.Zero());

    // FIXME Mouse zoom sort of breaks this, maybe try: https://playground.babylonjs.com/#S0KJUA#33
  }

  private getCameraPositionWithHeightOffset(position: Vector3): Vector3 {
    if (!this.cameraHeightOffset || this.cameraHeightOffset === 0) { return position; }

    const newY = position._y + this.cameraHeightOffset;
    
    return new Vector3(position._x, newY, position.z);
  }

  private changeCameraHeight(cameraHeightOffset: number) {
    log.trace('changeCameraHeight', cameraHeightOffset);

    this.cameraHeightOffset = cameraHeightOffset;

    const offsetCameraPosition = this.getCameraPositionWithHeightOffset((this.scene.getRenderer() as BabylonRenderer<UniversalCamera>).camera.position);

    (this.scene.getRenderer() as BabylonRenderer<UniversalCamera>).camera.position = offsetCameraPosition;
  }

  selectRoomListing(roomListing: IRoomDesignerListing) {
    log.trace('selectRoomListing', roomListing);

    this.selectedRoomListing = roomListing;

    // You can select and then select another room listing without unselecting.
    this.setVisibilityOfAllMeshesButSelected(this.lessVisible, this.visible);
  } 

  private setVisibilityOfAllMeshesButSelected(visibility: number, selectedMeshVisiblity?: number) {
    this.scene.cast<Scene>().meshes.forEach(mesh => {
      if (!this.meshesToIgnore.has(mesh.uniqueId) && mesh.uniqueId !== this.selectedRoomListing?.renderId) {
        mesh.visibility = visibility;
      }

      if (selectedMeshVisiblity && mesh.uniqueId === this.selectedRoomListing?.renderId) {
        mesh.visibility = selectedMeshVisiblity;
      }
    });
  } 

  private addBoundingBox(meshForListing: AbstractMesh) {
    const size = meshForListing.getHierarchyBoundingVectors();
    size.min.subtractInPlace(meshForListing.position);
    size.max.subtractInPlace(meshForListing.position);
    
    meshForListing.setBoundingInfo(new BoundingInfo(size.min, size.max));

    meshForListing.showBoundingBox = true;
  }

  unselectRoomListing() {
    log.trace('unselectRoomListing');

    /*
    if (this.selectedRoomListing) {
      const meshForListing = this.getRenderedMeshByRenderId(this.selectedRoomListing.uniqueId);
      this.removeBoundingBox(meshForListing);
    }
    */

    this.selectedRoomListing = undefined;

    this.setVisibilityOfAllMeshesButSelected(this.visible);
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

  async addListingToRoom(listing: IListing, importedRoomObject?: IRoomObject): Promise<IRoomDesignerListing> {
    log.trace('addListingToRoom', listing, importedRoomObject);

    log.info('url', listing.modelDownloadUrl);

    const listingId = new Date().getTime().toString(); //crypto.randomUUID();
    listing.inFlightId = listingId;

    // FIXME Immediately render as box since we know dimensions rather than wait for mesh to download.
    // FIXME Allow user to move this box around as well?
    /* // cm -> inches -> babylonjs units
    const width = (listing.dimensions.width * (1 / constants.cmInInches)) * constants.unitsInInch;
    const height = (listing.dimensions.height * (1 / constants.cmInInches)) * constants.unitsInInch;
    const depth = (listing.dimensions.length * (1 / constants.cmInInches)) * constants.unitsInInch;

    const listingInFlight = MeshBuilder.CreateBox(listingId, { width, depth, height }, this.scene.cast<Scene>());
    this.scene.cast<Scene>().addMesh(listingInFlight);
    */ 

    // Track listing downloading as "in flight" so we can remove the outline when we get full GLB.
    appState.addInFlightRoomListing(listingId);

    const fileName = fileUtils.getGLBFileName(listing.modelDownloadUrl);

    // Download GLB and add to scene. Mesh representing listing in room now rendered but needs modification.
    const meshes = await SceneLoader.ImportMeshAsync(
      '',
      fileUtils.getGLBFileLocation(listing.modelDownloadUrl),
      fileName, 
      this.scene.cast<Scene>()
    );

    appState.removeInFlightRoomListing(listingId);
    
    // The first mesh of an imported GLB is not a true mesh, 
    //  it is a transform node that handles the left handed/right handed system conversion.
    // FIXME can't seem to remove __root__ this way.
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

    // By default mesh is placed at defaultMeshPositionState by renderer without us doing anything,
    //  so setting to defaultMeshPositionState won't visibly do anything - we just need to update state with this info.
    let meshPositionStateInCm: IExportMeshPositionState = this.defaultMeshPositionState;

    // If user "imported room" as YAML, 
    //  the file will have position and possibly orientation data.
    // This data to be used to set position/orientation of mesh representation of listing.
    if (importedRoomObject) {
      meshPositionStateInCm = {
        distanceFromRoomOriginInCm: {
          x: importedRoomObject.x,
          y: importedRoomObject.y,
          z: importedRoomObject.z 
        },
        rotationInDegrees: importedRoomObject.orientation || 0
      }
    }

    return this.onListingDownloadedAndRendered(
      listingId, 
      listing, 
      filteredMeshes[0], 
      meshPositionStateInCm,
      importedRoomObject
    );
  }

  private onListingDownloadedAndRendered(
    listingId: string, 
    listing: IListing, 
    meshForListing: AbstractMesh, 
    meshPositionStateIn: IExportMeshPositionState,
    importedRoomObject?: IRoomObject): IRoomDesignerListing {
    log.trace('onListingDownloadedAndRendered', listing.modelDownloadUrl, meshForListing.uniqueId, meshForListing);

    // If we're currently moving a listing around and all the non-selected listings are less visible,
    //  temporarily make the newly downloaded and rendered listing more visible so the user is aware.
    setTimeout(() => { 
      if (this.selectedRoomListing) { meshForListing.visibility = this.lessVisible; }
    }, 2 * 1000);

    // FIXME Only selected listing should have bounding box.
    this.addBoundingBox(meshForListing);

    const meshPositionState = mesh.setPositionAndOrientationForRoomListingMesh(meshForListing, meshPositionStateIn); 

    // FIXME Doesn't seem to do anything?
    meshForListing.computeWorldMatrix();

    const roomListing = this.listingToRoomListing(listingId, listing, meshPositionState, importedRoomObject);
    log.debug('updated roomListing', roomListing);

    debug.logListingPosition(meshForListing);
    debug.logListingPosition(meshForListing);
    debug.logListingPosition(meshForListing);

    // FIXME No gizmos show up!
    // Create utility layer the gizmo will be rendered on.
    /*
    const utilityLayer = new UtilityLayerRenderer(this.scene.cast<Scene>());

    // Create the gizmo and attach to the mesh.
    const positionGizmo = new PositionGizmo(utilityLayer);
    positionGizmo.attachedMesh = meshForListing;

    // Keep the gizmo fixed to world rotation.
    positionGizmo.updateGizmoRotationToMatchAttachedMesh = false;
    positionGizmo.updateGizmoPositionToMatchAttachedMesh = true;

    this.addActionManagerToListingMesh(meshForListing);
    */
   
    return roomListing;
  }

  private listingToRoomListing(listingId: string, listing: IListing, meshPositionState: IMeshPositionState, importedRoomObject?: IRoomObject): IRoomDesignerListing {
    log.trace('listingToRoomListing', listingId, listing, Array.from(this.meshesToIgnore.values()), this.scene.cast<Scene>().meshes.map(mesh => mesh.name));

    const existingRoomListing = appState.get().roomListings.find(roomListing => roomListing.id === listingId);

    const mesh = this.scene.cast<Scene>().meshes.find(mesh => mesh.name === listingId);
    if (!mesh) { throw Error(`Mesh for listing not found. Mesh name: ${listingId}, meshes: ${JSON.stringify(this.scene.cast<Scene>().meshes.map(mesh => mesh.name))}`); }

    if (existingRoomListing) {
      existingRoomListing.renderId = mesh.uniqueId;

      log.debug('adjusting renderId for room listing state', existingRoomListing);
  
      appState.upsertRoomListing(existingRoomListing);

      return existingRoomListing;
    }

    const roomListing: IRoomDesignerListing = {
      id: listingId,
      renderId: mesh.uniqueId,
      listing,
      meshPositionState,
      importedRoomObject: importedRoomObject
    };
    log.debug('adding roomListing', roomListing);

    appState.upsertRoomListing(roomListing);

    return roomListing;
  }

  /** 
   * On page initialization (either on reload or on navigation back to), we resume editing WIP room configuration. 
   * This requires download the Berkeley listing models and placing them at previously configured position and orientations.
   * */
  async tryResumeEditingRoomConfiguration(roomListings: IRoomDesignerListing[]) {
    log.trace('tryResumeEditingRoomConfiguration', roomListings);

    appContext.incrementThinkingCount();
    
    for (const roomListing of roomListings) {
      log.debug('downloading room listing', roomListing.id, roomListing.listing.id);

      const fileName = fileUtils.getGLBFileName(roomListing.listing.modelDownloadUrl);

      appContext.incrementDownloadCount();

      const meshes = await SceneLoader.ImportMeshAsync(
        '',
        fileUtils.getGLBFileLocation(roomListing.listing.modelDownloadUrl),
        fileName, 
        this.scene.cast<Scene>()
      );

      appContext.decrementDownloadCount();

      // The first mesh of a gltf loaded file is not a true mesh, 
      //  it is a transform node that handles the left handed/right handed system conversion.
      // FIXME can't seem to remove __root__ this way.
      //this.scene.cast<Scene>().getMeshByName('__root__')?.getChildren().forEach((item: Node | TransformNode) => { (item as TransformNode).setParent(null); });

      // https://forum.babylonjs.com/t/removing-root-from-nodes-hierarchy-in-glb-file/28664/2
      // https://forum.babylonjs.com/t/imported-files-taking-objects-out-of-root/32762
      // https://playground.babylonjs.com/#G69660#1
      log.debug('meshes', meshes.meshes);
      const filteredMeshes = meshes.meshes.filter(mesh => mesh.name !== '__root__');
      log.debug('meshes', filteredMeshes[0]);

      // GLB import seems to either have mesh named as Berkeley dataset ID or "RootNode". 
      // We change to our unique room listing ID.
      filteredMeshes[0].name = roomListing.id;

      const renderedRoomListing = this.onListingDownloadedAndRendered(
        roomListing.id, 
        roomListing.listing,  
        filteredMeshes[0],
        this.defaultMeshPositionState
      );
  
      // Update representive mesh's position and rotation to be what was previosly configured.
      const meshForListing = this.getRenderedMeshByRenderId(renderedRoomListing.renderId);
      meshForListing.position.x = roomListing.meshPositionState.distanceFromRoomOrigin.x;
      meshForListing.position.y = roomListing.meshPositionState.distanceFromRoomOrigin.y;
      meshForListing.position.z = roomListing.meshPositionState.distanceFromRoomOrigin.z;

      mesh.rotateMesh(meshForListing, roomListing.meshPositionState.rotation);
  
      // Updates our state to reflect the new render ID.
      appState.upsertRoomListing(renderedRoomListing);
    }

    appContext.decrementThinkingCount();
  }

  /* FIXME Doesn't seem to do anything? See: https://playground.babylonjs.com/#22NG5C#2
  private addActionManagerToListingMesh(mesh: AbstractMesh) {
    mesh.actionManager = new ActionManager(this.scene.cast<Scene>());
    mesh.actionManager.registerAction(
      new ExecuteCodeAction({
        trigger: ActionManager.OnDoublePickTrigger//,
        //parameter: 'r'
      }, () => { log.debug('mesh double clicked'); }
    ));
  }
  */

  async removeRoomListing(roomListing: IRoomDesignerListing) {
    log.trace('removeRoomListing', roomListing);

    appState.removeRoomListingByRenderId(roomListing.renderId);

    const meshForListing = this.getRenderedMeshByRenderId(roomListing.renderId);
    meshForListing.dispose();

    if (this.selectedRoomListing?.id === roomListing.id) { 
      this.selectedRoomListing = undefined;
      
      this.setVisibilityOfAllMeshesButSelected(this.visible);
    }
  }

  async reset() {
    log.trace('room-configuration reset');

    const meshIDsToIgnore = Array.from(this.meshesToIgnore.keys());
    for (const mesh of this.scene.cast<Scene>().meshes) {
      if (!meshIDsToIgnore.includes(mesh.uniqueId)) { mesh.dispose(); }
    }

    this.selectedRoomListing = undefined;
  }

  async destroy() {
    log.trace('destroy room-configuration level');
    
    appState.unsubscribe(this.stateSubscriberId);
    appContext.unsubscribe(this.contextSubscriberId);

    this.communicationsManager.destroy();
  }
}