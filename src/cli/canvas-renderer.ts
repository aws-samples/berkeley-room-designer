// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for rendering visuals to help in debugging furniture placement algorithms.
import * as log from 'ts-app-logger';

import { promises as fs } from 'fs';
import * as fabric from 'fabric/node';

import { IFittingLayout } from '../frontend/furniture-placement/autointeriorblog/iface';
import { ISimpleRoomDescription } from '../frontend/furniture-placement/iface';
import { IRoomConfiguration } from '../frontend/room-designer/iface';

export class CanvasRenderer {
  private canvas: fabric.StaticCanvas;
  private renders = 0;
  private renderCount = 0;
  private renderQueue: IFrame[] = [];
  private readonly width = 800;
  private readonly height = 800;
  private readonly pixelsPerMeter = 150;
  private rendering = false;
  private onRendered?: CallableFunction;
  private roomDescription?: ISimpleRoomDescription;

  constructor() {
    this.canvas = new fabric.StaticCanvas(null!, { 
      width: this.width, 
      height: this.height, 
      backgroundColor: '#000000', 
      imageSmoothingEnabled: true 
    });

    setInterval(() => { this.loopRenderQueue(); }, 1000);
  }

  async loopRenderQueue() {
    if (this.rendering) { return; } // Ignore, we don't care.

    this.rendering = true;

    for (const frame of this.renderQueue) {
      this.renderCount++;

      this.canvas.clear();

      this.renderAxes();

      if (this.roomDescription) { this.renderRoomDescription(this.roomDescription); }

      // FIXME Better runtime type casting.
      if ((frame.objectToVisualize as ISimpleRoomDescription).roomCategory) { 
        this.renderRoomDescription(frame.objectToVisualize as ISimpleRoomDescription); 
      }
      if ((frame.objectToVisualize as IFittingLayout).placedFittings) { 
        this.renderFittingLayout(frame.objectToVisualize as IFittingLayout); 
      }
      if ((frame.objectToVisualize as IRoomConfiguration).id) { 
        this.renderRoomConfiguration(frame.objectToVisualize as IRoomConfiguration); 
      }
      
      this.canvas.renderAll();
      
      const data = await this.frameToPNG();

      const renderPath = `${process.cwd()}/build-utils/renders/${this.renders}.png`;

      await fs.writeFile(renderPath, data);
      
      this.renders++;

      if (this.onRendered) { this.onRendered(renderPath, frame.name); }
    }

    this.renderQueue = [];

    this.rendering = false;
  }

  private renderAxes() {
    const xAxes = new fabric.Line([0, this.height / 2, this.width, this.height / 2], {
      stroke: 'green'
    });
    this.canvas.add(xAxes);

    const yAxes = new fabric.Line([this.width / 2, 0, this.width / 2, this.height], {
      stroke: 'green'
    });
    this.canvas.add(yAxes);
  }

  private async renderRoomDescription(roomDescription: ISimpleRoomDescription) {
    log.trace('CanvasRenderer.renderRoomDescription');

    const roomWidth = roomDescription.widthInMeters * this.pixelsPerMeter;
    const roomDepth = roomDescription.depthInMeters * this.pixelsPerMeter;
    const halfRoomWidth = roomWidth / 2;
    const halfRoomDepth = roomDepth / 2;

    log.debug('roomDescription', roomDescription);

    // For coordinate examples see: http://fabricjs.com/test/misc/origin.html, https://jsfiddle.net/1ow02gea/244/
    const rect = new fabric.Rect({ 
      left: (this.width / 2) - halfRoomWidth, // Starting drawing point is from bottom left of rect.
      top: (this.height / 2) + halfRoomDepth,
      originX: 'left',
      originY: 'bottom', 
      fill: '#eef', 
      width: roomWidth, 
      height: roomDepth
    });
    this.canvas.add(rect);

    const text = new fabric.Text(roomDescription.roomCategory, {
      left: this.width / 2,
      top: this.height / 2,
      originX: 'left',
      originY: 'bottom', 
      fill: 'black'
    });
    this.canvas.add(text);
  }
  
