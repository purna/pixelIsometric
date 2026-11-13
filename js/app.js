/**
 * app.js  —  main entry point
 *
 * Cache key / state
 * ├─ Scene, camera, renderer, controls         ← three-adapter.js
 * ├─ Camera 90° snap rotate                    ← camera-manager.js
 * ├─ Shape type registry + factory             ← shape-registry.js
 * ├─ Ghost / erase / snap-to-grid              ← preview-manager.js
 * ├─ Collider face / line                      ← collider-manager.js
 * ├─ Shape-chip bar + palette                  ← material-manager.js
 * ├─ raycaster + mouse (shared)                ← mouse-adapter.js
 * ├─ Drawing interaction logic                 ← drawing.js
 * └─ (this file)  DOM wiring · viewport mouse events · animation loop
 */

import { scene, camera, renderer, controls, drawingPlane, resize, initThree, gridHelper, axesHelper } from './three-adapter.js';
import { cameraManager } from './camera-manager.js';
import { getShapeType, allShapeTypes } from './shape-registry.js';
import {
  initPreviewGroup, hideGhost, snapToGridWorld, showGhost, clearAllEraseHighlights,
} from './preview-manager.js';
import { hideColliderPreview, showColliderPreview, placeOrToggle, buildVertexNode, clearAll as clearColliders } from './collider-manager.js';
import { materialManager, getPrototypeMaterial } from './material-manager.js';
import { mouse, raycaster, updateMouseFromEvent } from './mouse-adapter.js';
import {
  handleHover, handleClick, getPlacedMap, setPlacedMap,
  selectMesh, deselectMesh, getSelectedMesh, setActiveTool, setColA, setBrushSize,
} from './drawing.js';
import { copyCubeMaterialUniforms } from './material-instance.js';
import { init2DView, set2DVisible } from './two-d-view.js';

import * as THREE from 'three';
import { initMaterialEditor, setActiveMaterial as setEditorActiveMaterial } from './material-editor.js';

/* ═══════════════════════════════════════════════════════════════════ */
/* CONSTANTS                                                           */
/* ═══════════════════════════════════════════════════════════════════ */

const CELL_SIZE = 1;
const MAX_HEIGHT = 5;
const GRID_N = window.GRID_N || 20;

/* ═══════════════════════════════════════════════════════════════════ */
/* APPLICATION STATE                                                   */
/* ═══════════════════════════════════════════════════════════════════ */

let activeTool = 'cube-solid';
let activeLayer = 'cube';
let activeHeightIdx = 0;
let placedCubes = new Map();
let viewMode = '3d';

// drag state
let _dragging = false;
let _dragMesh = null;
let _dragStartM = null;
let _dragStartP = null;
let _potentialSelect = null;
let _dragConfirmed = false;

// floating menu state
let _selectedMeshes = [];

// colour palette
let _colA = '#3ecfb2';
let _colB = '#c94b6e';

/* ═══════════════════════════════════════════════════════════════════ */
/* MULTI-SELECT & MOVEMENT HELPERS                                   */
/* ═══════════════════════════════════════════════════════════════════ */

export function setSelectedMeshes(meshes) {
  _selectedMeshes = meshes;
}

export function getSelectedMeshes() {
  return [..._selectedMeshes];
}

export function clearSelectedMeshes() {
  _selectedMeshes = [];
}

export function isMoveToolActive() {
  return activeTool === 'move';
}

export function isSelectToolActive() {
  return activeTool === 'select';
}

/* ═══════════════════════════════════════════════════════════════════ */
/* SHARED SETTERS (called from toolbar buttons + drawing.js)          */
/* ═══════════════════════════════════════════════════════════════════ */

export function setHeightIndex(delta) {
  activeHeightIdx = Math.max(0, Math.min(MAX_HEIGHT, activeHeightIdx + delta));
  return activeHeightIdx;
}

/* ═══════════════════════════════════════════════════════════════════ */
/* BOOTSTRAP                                                            */
/* ═══════════════════════════════════════════════════════════════════ */

