/**
 * preview-manager.js
 *
 * Ghost (preview) mesh shown on hover before placement.
 * Hover highlight (erase mode).
 * Snap-to-grid math helpers.
 */
import * as THREE from 'three';
import { getShapeType } from './shape-registry.js';
import { scene, raycaster, mouse, drawingPlane } from './three-adapter.js';

let previewGroup, erasePreviewMesh;

// ── Initialise preview group (added once, cleared every frame) ──
export function initPreviewGroup(sceneGraph) {
  previewGroup = new THREE.Group();
  sceneGraph.add(previewGroup);
  return previewGroup;
}

// ── Snap-to-grid math ─────────────────────────────────────────

/**
 * Returns { gridX, gridZ, worldX, worldZ } for a world-space XZ point,
 * clamping to the active grid boundaries. Returns null if outside grid.
 */
export function snapToGridWorld(point) {
  const CELL = 1;
  const halfGrid = (typeof halfGridSize === 'undefined') ? 10 : halfGridSize;
  const N = Math.round(halfGrid / CELL) * 2;
  const gx = Math.floor((point.x + halfGrid) / CELL);
  const gz = Math.floor((point.z + halfGrid) / CELL);
  if (gx < 0 || gx >= N || gz < 0 || gz >= N) return null;
  return {
    gridX: gx,
    gridZ: gz,
    worldX: gx * CELL + CELL / 2 - halfGrid,
    worldZ: gz * CELL + CELL / 2 - halfGrid,
  };
}

/**
 * Returns { vX, vZ, worldX, worldZ } for the nearest grid vertex
 * (point-to-point snapping, used for line / collider vertex placement).
 */
export function snapVertex(point) {
  const CELL = 1;
  const halfGrid = (typeof halfGridSize === 'undefined') ? 10 : halfGridSize;
  const vx = Math.round((point.x + halfGrid) / CELL);
  const vz = Math.round((point.z + halfGrid) / CELL);
  const N  = Math.round(halfGrid / CELL) * 2;
  if (vx < 0 || vx > N || vz < 0 || vz > N) return null;
  return { vX: vx, vZ: vz, worldX: vx * CELL - halfGrid, worldZ: vz * CELL - halfGrid };
}

// ── Ghost preview ────────────────────────────────────────────

/**
 * Build a semi-transparent ghost mesh for `typeId`, placed at worldX/heightY/worldZ.
 * Removes any existing children from previewGroup first.
 */
export function showGhost(typeId, worldX, heightY, worldZ, col = '#3ecfb2') {
  if (!previewGroup) return null;
  while (previewGroup.children.length) previewGroup.remove(previewGroup.children[0]);

  const type = getShapeType(typeId);
  if (!type || !type.createMesh) return null;

  const mesh = type.createMesh(col);
  mesh.traverse(ch => {
    if (!ch.isMesh) return;
    ch.material = ch.material.clone();
    ch.material.transparent = true;
    ch.material.opacity = 0.35;
  });
  mesh.position.set(worldX, heightY, worldZ);
  previewGroup.add(mesh);
  previewGroup.visible = true;
  return mesh;
}

export function hideGhost() {
  if (!previewGroup) return;
  while (previewGroup.children.length) previewGroup.remove(previewGroup.children[0]);
  previewGroup.visible = false;
}

// ── Erase highlight ───────────────────────────────────────────

const ERASE_COLOR = 0xeb4b6e;

/**
 * Sets `mesh` material to a semi-transparent red erase preview.
 * Saves original material on `mesh.userData._origMat` for restore.
 */
export function highlightErase(mesh) {
  if (mesh.userData._origMat) return;  // already highlighted
  const orig = mesh.material;
  const erase = new THREE.MeshStandardMaterial({
    color: new THREE.Color(ERASE_COLOR),
    emissive: new THREE.Color(0x3a1018),
    transparent: true, opacity: 0.65,
  });
  mesh.userData._origMat = orig;
  mesh.material = erase;
}

/** Restore original material after erase highlight */
export function clearEraseHighlight(mesh) {
  if (mesh.userData._origMat) {
    mesh.material = mesh.userData._origMat;
    delete mesh.userData._origMat;
  }
}

export function clearAllEraseHighlights(objects) {
  objects.forEach(clearEraseHighlight);
}
