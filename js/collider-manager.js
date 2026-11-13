/**
 * collider-manager.js
 *
 * Manages the four collider face types:
 *   top   — flat rectangle parallel to the ground, centred on the upper face
 *   left  — vertical plane on the left  (±X) side of a grid cell
 *   right — vertical plane on the right (+X) side of a grid cell
 *   line  — point-to-point edge / line element
 *
 * Also owns the erase-mode highlight helpers and the preview-plane ghost.
 */
import * as THREE from 'three';
import { CELL } from './three-adapter.js';
import { getShapeType } from './shape-registry.js';

// ── Materials ─────────────────────────────────────────────────
const FACE_COLOR   = 0x4eff91;
const FACE_OPACITY = 0.18;

const faceMat = new THREE.MeshStandardMaterial({
  color: FACE_COLOR, side: THREE.DoubleSide,
  transparent: true, opacity: FACE_OPACITY, roughness: 0.5,
});
const faceEdgeMat = new THREE.LineBasicMaterial({
  color: FACE_COLOR, transparent: true, opacity: 0.30,
});
const lineMat = new THREE.LineBasicMaterial({
  color: FACE_COLOR, transparent: true, opacity: 0.25, linewidth: 2,
});

// ── Storage ───────────────────────────────────────────────────
let activeColliders = new Map();   // key "gx,gy,gz,type" → THREE.Mesh / THREE.Line
let activeLines     = [];
let previewFace     = null;        // hover preview face
let previewNode     = null;        // vertex sphere preview (line drawing)
let previewLine     = null;        // line preview (line drawing)
let lineStartNode   = null;        // first clicked vertex for line tool

const COLLIDER_TYPES = ['top', 'left', 'right', 'line'];

// ── Public API ─────────────────────────────────────────────────

export function getColliderTypes() { return COLLIDER_TYPES; }

/**
 * Place (or toggle) a collider face at world-grid position gx,gy,gz at heightIndex.
 * Returns the newly placed object, or null if removed.
 */
export function placeOrToggle(type, gx, gy, gz, heightIndex, scene) {
  const hy = heightIndex * CELL;
  const key = `${gx},${gy},${gz},${type}`;
  const existing = activeColliders.get(key);

  if (existing) {
    scene.remove(existing);
    activeColliders.delete(key);
    return null;
  }

  const mesh = _buildCollider(type, gx, hy, gz);
  activeColliders.set(key, mesh);
  scene.add(mesh);
  return mesh;
}

/**
 * Remove collider closest to a world point (used for erase).
 */
export function removeNearestCollider(worldX, worldZ, heightIndex, scene) {
  const gx = Math.floor((worldX + halfGridSize) / CELL);
  const gz = Math.floor((worldZ + halfGridSize) / CELL);
  const hy = heightIndex * CELL;

  for (const [key, mesh] of activeColliders) {
    if (key.endsWith(`,line`)) {
      // skip line entries here; handled in drawing.js
      continue;
    }
    const dx = mesh.position.x - worldX;
    const dy = mesh.position.y - hy;
    const dz = mesh.position.z - worldZ;
    if (Math.abs(dx) < CELL * 0.5 && Math.abs(dz) < CELL * 0.5) {
      scene.remove(mesh);
      activeColliders.delete(key);
      return mesh;
    }
  }
  return null;
}

/** Clear all active colliders from scene */
export function clearAll(scene) {
  activeColliders.forEach((mesh) => scene.remove(mesh));
  activeColliders.clear();
  activeLines.forEach((ln) => scene.remove(ln));
  activeLines.length = 0;
  lineStartNode = null;
}

/** Build preview materials (transparent copies of faceMat) */
function _previewMat(opacity = 0.40) {
  return new THREE.MeshStandardMaterial({
    color: FACE_COLOR, side: THREE.DoubleSide,
    transparent: true, opacity,
  });
}

// ── Preview helpers ──────────────────────────────────────────

/** Show a hover-preview face under the mouse at grid cell (gx,gy,gz) + heightIndex */
export function showPreview(type, gx, gy, gz, heightIndex, scene) {
  hidePreview(scene);
  if (type === 'line') {
    // line preview is handled in preview-manager.js
    return;
  }
  const hy = heightIndex * CELL;
  previewFace = _buildCollider(type, gx, hy, gz, _previewMat(0.38));
  previewFace.userData._isPreview = true;
  scene.add(previewFace);
}

export function hidePreview(scene) {
  if (previewFace && previewFace.parent === scene) scene.remove(previewFace);
  if (previewNode && previewNode.parent === scene) scene.remove(previewNode);
  if (previewLine) previewLine.visible = false;
  previewFace = null;
  previewNode = null;
}

// ── Private geometry builder ──────────────────────────────────

function _faceGeo(w, h) {
  return new THREE.PlaneGeometry(w, h);
}

function _buildCollider(type, gx, hy, gz, mat) {
  const m = mat || faceMat;
  const edge = function(realMesh) {
    return new THREE.LineSegments(new THREE.EdgesGeometry(realMesh.geometry), faceEdgeMat);
  };

  if (type === 'top') {
    const mesh = new THREE.Mesh(_faceGeo(CELL, CELL), m);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(gx * CELL + CELL / 2, hy + CELL, gz * CELL + CELL / 2);
    mesh.add(edge(mesh));
    mesh.userData.colliderType = 'top';
    return mesh;
  }
  if (type === 'left') {
    const mesh = new THREE.Mesh(_faceGeo(CELL, CELL), m);
    mesh.rotation.y = Math.PI / 2;
    mesh.position.set(gx * CELL, hy + CELL / 2, gz * CELL + CELL / 2);
    mesh.add(edge(mesh));
    mesh.userData.colliderType = 'left';
    return mesh;
  }
  if (type === 'right') {
    const mesh = new THREE.Mesh(_faceGeo(CELL, CELL), m);
    mesh.position.set(gx * CELL + CELL, hy + CELL / 2, gz * CELL + CELL / 2);
    mesh.add(edge(mesh));
    mesh.userData.colliderType = 'right';
    return mesh;
  }
  return new THREE.Mesh(new THREE.BufferGeometry(), m);
}

/** Build a white sphere marker for a grid vertex */
export function buildVertexNode(wx, wy, wz) {
  const s = new THREE.Mesh(
    new THREE.SphereGeometry(CELL * 0.08, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  s.position.set(wx, wy, wz);
  return s;
}

/* ── Collider-prefixed aliases (so drawing.js / material-manager.js can import
 *   showColliderPreview / hideColliderPreview consistently) */
export const showColliderPreview = showPreview;
export const hideColliderPreview = hidePreview;