function init() {
  const container = document.getElementById('viewport-container') || document.body;
  initThree(container, {});   // must run before any renderer / scene access
  init2DView(container);
  setPlacedMap(placedCubes);
  initPreviewGroup(scene);
  buildObjectTileBar();
  buildSceneToolbar();
  buildColliderButtons();
  initMaterialEditor(() => getPrototypeMaterial(activeTool) || getSelectedMesh()?.material);

  const viewport = document.getElementById('viewport-container');
  if (viewport) {
    viewport.addEventListener('mousedown', onMouseDown, false);
    viewport.addEventListener('mousemove', onMouseMove, false);
    viewport.addEventListener('mouseup', onMouseUp, false);
    viewport.addEventListener('mouseleave', (e) => onMouseUp(e), false);
  }

  document.getElementById('toggle-sidebar-btn').addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    sidebar?.classList.toggle('closed');
    window.dispatchEvent(new Event('resize'));
  });

  document.getElementById('tab-btn-material').addEventListener('click', () => {
    document.getElementById('panel-material-editor')?.classList.add('active');
    document.getElementById('panel-scene-settings')?.classList.remove('active');
    document.getElementById('tab-btn-material')?.classList.add('active');
    document.getElementById('tab-btn-scene')?.classList.remove('active');
  });

  document.getElementById('tab-btn-scene').addEventListener('click', () => {
    document.getElementById('panel-material-editor')?.classList.remove('active');
    document.getElementById('panel-scene-settings')?.classList.add('active');
    document.getElementById('tab-btn-material')?.classList.remove('active');
    document.getElementById('tab-btn-scene')?.classList.add('active');
  });

  window.addEventListener('resize', () => {
    const c = document.getElementById('viewport-container');
    requestAnimationFrame(() => {
      if (c) resize(c);                          // exported by three-adapter
    });
  });

  const info = document.getElementById('info');
  if (info) info.textContent = 'Pixel Isometric — 2D/3D Level Studio';

  buildFloatingMenu();
  setupViewMode();
  setupBrushSize();

  requestAnimationFrame(animate);
}

/* ═══════════════════════════════════════════════════════════════════ */
/* VIEW MODE + BRUSH SIZE                                             */
/* ═══════════════════════════════════════════════════════════════════ */

function setupViewMode() {
  const btn = document.getElementById('btn-mode-toggle');
  btn?.addEventListener('click', () => setViewMode(viewMode === '3d' ? '2d' : '3d'));
}

function setViewMode(mode) {
  viewMode = mode;
  const btn = document.getElementById('btn-mode-toggle');
  if (btn) btn.textContent = mode === '2d' ? '2D' : '3D';

  set2DVisible(mode === '2d');

  if (mode === '2d') {
    camera.position.set(0, 30, 0);
    camera.up.set(0, 0, -1);
    camera.lookAt(0, 0, 0);
    camera.zoom = 0.9;
    controls.enableRotate = false;
    controls.enablePan = true;
  } else {
    camera.position.set(12, 12, 12);
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 0, 0);
    camera.zoom = 1;
    controls.enableRotate = true;
    controls.enablePan = false;
  }
  camera.updateProjectionMatrix();
  controls.target.set(0, 0, 0);
  controls.update();
  const msg = document.getElementById('status-msg');
  if (msg) msg.textContent = mode === '2d'
    ? '2D top-down view — click to paint, scroll to zoom'
    : '3D isometric view — click to paint, right-drag to orbit';
}

function setupBrushSize() {
  const slider = document.getElementById('brush-size');
  const label = document.getElementById('brush-size-label');
  if (!slider) return;
  const apply = () => {
    const size = parseInt(slider.value, 10) || 1;
    setBrushSize(size);
    if (label) label.textContent = size;
  };
  slider.addEventListener('input', apply);
  apply();
}

/* ── Custom tile designer shortcut ── */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-tile-designer')?.addEventListener('click', () => {
    window.open('tools/tilemap-designer/index.html', '_blank', 'noopener');
  });
  document.getElementById('btn-scene-studio')?.addEventListener('click', () => {
    window.open('tools/isometric-scene-studio/index.html', '_blank', 'noopener');
  });
});

document.addEventListener('DOMContentLoaded', init);

/* ═══════════════════════════════════════════════════════════════════ */
/* FLOATING MENU BUILD & HANDLERS                                          */
/* ═══════════════════════════════════════════════════════════════════ */

