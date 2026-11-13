/**
 * drawing.js
 *
 * Drawing interaction logic — called from app.js mouse events.
 *
 * Handles:
 *   • Hover ghost preview for all shape types
 *   • Click-to-place or toggle shapes on the grid
 *   • Erase-tool hover highlighting and click removal
 *   • Collider face toggle (top / left / right)
 *   • Point-to-point line collider drawing
 *   • Height-layer support
 */

import { getShapeType } from './shape-registry.js';
import { hideGhost, snapToGridWorld, showGhost, snapVertex, highlightErase, clearEraseHighlight, clearAllEraseHighlights } from './preview-manager.js';
import {
  hideColliderPreview, showColliderPreview, placeOrToggle, buildVertexNode,
} from './collider-manager.js';
import { drawingPlane, scene, camera } from './three-adapter.js';
import { createMaterialInstance, getActiveMaterial } from './material-manager.js';
import { raycaster } from './mouse-adapter.js';
import * as THREE from 'three';

/* ═══════════════════════════════════════════════════════════════════ */
/* APPLICATION STATE                                                   */
/* ═══════════════════════════════════════════════════════════════════ */

const CELL_SIZE   = 1;

// managed by app.js via setPlacedMap(placedCubes)
let placed       = new Map();      // "gx,heightIdx,gz"  →  THREE.Mesh

let activeTool      = 'cube-solid';
let activeLayer     = 'cube';      // 'cube' | 'collider'
let activeHeightIdx = 0;
let _lineStartNd   = null;        // first vertex for col-line tool
let _colA          = '#3ecfb2';   // current top colour
let _selectedMesh  = null;        // currently selected object for material editing
let _eraseTarget   = null;        // current hover-erase target
let _brushSize     = 1;           // 1, 3, or 5 cell square brush

/* ── Allow app.js to push state changes ────────────────────── */
export function setActiveTool(id)     { activeTool  = id;           }
export function setActiveLayer(name)  { activeLayer = name;          }
export function setHeightIdx(n)       { activeHeightIdx = n;         }
export function setPlacedMap(m)       { placed = m;                  }
export function setColA(c)            { _colA = c;                   }
export function setBrushSize(n)       { _brushSize = Math.max(1, Math.min(5, n | 0)); }
export function selectMesh(m)         { _selectedMesh = m;           }
export function deselectMesh()        { _selectedMesh = null;        }
export function getSelectedMesh()     { return _selectedMesh;        }

export function getActiveTool()      { return activeTool;             }
export function getActiveLayer()     { return activeLayer;            }
export function getHeightIdx()       { return activeHeightIdx;        }
export function getPlacedMap()       { return placed;                 }

/** Place the active shape at a grid cell (used by the 2D canvas view). */
export function placeShapeAtGrid(gx, gz) {
  const half = window.halfGridSize || 10;
  const worldX = gx * CELL_SIZE + CELL_SIZE / 2 - half;
  const worldZ = gz * CELL_SIZE + CELL_SIZE / 2 - half;
  _placeShape(gx, activeHeightIdx, gz, worldX, worldZ);
}

/** Erase the object at a grid cell (used by the 2D canvas view). */
export function eraseAtGrid(gx, gz) {
  const radius = Math.floor(_brushSize / 2);
  for (let dx = -radius; dx <= radius; dx++) {
    for (let dz = -radius; dz <= radius; dz++) {
      const key = `${gx + dx},${activeHeightIdx},${gz + dz}`;
      const old = placed.get(key);
      if (!old) continue;
      if (_selectedMesh === old) deselectMesh();
      scene.remove(old);
      placed.delete(key);
    }
  }
}

/* ═══════════════════════════════════════════════════════════════════ */
/* HOVER PREVIEW (called every mousemove by app.js)                   */
/* ═══════════════════════════════════════════════════════════════════ */

