// @license
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
//
// This file is responsible for defining vector operations for this furniture placement algorithm.

// FIXME
// When bundling for web, you need: import * as tsMatrix from 'ts-matrix';
// When bundling for node, you need: import TSMatrix from 'ts-matrix';
// Not sure _why_ this happens! Just swap out the import and replace if needed.
import * as tsMatrix from 'ts-matrix'; // Search and replace: TSMatrix.Vector becomes tsMatrix.Vector
//import TSMatrix from 'ts-matrix'; // Search and replace: tsMatrix.Vector becomes TSMatrix.Vector

import { IVector2D, IVector3D } from '../iface';

export const zero2D = { x: 0, z: 0 };
export const unitX = { x: 1, z: 0 };
export const unitY = { x: 0, z: 1 };

const toLibVector = (appVector: IVector2D | IVector3D): tsMatrix.Vector => {
  const vector = appVector as IVector3D;

  if (!vector.y) { return new tsMatrix.Vector([vector.x, vector.z]); }

  return new tsMatrix.Vector([vector.x, vector.z, vector.y]);
}

const backToAppVector = (libVector: tsMatrix.Vector): IVector2D | IVector3D => {
  if (libVector.length() == 2) { return { x: libVector.at(0), z: libVector.at(1) }; }

  return { x: libVector.at(0), z: libVector.at(1), y: libVector.at(2) };
}

export const length = (vector: IVector2D | IVector3D): number => {
  return toLibVector(vector).length();
}

export const lengthSquared = (vector: IVector2D | IVector3D): number => {
  return toLibVector(vector).squaredLength();
}

export const dot = (left: IVector2D | IVector3D, right: IVector2D | IVector3D): number => {
  return toLibVector(left).dot(toLibVector(right));
}

export const distance = (left: IVector2D | IVector3D, right: IVector2D | IVector3D): number => {
  return toLibVector(left).distanceFrom(toLibVector(right));
}

export const distanceSquared = (left: IVector2D | IVector3D, right: IVector2D | IVector3D): number => {
  return toLibVector(left).subtract(toLibVector(right)).squaredLength();
}

export const normalize = (vector: IVector2D | IVector3D): IVector2D | IVector3D => {
  return backToAppVector(toLibVector(vector).normalize());
}
export const abs = (vector: IVector2D | IVector3D): IVector2D | IVector3D => {
  const appVector = vector as IVector3D;

  if (!appVector.y) { return { x: Math.abs(appVector.x), z: Math.abs(appVector.z) }; }

  return { x: Math.abs(appVector.x), z: Math.abs(appVector.z), y: Math.abs(appVector.y) };
}

export const equalTo = (left: IVector2D, right: IVector2D): boolean => {
  return toLibVector(left).equals(toLibVector(right));
}

export const notEqualTo = (left: IVector2D, right: IVector2D): boolean => {
  return !equalTo(left, right);
}

export const subtract = (left: IVector2D, right: IVector2D): IVector2D => {
  return backToAppVector(toLibVector(left).subtract(toLibVector(right)));
}

export const add = (left: IVector2D, right: IVector2D): IVector2D => {
  return backToAppVector(toLibVector(left).add(toLibVector(right)));
}

export const multiply = (left: IVector2D, right: IVector2D): IVector2D => {
  return backToAppVector(toLibVector(left).multiply(toLibVector(right)));
}

export const scale = (left: number, right: IVector2D): IVector2D => {
  return backToAppVector(toLibVector(right).scale(left));
}

export const divideByVector = (numerator: IVector2D, denominator: IVector2D): IVector2D => {
  return backToAppVector(toLibVector(numerator).divide(toLibVector(denominator)));
}