function buildFloatingMenu() {
  document.getElementById('fm-btn-move')?.addEventListener('click', () => {
    if (isMoveToolActive()) {
      setActiveTool('cube-solid');
      document.getElementById('fm-btn-move')?.classList.remove('active');
      document.getElementById('fm-move-submenu').style.display = 'none';
      document.getElementById('status-msg').textContent = 'Select a shape, then click a cell';
    } else {
      activeTool = 'move';
      setActiveTool('move');
      document.getElementById('fm-btn-move')?.classList.add('active');
      document.getElementById('fm-move-submenu').style.display = 'flex';
      document.getElementById('fm-btn-select')?.classList.remove('active');
      document.getElementById('fm-btn-erase')?.classList.remove('active');
      document.getElementById('status-msg').textContent = 'Move Tool — drag objects or use direction buttons';
    }
  });

  document.getElementById('fm-btn-select')?.addEventListener('click', () => {
    if (isSelectToolActive()) {
      setActiveTool('cube-solid');
      document.getElementById('fm-btn-select')?.classList.remove('active');
      document.getElementById('status-msg').textContent = 'Select a shape, then click a cell';
    } else {
      activeTool = 'select';
      setActiveTool('select');
      document.getElementById('fm-btn-select')?.classList.add('active');
      document.getElementById('fm-btn-move')?.classList.remove('active');
      document.getElementById('fm-btn-erase')?.classList.remove('active');
      document.getElementById('fm-move-submenu').style.display = 'none';
      document.getElementById('status-msg').textContent = 'Select Tool — click objects to select, Shift+click to multi-select';
    }
  });

  document.getElementById('fm-btn-erase')?.addEventListener('click', () => {
    if (activeTool === 'erase') {
      setActiveTool('cube-solid');
      document.getElementById('fm-btn-erase')?.classList.remove('active');
      document.getElementById('status-msg').textContent = 'Select a shape, then click a cell';
    } else {
      activeTool = 'erase';
      setActiveTool('erase');
      document.getElementById('fm-btn-erase')?.classList.add('active');
      document.getElementById('fm-btn-move')?.classList.remove('active');
      document.getElementById('fm-btn-select')?.classList.remove('active');
      document.getElementById('fm-move-submenu').style.display = 'none';
      document.getElementById('status-msg').textContent = 'Erase Tool — hover and click to remove';
    }
  });

  document.getElementById('fm-btn-zoom-in')?.addEventListener('click', () => {
    controls.zoomIn?.(200);
  });

  document.getElementById('fm-btn-zoom-out')?.addEventListener('click', () => {
    controls.zoomOut?.(200);
  });

  document.getElementById('fm-move-up-left')?.addEventListener('click', () => moveObjects(-1, 1));
  document.getElementById('fm-move-up-right')?.addEventListener('click', () => moveObjects(1, 1));
  document.getElementById('fm-move-down-left')?.addEventListener('click', () => moveObjects(-1, -1));
  document.getElementById('fm-move-down-right')?.addEventListener('click', () => moveObjects(1, -1));
}

function moveObjects(dx, dz) {
  const selected = isMoveToolActive() ? getSelectedMeshes() : [...placedCubes.values()].filter(m => m.userData?.selected);
  const toMove = selected.length ? selected : (getSelectedMesh() ? [getSelectedMesh()] : []);
  if (!toMove.length) return;

  const halfGrid = window.halfGridSize || 10;
  const gridSize = CELL_SIZE;

  toMove.forEach(mesh => {
    const key = mesh.userData?.key;
    if (key) {
      placedCubes.delete(key);
    }
    mesh.position.x += dx * gridSize;
    mesh.position.z += dz * gridSize;
    const gx = Math.round((mesh.position.x + halfGrid) / gridSize - 0.5);
    const gz = Math.round((mesh.position.z + halfGrid) / gridSize - 0.5);
    const newKey = `${gx},${mesh.userData.heightIdx},${gz}`;
    mesh.userData.key = newKey;
    placedCubes.set(newKey, mesh);
  });
  const moveBtn = document.getElementById('fm-btn-move');
  moveBtn?.classList.add('active');
  setTimeout(() => moveBtn?.classList.remove('active'), 200);
}

