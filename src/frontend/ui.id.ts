// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for generating unique IDs used for DOM elements.
const generateId = () => {
  var arr = new Uint8Array((idLength || 40) / 2);

  window.crypto.getRandomValues(arr);

  return Array.from(arr, dec2hex).join('');
}

const idLength = 10;

const dec2hex = (dec: number) => { return dec.toString(16).padStart(2, '0'); }

export { generateId }