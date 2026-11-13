/**
 * mouse-adapter.js
 *
 * Holds the shared raycaster + mouse vector used across all interaction modules.
 * Both app.js and drawing.js import these — no circular dependency.
 */
import { camera, scene, drawingPlane } from './three-adapter.js';

import * as THREE from 'three';

export const mouse      = new THREE.Vector2();
export const raycaster  = new THREE.Raycaster();

/** Update the mouse vector from a DOM event relative to `container` */
export function updateMouseFromEvent(e, container) {
  const rect = container.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
}

/** Returns intersects with `drawingPlane` (queryset) */
export function intersectPlane(recursive = false) {
  return raycaster.intersectObject(drawingPlane, recursive);
}

/** Returns intersects with all placed objects */
export function intersectPlaced(objects) {
  return raycaster.intersectObjects(objects, false);
}
