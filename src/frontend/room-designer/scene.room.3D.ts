// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//

// This file is responsible for defining our room's Babylon scene.
// References:
// * https://github.com/ssatguru/BabylonJS-EditControl-Samples/blob/master/sample-global/src/index.js
// * https://doc.babylonjs.com/guidedLearning/workshop/House_Use
// * https://doc.babylonjs.com/features/featuresDeepDive/mesh/gizmo

// FIXME 
// These need to be imported before scene creation, but we had to place in ts-app-renderer for them to work.
// Do they need to be imported in both places?
import '@babylonjs/loaders/glTF';
import '@babylonjs/core/Materials/standardMaterial';
import '@babylonjs/core/Rendering/boundingBoxRenderer';
import '@babylonjs/core/Engines/Extensions/engine.dynamicTexture';

import * as log from 'ts-app-logger';
import * as renderer from 'ts-app-renderer';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { Color3, Vector3 } from '@babylonjs/core/Maths/math';
import { AxesViewer } from '@babylonjs/core/Debug/axesViewer';
import { Scene } from '@babylonjs/core/scene';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import '@babylonjs/core/Materials/standardMaterial';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
//import { GizmoManager } from '@babylonjs/core/Gizmos/gizmoManager';
//import { DynamicTexture } from '@babylonjs/core';
import { UniversalCamera } from '@babylonjs/core/Cameras/universalCamera';
import * as appRenderer from 'ts-app-renderer';
import * as constants from './constants';
import { CameraView } from './iface';

export default class RoomScene extends renderer.AScene {
  //private gizmoManager?: GizmoManager;
  
  cameraView: CameraView = 'front';
  readonly cameraViewPositions: Map<CameraView, Vector3> = new Map<CameraView, Vector3>([
    ['front', appRenderer.BabylonRenderer.toVector3(constants.defaultCameraPosition)],
    ['back', appRenderer.BabylonRenderer.toVector3(constants.rearCameraPosition)],
    ['left', appRenderer.BabylonRenderer.toVector3(constants.leftCameraPosition)],
    ['right', appRenderer.BabylonRenderer.toVector3(constants.rightCameraPosition)]
  ]);

  constructor(config: renderer.RendererConfig) { super(config); }

  protected override initBabylonScene() {
    super.initBabylonScene();

    this.cast<Scene>().collisionsEnabled = true;

    const boundingBoxColor = Color3.Blue();
    this.cast<Scene>().getBoundingBoxRenderer().frontColor.set(boundingBoxColor.r, boundingBoxColor.g, boundingBoxColor.b);
    this.cast<Scene>().getBoundingBoxRenderer().backColor.set(boundingBoxColor.r, boundingBoxColor.g, boundingBoxColor.b);

    this.addAxes();
    this.addLighting();
    this.addCamera();

    // These are defaults; the room configuration can modify these.
    this.addFloor();

    //this.addGizmoManager();
  }

  private addAxes() {
    new AxesViewer(this.cast<Scene>());
  }

  private addLighting() {
    new HemisphericLight('HemisphericLight', new Vector3(0, 1, 0), this.cast<Scene>());

    const directionalLight = new DirectionalLight('DirectionalLight', new Vector3(0.3, -1, -2), this.cast<Scene>());
    directionalLight.diffuse = Color3.White();
    directionalLight.intensity = 3;
  }

  private addCamera() {
    (this.getRenderer() as appRenderer.BabylonRenderer<UniversalCamera>).camera = new UniversalCamera(
      appRenderer.constants.scene.defaultCameraName, 
      appRenderer.BabylonRenderer.toVector3(constants.defaultCameraPosition), 
      this.cast<Scene>()
    );

    this.cast<Scene>().addCamera((this.getRenderer() as appRenderer.BabylonRenderer<UniversalCamera>).camera);

    (this.getRenderer() as appRenderer.BabylonRenderer<UniversalCamera>).setDefaultCameraTarget(constants.defultCameraTarget);
    (this.getRenderer() as appRenderer.BabylonRenderer<UniversalCamera>).camera.setTarget(Vector3.Zero());

    (this.getRenderer() as appRenderer.BabylonRenderer<UniversalCamera>).camera.inputs.clear();
    (this.getRenderer() as appRenderer.BabylonRenderer<UniversalCamera>).camera.inputs.addKeyboard();
    (this.getRenderer() as appRenderer.BabylonRenderer<UniversalCamera>).camera.inputs.addMouse(true);
    (this.getRenderer() as appRenderer.BabylonRenderer<UniversalCamera>).camera.inputs.addMouseWheel();

    // Make the camera easier to use with touchpad/mouse.
    (this.getRenderer() as appRenderer.BabylonRenderer<UniversalCamera>).camera.speed = 0.5;
    ((this.getRenderer() as appRenderer.BabylonRenderer<UniversalCamera>).camera.inputs.attached.keyboard as any).angularSpeed = .5;
    ((this.getRenderer() as appRenderer.BabylonRenderer<UniversalCamera>).camera.inputs.attached.keyboard as any).rotationSpeed = .5;
    ((this.getRenderer() as appRenderer.BabylonRenderer<UniversalCamera>).camera.inputs.attached.mousewheel as any).wheelPrecision = .5;

    log.debug('controls', (this.getRenderer() as appRenderer.BabylonRenderer<UniversalCamera>).camera.inputs.attached);

    (this.getRenderer() as appRenderer.BabylonRenderer<UniversalCamera>).camera.attachControl(this.getRenderer().getConfig().sceneElement, true);
  }

  private addFloor() {
    const width = 100
    const height = 100
    const subdivisions = 100

    const ground = MeshBuilder.CreateGround('ground', { width, height, subdivisions }, this.cast<Scene>());
    const gridMaterial = new StandardMaterial('grid-material', this.cast<Scene>());
    
    gridMaterial.wireframe = true;
    
    ground.material = gridMaterial;
    ground.updateFacetData();

    /* FIXME Dynamic textures not importing! The goal was to place text at room edges to make it easier to visualize what is the room's "front".
    const textureGround = new DynamicTexture('test floor', { width: constants.roomWidth, height: constants.roomLength }, this.cast<Scene>());   

    const materialGround = new StandardMaterial('test floor material', this.cast<Scene>());    				
    materialGround.diffuseTexture = textureGround;

    var font = 'bold 60px Arial';
    textureGround.drawText('FRONT', 200, 150, font, 'green', 'white', true, true);
    */

    MeshBuilder.CreateGround('floor', { width: constants.roomWidth, height: constants.roomLength }, this.cast<Scene>());
  }

  /* FIXME Gizmos not working.
  private addGizmoManager() {
    this.gizmoManager = new GizmoManager(this.cast<Scene>());
    this.gizmoManager.positionGizmoEnabled = true;
    this.gizmoManager.rotationGizmoEnabled = true;
    this.gizmoManager.scaleGizmoEnabled = false;
    this.gizmoManager.boundingBoxGizmoEnabled = true;
    this.gizmoManager.attachableMeshes = [];
  }
  */

  reset() { // New room, same component.
    log.trace('room-scene reset not implemented');
  }

  destroy() { // Component managing canvas element destroyed. 
    log.trace('destroy room scene');
  }
}