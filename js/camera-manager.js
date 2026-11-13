/**
 * camera-manager.js
 *
 * Manages 90°-snap isometric camera rotation.
 * Camera position orbits the Y-axis on the x=z 45° diagonal:
 *   0°  →  (14,14,14)  front-right
 *   90° →  (-14,14,14) front-left
 *   180°→  (-14,14,-14)back-left
 *   270°→  (14,14,-14) back-right
 */

import * as THREE from 'three';
import { camera, controls } from './three-adapter.js';

let _angle = 0;
const _orbitDist = 14;   // matches frustumSize in three-adapter.js

export const cameraManager = {
  /** Current snapped angle in degrees (read only) */
  get currentCameraAngle() { return _angle; },

  /** Clockwise 90° increment */
  rotateClockwise() {
    _angle = (_angle + 90) % 360;
    _applyAngle();
  },

  /** Counter-clockwise 90° decrement */
  rotateCounterClockwise() {
    _angle = (_angle - 90 + 360) % 360;
    _applyAngle();
  },

  /** Jump to an arbitrary angle, snapping to the nearest 90° */
  setAngle(deg) {
    _angle = ((deg % 360) + 360) % 360;
    _applyAngle();
  },

  /** Reset to 0° (front-right) */
  reset() { this.setAngle(0); },

  /**
   * Move the camera to a 90° snapped angle from the current camera position.
   * Returns the new angle.
   */
  snapAngle(deg) {
    _angle = Math.round(deg / 90) * 90 % 360;
    _applyAngle();
    return _angle;
  },

  /** Human-readable position string */
  getPositionString() {
    return `X:${camera.position.x.toFixed(1)} Y:${camera.position.y.toFixed(1)} Z:${camera.position.z.toFixed(1)}`;
  },
};

function _applyAngle() {
  // Offset by 45 degrees to get the classic isometric view angles
  const rad = THREE.MathUtils.degToRad(_angle + 45);
  camera.position.set(
    _orbitDist * Math.cos(rad),
    _orbitDist,
    _orbitDist * Math.sin(rad)
  );
  camera.lookAt(0, 0, 0);
  controls.update();
}