export function handleHover(viewportEl) {
  if (!drawingPlane) return;
  const hits = raycaster.intersectObject(drawingPlane, true);
  if (!hits.length) { hideGhost(); hideColliderPreview(scene); clearAllEraseHighlights([...placed.values()]); _eraseTarget = null; return; }

  if (activeTool === 'move' || activeTool === 'select') {
    hideGhost();
    return;
  }

  if (activeTool === 'erase') {
    hideGhost();
    clearAllEraseHighlights([...placed.values()]);
    const targets = [...placed.values()];
    const hh = raycaster.intersectObjects(targets, false);
    if (hh.length) {
      _eraseTarget = hh[0].object;
      highlightErase(_eraseTarget);
    } else {
      _eraseTarget = null;
    }
    return;
  }

  if (activeTool.startsWith('col-')) {
    hideGhost();
    if (activeTool === 'col-line') return _hoverLineVertex(hits[0].point);
    return _hoverColliderFace(hits[0].point);
  }

  // Shape ghost
  const gd  = snapToGridWorld(hits[0].point);
  if (!gd) { hideGhost(); return; }
  const hy = activeHeightIdx * CELL_SIZE;
  showGhost(activeTool, gd.worldX, hy + CELL_SIZE / 2, gd.worldZ, _colA);
}

/* ═══════════════════════════════════════════════════════════════════ */
/* CLICK HANDLER (called from app.js onMouseDown)                     */
/* ═══════════════════════════════════════════════════════════════════ */

export function handleClick(viewportEl) {
  if (!drawingPlane) return;
  const hits = raycaster.intersectObject(drawingPlane, true);
  if (!hits.length) { hideGhost(); return; }

  if (activeTool === 'move' || activeTool === 'select') {
    return;
  }

  if (activeTool === 'erase')      { _eraseAtHit(hits[0]);  return; }
  if (activeTool === 'col-line')    { _placeLineVertex(hits[0].point); return; }
  if (activeTool === 'col-top' || activeTool === 'col-left' || activeTool === 'col-right') {
    _placeColliderFace(hits[0].point);
    return;
  }

  // shape placement / toggle
  const gd = snapToGridWorld(hits[0].point);
  if (!gd) { hideGhost(); return; }
  _placeShape(gd.gridX, activeHeightIdx, gd.gridZ, gd.worldX, gd.worldZ);
}

/* ═══════════════════════════════════════════════════════════════════ */
/* PRIVATE — SHAPE PLACEMENT                                           */
/* ═══════════════════════════════════════════════════════════════════ */

function _placeShape(gx, heightIdx, gz, worldX, worldZ) {
  const type = getShapeType(activeTool);
  if (!type) return;

  const radius = Math.floor(_brushSize / 2);
  const N = window.GRID_N || 20;
  const centerKey = `${gx},${heightIdx},${gz}`;
  const eraseMode = placed.has(centerKey);
  const hy = heightIdx * CELL_SIZE + (type.getMeshHeight?.() ?? CELL_SIZE / 2);
  let lastMesh = null;

  for (let dx = -radius; dx <= radius; dx++) {
    for (let dz = -radius; dz <= radius; dz++) {
      const cx = gx + dx;
      const cz = gz + dz;
      if (cx < 0 || cx >= N || cz < 0 || cz >= N) continue;

      const key = `${cx},${heightIdx},${cz}`;
      if (eraseMode) {
        const old = placed.get(key);
        if (!old) continue;
        if (_selectedMesh === old) deselectMesh();
        scene.remove(old);
        placed.delete(key);
        continue;
      }

      if (placed.has(key)) continue;

      const material = getActiveMaterial()?.clone() ?? createMaterialInstance(activeTool);
      const mesh = type.createMesh(material);
      mesh.position.set(worldX + dx * CELL_SIZE, hy, worldZ + dz * CELL_SIZE);
      mesh.userData = { key, heightIdx, shapeTypeId: type.id, zindex: 0 };
      scene.add(mesh);
      placed.set(key, mesh);
      lastMesh = mesh;
    }
  }

  if (lastMesh) selectMesh(lastMesh);
}

