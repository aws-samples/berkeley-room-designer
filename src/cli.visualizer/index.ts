// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for visualizing sampled data that the furniture placement algorithms output.
// It's just a quick and dirty nodegui app.
import * as log from 'ts-app-logger';
log.configure({ traceEnabled: false, debugEnabled: true, filters: []});

//import * as path from 'node:path';
import { QMainWindow, WidgetEventTypes, AlignmentFlag, Orientation, QWidget, QLabel, QPushButton, QPixmap, QSlider, QBoxLayout, Direction } from '@nodegui/nodegui';
import sourceMapSupport from 'source-map-support';

import { VisualizerServer, IMessage } from './ipc';

sourceMapSupport.install();

const main = async () => {
  const objectPrefix = 'visualizer';

  const window = new QMainWindow();

  const width = 800, height = 800;

  let displayRenderNumber = 0, messageCount = 0;
  const messageCountLabel = new QLabel();
  const messageCountLabelName = `${objectPrefix}-message-count`;
  messageCountLabel.setObjectName(messageCountLabelName);
  messageCountLabel.setText(messageCount);
  
  const image = new QPixmap();
  const displayedRender = new QLabel();
  const slider = new QSlider();

  let renderedSomething = false;

  const loadRender = (renderNumber: number) => {
    log.debug('loadRender', renderNumber);
  
    const imagePath = `${process.cwd()}/build-utils/renders/${renderNumber}.png`;

    loadRenderFromPath(imagePath, renderNumber);
  }

  const loadRenderFromPath = (imagePath: string, renderNumber: number) => {
    log.debug('imagePath', imagePath);
  
    image.load(imagePath);

    displayedRender.setPixmap(image);
    displayedRender.setAlignment(AlignmentFlag.AlignCenter);

    displayRenderNumber = renderNumber;

    log.debug('displayRenderNumber', displayRenderNumber);
  }

  const onData = (message: IMessage) => {
    log.trace('message', message);

    if (!renderedSomething) {
      log.debug('display initial message');

      loadRenderFromPath((message.data as string), 0);
    
      renderedSomething = true;
    }

    messageCount++;
    messageCountLabel.setText(messageCount);
    
    slider.setMaximum(messageCount);
  }

  const visualizerServer = new VisualizerServer();
  await visualizerServer.init({ onData });

  const rootLayout = new QBoxLayout(Direction.TopToBottom);

  const centralWidget = new QWidget();
  const mainWidgetName = `${objectPrefix}-main`;
  centralWidget.setObjectName(mainWidgetName);

  const navContainerName = `${objectPrefix}-nav-container`;
  const navContainer = new QBoxLayout(Direction.LeftToRight);
  navContainer.setObjectName(navContainerName);

  const renderContainerName = `${objectPrefix}-render-container`;
  const renderContainer = new QBoxLayout(Direction.TopToBottom);
  renderContainer.setObjectName(renderContainerName);

  const controlsContainerName = `${objectPrefix}-controls-container`;
  const controlsContainer = new QBoxLayout(Direction.LeftToRight);
  controlsContainer.setObjectName(controlsContainerName);

  const sliderName = `${objectPrefix}-slider`;
  slider.setOrientation(Orientation.Horizontal);
  slider.setObjectName(sliderName);
  slider.setMinimum(0);
  slider.setValue(0);
  slider.setMaximum(10);
  slider.setDisabled(true);

  const backButton = new QPushButton();
  const backButtonName = `${objectPrefix}-back-button`;
  backButton.setObjectName(backButtonName);
  backButton.setText('⏮');

  const forwardButton = new QPushButton();
  const forwardButtonName = `${objectPrefix}-forward-button`;
  forwardButton.setObjectName(forwardButtonName);
  forwardButton.setText('⏭');

  // Events:
  slider.addEventListener('valueChanged', (value: number) => {
    log.debug('slider valueChanged');

    loadRender(value);
  });

  backButton.addEventListener('pressed', () => {
    const previousRenderNumber = displayRenderNumber - 1;

    log.debug('backButton pressed', 'previousRenderNumber', previousRenderNumber);

    if (previousRenderNumber < 0) { return; }

    loadRender(previousRenderNumber);

    slider.setValue(previousRenderNumber);
  });

  forwardButton.addEventListener('pressed', () => {
    const nextRenderNumber = displayRenderNumber + 1;

    log.debug('forwardButton pressed', 'nextRenderNumber', nextRenderNumber);
    
    if (nextRenderNumber >= messageCount) { return; }

    loadRender(nextRenderNumber);

    slider.setValue(nextRenderNumber);
  });

  window.addEventListener(WidgetEventTypes.KeyRelease, (key) => {
    log.debug('key pressed', key);
  });

  // Actual GUI layout:
  centralWidget.setLayout(rootLayout);

  navContainer.addWidget(messageCountLabel);

  renderContainer.addWidget(displayedRender);
  renderContainer.addWidget(slider);

  controlsContainer.addWidget(backButton);
  controlsContainer.addWidget(forwardButton);

  rootLayout.addLayout(navContainer);
  rootLayout.addLayout(renderContainer);
  rootLayout.addLayout(controlsContainer);

  window.resize(width, height);
  window.setMinimumSize(width, height);

  window.setCentralWidget(centralWidget);
  window.setStyleSheet(
  `
    #${mainWidgetName} {
      border: 5px solid black;
      background-color: #009688;
      height: '100%';
      align-items: 'center';
      justify-content: 'center';
    }
    
    #${navContainerName} {
      border: 1px solid black;
    }
    #${messageCountLabelName} {
      border: 1px solid black;
      width: 33%;
      height: 10%;
      color: yellow;
    }

    #${renderContainerName} {
      border: 1px solid black;
    }
    #${displayedRender} {
      border: 1px solid black;
      background-color: yellow;
    }

    #${controlsContainerName} {
      border: 1px solid black;
    }
    #${sliderName} {
      border: 1px solid black;
      background-color: green;
    }
    #${backButtonName} {
      border: 1px solid black;
      background-color: red;
    }
    #${forwardButtonName} {
      border: 1px solid black;
      background-color: blue;
    }
  `
  );
  window.show();

  (global as any).win = window;
}

(async () => { await main(); })();