/* ═══════════════════════════════════════════════════════════════════ */
/* ANIMATION LOOP                                                       */
/* ═══════════════════════════════════════════════════════════════════ */

function animate() {
  requestAnimationFrame(animate);
  controls?.update?.();
  renderer.render(scene, camera);
}

/* ═══════════════════════════════════════════════════════════════════ */
/* OBJECT TILE BAR — BUILD group                                       */
/* ═══════════════════════════════════════════════════════════════════ */

function buildObjectTileBar() {
  const bar = document.getElementById('obj-tile-bar');
  if (!bar) return;

  allShapeTypes().forEach(type => {
    const tile = document.createElement('div');
    tile.className = 'obj-tile';
    tile.style.setProperty('--tile-color', type.accentColor || '#3ecfb2');
    const svg = type.iconSVG(type.accentColor || '#3ecfb2');
    tile.innerHTML = `
      <div class="obj-tile-icon">${svg}</div>
      <div class="obj-tile-label">${type.label}</div>`;
    tile.addEventListener('click', () => {
      bar.querySelectorAll('.obj-tile').forEach(t => t.classList.remove('active'));
      tile.classList.add('active');
      activeTool = type.id;
      setActiveTool(type.id);
      document.getElementById('status-msg').textContent =
        `${type.label} — click a cell to place`;
      const prototypeMaterial = getPrototypeMaterial(type.id);
      if (prototypeMaterial) {
        setEditorActiveMaterial(prototypeMaterial);
        const sidebar = document.getElementById('sidebar');
        if (sidebar?.classList.contains('closed')) {
          sidebar.classList.remove('closed');
        }
        document.getElementById('tab-btn-material')?.click();
      }
    });
    bar.appendChild(tile);
  });
}

/* ═══════════════════════════════════════════════════════════════════ */
/* SHAPE CHIP BAR — material types                                     */
/* ═══════════════════════════════════════════════════════════════════ */

function buildSceneToolbar() {
  const bgColorPicker = document.getElementById('scene-bg-color');
  if (bgColorPicker) {
    bgColorPicker.addEventListener('input', e => {
      scene.background = new THREE.Color(e.target.value);
    });
  }

  document.getElementById('toggle-grid-btn')?.addEventListener('click', () => {
    if (gridHelper) gridHelper.visible = !gridHelper.visible;
  });

  document.getElementById('toggle-axes-btn')?.addEventListener('click', () => {
    if (axesHelper) axesHelper.visible = !axesHelper.visible;
  });

  document.getElementById('btn-rot-cw')?.addEventListener('click', () => {
    cameraManager.rotateClockwise();
  });
  document.getElementById('btn-rot-ccw')?.addEventListener('click', () => {
    cameraManager.rotateCounterClockwise();
  });

  document.getElementById('btn-height-up')?.addEventListener('click', () => {
    const h = setHeightIndex(1);
    document.getElementById('height-label').textContent = h;
  });
  document.getElementById('btn-height-down')?.addEventListener('click', () => {
    const h = setHeightIndex(-1);
    document.getElementById('height-label').textContent = h;
  });
}

/* ═══════════════════════════════════════════════════════════════════ */
/* COLLIDER TOOLBAR BUTTONS                                            */
/* ═══════════════════════════════════════════════════════════════════ */

function buildColliderButtons() {
  [['btn-col-top', 'col-top'],
  ['btn-col-left', 'col-left'],
  ['btn-col-right', 'col-right'],
  ['btn-col-line', 'col-line'],
  ].forEach(([id, tool]) => {
    document.getElementById(id)?.addEventListener('click', () => {
      activeTool = tool;
      activeLayer = 'collider';
      setActiveTool(tool);
      document.getElementById('tab-col')?.classList.add('active-col');
      document.getElementById('tab-cube')?.classList.remove('active-cube');
      document.getElementById('layer-hint').textContent =
        tool === 'col-line' ? 'Line: click two vertices'
          : `Collider ${tool.slice(3)} — click a cell`;
    });
  });

  document.getElementById('btn-erase')?.addEventListener('click', () => {
    activeTool = 'erase';
    setActiveTool('erase');
    document.getElementById('status-msg').textContent = 'Erase — hover and click';
  });

  document.getElementById('btn-clear')?.addEventListener('click', () => {
    placedCubes.forEach(m => scene.remove(m));
    placedCubes.clear();
    clearColliders(scene);
    hideGhost();
  });
}