/* ═══════════════════════════════════════════════════════════════════ */
/* PRIVATE — ERASE                                                     */
/* ═══════════════════════════════════════════════════════════════════ */

// Return first non-preview placed object under the raycaster.
function _getEraseTarget() {
  const targets = [...placed.values()];
  const hits = raycaster.intersectObjects(targets, false);
  return hits.length ? hits[0].object : null;
}

function _eraseAtHit(hitObject) {
  const obj = _getEraseTarget();
  if (!obj) return;
  const key = obj.userData?.key;
  if (!key) return;
  const [gx, h, gz] = key.split(',').map(Number);
  const radius = Math.floor(_brushSize / 2);
  for (let dx = -radius; dx <= radius; dx++) {
    for (let dz = -radius; dz <= radius; dz++) {
      const k = `${gx + dx},${h},${gz + dz}`;
      const m = placed.get(k);
      if (!m) continue;
      if (_selectedMesh === m) deselectMesh();
      scene.remove(m);
      placed.delete(k);
    }
  }
}

/* ═══════════════════════════════════════════════════════════════════ */
/* PRIVATE — COLLIDER FACE TOGGLE                                      */
/* ═══════════════════════════════════════════════════════════════════ */

function _placeColliderFace(hitPoint) {
  const gd  = snapToGridWorld(hitPoint);
  if (!gd) return;
  placeOrToggle(activeTool.replace('col-', ''), gd.gridX, 0, gd.gridZ, activeHeightIdx, scene);
}

function _hoverColliderFace(hitPoint) {
  const gd  = snapToGridWorld(hitPoint);
  if (!gd) { hideColliderPreview(scene); return; }
  const sub = activeTool.replace('col-', '');
  hideColliderPreview(scene);
  showColliderPreview(sub, gd.gridX, 0, gd.gridZ, activeHeightIdx, scene);
}

/* ═══════════════════════════════════════════════════════════════════ */
/* PRIVATE — LINE COLLIDER (point-to-point)                            */
/* ═══════════════════════════════════════════════════════════════════ */

function _placeLineVertex(worldPt) {
  const nd  = _snapVertex(worldPt);
  if (!nd) return;
  const hy  = activeHeightIdx * CELL_SIZE + CELL_SIZE;

  if (!_lineStartNd) {
    _lineStartNd = nd;
  } else {
    const p1  = new THREE.Vector3(_lineStartNd.worldX, hy, _lineStartNd.worldZ);
    const p2  = new THREE.Vector3(nd.worldX,           hy, nd.worldZ);
    const ln  = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([p1, p2]),
      new THREE.LineBasicMaterial({ color: 0xffffff })
    );
    const jMat = new THREE.MeshBasicMaterial({ color: 0x3ecfb2 });
    ln.add(_makeJoint(p1, jMat), _makeJoint(p2, jMat));
    ln.userData = { type: 'line', x1: _lineStartNd.vX, z1: _lineStartNd.vZ,
                                 x2: nd.vX,           z2: nd.vZ };
    scene.add(ln);
    _lineStartNd = null;
  }
}

function _hoverLineVertex(worldPt) {
  const nd  = _snapVertex(worldPt);
  if (!nd) return;
  const hy  = activeHeightIdx * CELL_SIZE + CELL_SIZE;
  const old = scene.children.find(c => c.userData._previewNode);
  if (old) scene.remove(old);

  const node = buildVertexNode(nd.worldX, hy, nd.worldZ);
  node.userData._previewNode = true;
  scene.add(node);
}

/* ═══════════════════════════════════════════════════════════════════ */
/* HELPERS                                                              */
/* ═══════════════════════════════════════════════════════════════════ */

function _makeJoint(pos, mat) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(CELL_SIZE * 0.08, 8, 8), mat);
  m.position.copy(pos);
  return m;
}

function _snapVertex(pt) { return snapVertex(pt); }
