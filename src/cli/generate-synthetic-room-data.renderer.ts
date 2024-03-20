#! node
// This file is responsible for rendering images that represent the state of a furniture placement algorithm.
import * as log from 'ts-app-logger';
log.configure({ traceEnabled: false, debugEnabled: true, filters: [] });

import { SyntheticDataGenerationMessengerServer, VisualizerClient } from './generate-synthetic-room-data.renderer.ipc';
import { CanvasRenderer } from './canvas-renderer';
import { IMessage } from '../cli.visualizer/ipc';

const canvasRenderer = new CanvasRenderer();
const syntheticDataGenerationMessengerServer = new SyntheticDataGenerationMessengerServer();
const visualizerClient = new VisualizerClient();

const tryRender = async (message: IMessage) => {
  log.trace('renderer.tryRender', message);

  canvasRenderer.queueRender(message.data, message.name);
}

const onRendered = async (file: string, name: string) => {
  visualizerClient.rendered(file, name);
}

canvasRenderer.init(onRendered);

await syntheticDataGenerationMessengerServer.init({ tryRender });
await visualizerClient.init();