/* ═══════════════════════════════════════════════════════════════════ */
/* MOUSE EVENT HANDLERS                                                 */
/* ═══════════════════════════════════════════════════════════════════ */

function onMouseDown(e) {
  if (e.button !== 0) return;
  const viewport = document.getElementById('viewport-container');
  updateMouseFromEvent(e, viewport);

  const placed = getPlacedMap() ?? placedCubes;
  const placedTargets = [...placed.values()];
  const hit = raycaster.intersectObjects(placedTargets, false)[0];
  
  if (hit) {
    _potentialSelect = hit.object;
    _dragConfirmed = false;
    _dragMesh = hit.object;
    _dragStartM = new THREE.Vector2(e.clientX, e.clientY);
    _dragStartP = _dragMesh.position.clone();
    
    if (isMoveToolActive()) {
      _dragging = true;
      e.preventDefault();
      return;
    }
    
    e.preventDefault();
    return;
  }

  handleClick(viewport);
}

function onMouseMove(e) {
  const viewport = document.getElementById('viewport-container');

  if (_potentialSelect && !_dragging) {
    const dx = e.clientX - _dragStartM.x;
    const dy = e.clientY - _dragStartM.y;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
      _dragConfirmed = true;
      _dragging = true;
    }
  }

  if (_dragging && _dragMesh) {
    const dx = e.clientX - _dragStartM.x;
    const dy = e.clientY - _dragStartM.y;
    const angle = cameraManager.currentCameraAngle;
    const gridSize = CELL_SIZE;
    let mx = 0, mz = 0;
    if (angle === 0) { mx = dx * 0.01; mz = dy * 0.01; }
    else if (angle === 90) { mx = dx * -0.01; mz = dy * -0.01; }
    else if (angle === 180) { mx = dx * -0.01; mz = dy * 0.01; }
    else if (angle === 270) { mx = dx * 0.01; mz = dy * -0.01; }
    _dragMesh.position.x = Math.round((_dragStartP.x + mx) / gridSize) * gridSize;
    _dragMesh.position.z = Math.round((_dragStartP.z + mz) / gridSize) * gridSize;
    return;
  }

  handleHover(viewport);
}

function onMouseUp(e) {
  clearAllEraseHighlights([...placedCubes.values()]);

  const halfGrid = window.halfGridSize || 10;
  const gridSize = CELL_SIZE;

  if (isMoveToolActive() && _dragging && _dragMesh) {
    const key = _dragMesh.userData?.key;
    if (key) {
      placedCubes.delete(key);
    }
    const gx = Math.round((_dragMesh.position.x + halfGrid) / gridSize - 0.5);
    const gz = Math.round((_dragMesh.position.z + halfGrid) / gridSize - 0.5);
    const newKey = `${gx},${_dragMesh.userData.heightIdx},${gz}`;
    _dragMesh.userData.key = newKey;
    placedCubes.set(newKey, _dragMesh);
  } else if (_potentialSelect && !_dragConfirmed) {
    const shiftPressed = e && e.shiftKey;
    
    if (isSelectToolActive() && !shiftPressed) {
      _potentialSelect.userData.selected = !_potentialSelect.userData.selected;
      if (_potentialSelect.userData.selected) {
        if (!_selectedMeshes.includes(_potentialSelect)) {
          _selectedMeshes.push(_potentialSelect);
        }
      } else {
        _selectedMeshes = _selectedMeshes.filter(m => m !== _potentialSelect);
      }
    } else {
      selectMesh(_potentialSelect);
      const typeId = _potentialSelect.userData.shapeTypeId;
      const type = getShapeType(typeId);
      if (type) {
        activeTool = typeId;
        setActiveTool(typeId);
        setEditorActiveMaterial(_potentialSelect.material);
        const sidebar = document.getElementById('sidebar');
        if (sidebar.classList.contains('closed')) {
          sidebar.classList.remove('closed');
        }
        document.getElementById('tab-btn-material')?.click();
      }
    }
  }
  _dragging = false;
  _dragMesh = null;
  _potentialSelect = null;
  _dragConfirmed = false;
}