  private renderFittingLayout(fittingLayout: IFittingLayout) {
    log.trace('CanvasRenderer.renderFittingLayout');

    log.debug(fittingLayout.room);

    const roomWidth = fittingLayout.room.description.widthInMeters * this.pixelsPerMeter;
    const roomDepth = fittingLayout.room.description.depthInMeters * this.pixelsPerMeter;
    const halfRoomWidth = roomWidth / 2;
    const halfRoomDepth = roomDepth / 2;

    fittingLayout.placedFittings.forEach(placedFitting => {
      log.debug(placedFitting.fittingModel.listing.id, placedFitting);

      const widthBtCanvasEdgeAndRoom = (this.width / 2) - halfRoomWidth;
      const depthBtCanvasEdgeAndRoom = (this.height / 2) - halfRoomDepth;

      const placedFittingWidth = placedFitting.fittingModel.boundingBox.width * this.pixelsPerMeter;
      const placedFittingDepth = placedFitting.fittingModel.boundingBox.depth * this.pixelsPerMeter;
      const halfPlacedFittingWidth = placedFittingWidth / 2;
      const halfPlacedFittingDepth = placedFittingDepth / 2;

      // Translate origin-based position from algorithm to fabric's drawing start point.

      const xInPixels = placedFitting.position.x * this.pixelsPerMeter;
      const yInPixels = placedFitting.position.z * this.pixelsPerMeter;

      let left = 0;
      if (placedFitting.position.x < 0) {
        left = widthBtCanvasEdgeAndRoom + halfRoomWidth - Math.abs(xInPixels) - halfPlacedFittingWidth;
      } else if (placedFitting.position.x === 0) {
        left = (this.width / 2) - halfPlacedFittingWidth;
      } else {
        left = widthBtCanvasEdgeAndRoom + halfRoomWidth + (xInPixels - halfPlacedFittingWidth);
      }

      let top = 0;
      if (placedFitting.position.z < 0) {
        top = depthBtCanvasEdgeAndRoom + halfRoomDepth + (Math.abs(yInPixels) - halfPlacedFittingDepth);
      } else if (placedFitting.position.z === 0) {
        top = (this.height / 2) + halfPlacedFittingDepth;
      } else {
        top = depthBtCanvasEdgeAndRoom + halfRoomDepth - yInPixels - halfPlacedFittingWidth;
      }

      log.debug('xInPixels', xInPixels, 'yInPixels', yInPixels, 'left', left, 'top', top);

      const rect = new fabric.Rect({ 
        left,
        top,
        originX: 'left',
        originY: 'bottom', 
        fill: 'green', 
        width: placedFittingWidth, 
        height: placedFittingDepth
      });
      this.canvas.add(rect);

      const text = new fabric.Text(placedFitting.fittingModel.fittingCategory, {
        left,
        top,
        originX: 'left',
        originY: 'bottom', 
        fill: 'black'
      });
      this.canvas.add(text);
    });
  }

  private renderRoomConfiguration(roomConfiguration: IRoomConfiguration) {
    log.trace('CanvasRenderer.renderRoomConfiguration');

    log.debug(roomConfiguration);

    const roomWidth = roomConfiguration.area_size_x * this.pixelsPerMeter;
    const roomDepth = roomConfiguration.area_size_z * this.pixelsPerMeter;
    const halfRoomWidth = roomWidth / 2;
    const halfRoomDepth = roomDepth / 2;

    roomConfiguration.objects.forEach(roomObject => {
      log.debug(roomObject.id, roomObject);

      const widthBtCanvasEdgeAndRoom = (this.width / 2) - halfRoomWidth;
      const depthBtCanvasEdgeAndRoom = (this.height / 2) - halfRoomDepth;

      // Room configurations don't necessarily need a model id and therefore dimensions associated with them at the moment.
      // This makes it difficult to draw them. 
      // So, just choose an arbitrary width.
      const placedFittingWidth = .3 * this.pixelsPerMeter;
      const placedFittingDepth = .3 * this.pixelsPerMeter;
      const halfPlacedFittingWidth = placedFittingWidth / 2;
      const halfPlacedFittingDepth = placedFittingDepth / 2;

      // Translate origin-based position from algorithm to fabric's drawing start point.

      const xInPixels = roomObject.x * this.pixelsPerMeter;
      const yInPixels = roomObject.z * this.pixelsPerMeter;

      let left = 0;
      if (roomObject.x < 0) {
        left = widthBtCanvasEdgeAndRoom + halfRoomWidth - Math.abs(xInPixels) - halfPlacedFittingWidth;
      } else if (roomObject.x === 0) {
        left = (this.width / 2) - halfPlacedFittingWidth;
      } else {
        left = widthBtCanvasEdgeAndRoom + halfRoomWidth + (xInPixels - halfPlacedFittingWidth);
      }

      let top = 0;
      if (roomObject.z < 0) {
        top = depthBtCanvasEdgeAndRoom + halfRoomDepth + (Math.abs(yInPixels) - halfPlacedFittingDepth);
      } else if (roomObject.z === 0) {
        top = (this.height / 2) + halfPlacedFittingDepth;
      } else {
        top = depthBtCanvasEdgeAndRoom + halfRoomDepth - yInPixels - halfPlacedFittingWidth;
      }

      log.debug('xInPixels', xInPixels, 'yInPixels', yInPixels, 'left', left, 'top', top);

      const rect = new fabric.Rect({ 
        left,
        top,
        originX: 'left',
        originY: 'bottom', 
        fill: 'green', 
        width: placedFittingWidth, 
        height: placedFittingDepth
      });
      this.canvas.add(rect);

      const text = new fabric.Text(roomObject.category, {
        left,
        top,
        originX: 'left',
        originY: 'bottom', 
        fill: 'black'
      });
      this.canvas.add(text);
    });
  }

  private async frameToPNG(): Promise<Buffer> {
    this.canvas.getContext();
    const dataURL = this.canvas.toDataURL({ format: 'png', quality: 1, multiplier: 1 });
    const data = atob(dataURL.substring('data:image/png;base64,'.length)),
    asArray = new Uint8Array(data.length);

    for(let i = 0, len = data.length; i < len; ++i) {
      asArray[i] = data.charCodeAt(i);    
    }

    const blob = new Blob( [ asArray.buffer ], {type: 'image/png'} );

    const buffer = Buffer.from(await blob.arrayBuffer());

    return buffer;
	}

  init(onRendered: CallableFunction) { this.onRendered = onRendered; }

  queueRender(objectToVisualize: ISimpleRoomDescription | IFittingLayout | IRoomConfiguration, name: string) {
    log.trace('CanvasRenderer.queueRender', name, 'renderQueue', this.renderQueue.length);
    
    this.renderQueue.push({ objectToVisualize, name });
  }
}

interface IFrame {
  objectToVisualize: ISimpleRoomDescription | IFittingLayout | IRoomConfiguration;
  name: string;
}