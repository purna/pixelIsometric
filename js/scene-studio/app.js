import { LIBRARY_STORAGE, SCENE_STORAGE, DEFAULT_SETS, DEFAULT_GROUPS, DEFAULT_TILES } from './config.js';
import { normalizeTile, faceTexture, drawTextureQuad, drawTextureTri, tilePreviewURL } from './textures.js';
import { STRUCTURE_GROUPS, STRUCTURES, STRUCTURES_WITH_90, getStructure, drawStructure, structurePreviewURL } from './structures.js';

const $ = id => document.getElementById(id);
const canvas = $('scene');
const ctx = canvas.getContext('2d');
const designerPreview = $('tilePreview');
const designerCtx = designerPreview.getContext('2d');

const LAYER_RANK = { ground: 0, structure: 1, decoration: 2, collider: 3 };

const SHAPE_GROUPS = [
  { name: 'Surfaces', shapes: [
    { id: 'cube', label: 'Cube', icon: '<svg viewBox="0 0 24 20"><polygon points="12,2 22,7 12,12 2,7" fill="currentColor" opacity=".9"/><polygon points="2,7 12,12 12,19 2,14" fill="currentColor" opacity=".55"/><polygon points="22,7 12,12 12,19 22,14" fill="currentColor" opacity=".35"/></svg>' },
    { id: 'plane', label: 'Plane', icon: '<svg viewBox="0 0 24 20"><polygon points="12,5 22,10 12,15 2,10" fill="currentColor" opacity=".8"/></svg>' },
  ]},
  { name: 'Structures', shapes: [
    { id: 'ramp', label: 'Ramp', icon: '<svg viewBox="0 0 24 20"><polygon points="2,16 22,16 22,6 2,11" fill="currentColor" opacity=".75"/></svg>' },
    { id: 'arch', label: 'Arch', icon: '<svg viewBox="0 0 24 20"><path d="M3 18V9a9 9 0 0 1 18 0v9h-4V9a5 5 0 0 0-10 0v9z" fill="currentColor" opacity=".8"/></svg>' },
    { id: 'pillar', label: 'Pillar', icon: '<svg viewBox="0 0 24 20"><rect x="8" y="3" width="8" height="14" fill="currentColor" opacity=".8"/><rect x="6" y="2" width="12" height="3" fill="currentColor"/></svg>' },
    { id: 'wall', label: 'Wall', icon: '<svg viewBox="0 0 24 20"><rect x="3" y="4" width="18" height="13" fill="currentColor" opacity=".55"/><path d="M3 8h18M3 12h18M8 4v4M15 4v4M6 12v5M17 12v5" stroke="#0008"/></svg>' },
    { id: 'stairs', label: 'Stairs', icon: '<svg viewBox="0 0 24 20"><path d="M3 17h5v-4h5V9h5V5h3v12H3z" fill="currentColor" opacity=".75"/></svg>' },
    { id: 'roof', label: 'Roof', icon: '<svg viewBox="0 0 24 20"><polygon points="12,2 22,17 2,17" fill="currentColor" opacity=".8"/><path d="M12 2v15" stroke="#0006"/></svg>' },
  ]},
  { name: 'Complex', shapes: [
    { id: 'bridge', label: 'Bridge', icon: '<svg viewBox="0 0 24 20"><path d="M2 14h20M5 14V9m14 5V9M2 9c3-5 17-5 20 0" fill="none" stroke="currentColor" stroke-width="2"/></svg>' },
    { id: 'tower', label: 'Tower', icon: '<svg viewBox="0 0 24 20"><path d="M7 18V6h10v12M7 6V3h3v3m4-3v3m3-3v3" fill="none" stroke="currentColor" stroke-width="2"/></svg>' },
    { id: 'gate', label: 'Gate', icon: '<svg viewBox="0 0 24 20"><path d="M4 18V8h4v10M16 18V8h4v10M8 8h8v3H8z" fill="currentColor" opacity=".75"/></svg>' },
    { id: 'fence', label: 'Fence', icon: '<svg viewBox="0 0 24 20"><path d="M3 17V6m6 11V6m6 11V6m6 11V6M3 10h18M3 14h18" stroke="currentColor" stroke-width="2"/></svg>' },
  ]},
];


let library = loadLibrary();
let selectedTileId = library.tiles[0]?.id || null;
let selectedGroupId = library.tiles[0]?.groupId || library.groups[0]?.id || null;
let selectedSetId = library.groups.find(g => g.id === selectedGroupId)?.setId || library.sets[0]?.id || null;
let state = loadScene();
let history = [];
let historyIndex = -1;
let tool = 'brush';
let activeShape = 'cube';
let activeStructure = null;
let activeRot = 0;
let activeMirror = false;
let activeLayer = 'ground';
let colliderTool = 'top';
let activeHeight = 0;
let pointer = null;
let drawing = false;
let lastPaint = '';
let edgeStart = null;
let zoom = 1;
let panX = 0;
let panY = 0;
let panMode = false;
let panning = false;
let panStart = null;
let lastGrowAt = 0;
const GROW_COOLDOWN = 140;

function clone(value) { return JSON.parse(JSON.stringify(value)); }

function loadLibrary() {
  try {
    const saved = JSON.parse(localStorage.getItem(LIBRARY_STORAGE) || 'null');
    if (saved && Array.isArray(saved.tiles) && saved.tiles.length) {
      saved.groups = Array.isArray(saved.groups) && saved.groups.length ? saved.groups : clone(DEFAULT_GROUPS);
      saved.sets = Array.isArray(saved.sets) && saved.sets.length ? saved.sets : clone(DEFAULT_SETS);
      saved.tiles = saved.tiles.map(tile => normalizeTile(tile));
      const setIds = new Set(saved.sets.map(s => s.id));
      DEFAULT_SETS.forEach(set => { if (!setIds.has(set.id)) saved.sets.push(clone(set)); });
      const groupIds = new Set(saved.groups.map(g => g.id));
      DEFAULT_GROUPS.forEach(g => { if (!groupIds.has(g.id)) saved.groups.push(clone(g)); });
      saved.groups.forEach(g => { if (!g.setId) g.setId = saved.sets[0]?.id || 'classic'; });
      const tileIds = new Set(saved.tiles.map(t => t.id));
      DEFAULT_TILES.forEach(t => { if (!tileIds.has(t.id)) saved.tiles.push(normalizeTile(clone(t))); });
      return saved;
    }
  } catch (_) {}
  return {
    sets: clone(DEFAULT_SETS),
    groups: clone(DEFAULT_GROUPS),
    tiles: DEFAULT_TILES.map(tile => normalizeTile(clone(tile))),
  };
}

function saveLibrary() {
  try { localStorage.setItem(LIBRARY_STORAGE, JSON.stringify(library)); } catch (_) {}
}

function defaultScene() {
  return { width: 20, height: 16, tiles: [], colliders: [] };
}

function loadScene() {
  try {
    const saved = JSON.parse(localStorage.getItem(SCENE_STORAGE) || 'null');
    if (saved) {
      const scene = { ...defaultScene(), ...saved, colliders: saved.colliders || [] };
      scene.tiles = (scene.tiles || []).map(t => ({ ...t, layer: t.layer || 'ground', shape: t.shape || 'cube' }));
      return scene;
    }
  } catch (_) {}
  return defaultScene();
}

function snapshot() { return JSON.stringify(state); }

function saveScene() {
  try { localStorage.setItem(SCENE_STORAGE, snapshot()); } catch (_) {}
}

function commit() {
  const now = snapshot();
  if (history[historyIndex] === now) return;
  history = history.slice(0, historyIndex + 1);
  history.push(now);
  if (history.length > 80) history.shift();
  historyIndex = history.length - 1;
  saveScene();
  updateHistory();
}

function restore(raw) {
  state = JSON.parse(raw);
  renderInputs();
  draw();
  saveScene();
}

function undo() {
  if (historyIndex > 0) { restore(history[--historyIndex]); updateHistory(); say('Undid last scene change.'); }
}

function redo() {
  if (historyIndex < history.length - 1) { restore(history[++historyIndex]); updateHistory(); say('Redid scene change.'); }
}

function updateHistory() {
  $('undo').disabled = historyIndex <= 0;
  $('redo').disabled = historyIndex >= history.length - 1;
}

function say(message) { $('status').innerHTML = message; }
function getTile(id = selectedTileId) { return library.tiles.find(t => t.id === id) || library.tiles[0]; }
function groupTiles(groupId = selectedGroupId) { return library.tiles.filter(t => t.groupId === groupId); }

/* ── library + groups UI ─────────────────────────────────── */
function renderSets() {
  const select = $('setSelect');
  if (!select) return;
  select.innerHTML = '';
  library.sets.forEach(set => {
    const option = document.createElement('option');
    option.value = set.id;
    option.textContent = set.name;
    select.appendChild(option);
  });
  if (!library.sets.some(s => s.id === selectedSetId)) selectedSetId = library.sets[0]?.id || null;
  select.value = selectedSetId;
  const total = library.groups.filter(g => g.setId === selectedSetId).reduce((n, g) => n + groupTiles(g.id).length, 0);
  const option = select.selectedOptions[0];
  if (option) option.textContent = `${library.sets.find(s => s.id === selectedSetId)?.name || 'Set'} (${total})`;
}

function renderGroups() {
  const select = $('groupSelect');
  select.innerHTML = '';
  const visibleGroups = library.groups.filter(g => g.setId === selectedSetId);
  visibleGroups.forEach(group => {
    const option = document.createElement('option');
    option.value = group.id;
    option.textContent = `${group.name} (${groupTiles(group.id).length})`;
    select.appendChild(option);
  });
  if (!visibleGroups.some(g => g.id === selectedGroupId)) selectedGroupId = visibleGroups[0]?.id || null;
  select.value = selectedGroupId || '';

  const list = $('groupList');
  list.innerHTML = '';
  visibleGroups.forEach(group => {
    const row = document.createElement('div');
    row.className = 'group-row' + (group.id === selectedGroupId ? ' active' : '');
    const setOptions = library.sets.map(s => `<option value="${s.id}" ${s.id === group.setId ? 'selected' : ''}>${s.name}</option>`).join('');
    row.innerHTML = `<span class="group-name">${group.name}</span><span class="group-count">${groupTiles(group.id).length}</span><select class="group-set-select" data-group-id="${group.id}" title="Move group to set">${setOptions}</select>`;
    row.onclick = (e) => {
      if (e.target.closest('select')) return;
      selectedGroupId = group.id;
      const first = groupTiles(group.id)[0];
      if (first) selectTile(first.id);
      else { renderGroups(); renderPalette(); }
    };
    row.querySelector('.group-set-select').onchange = (e) => {
      group.setId = e.target.value;
      selectedSetId = group.setId;
      saveLibrary();
      renderSets();
      renderGroups();
      renderPalette();
    };
    list.appendChild(row);
  });
}

function renderPalette() {
  const holder = $('palette');
  holder.innerHTML = '';
  library.groups.filter(g => g.setId === selectedSetId).forEach(group => {
    const tiles = groupTiles(group.id);
    if (!tiles.length) return;
    const section = document.createElement('div');
    section.className = 'palette-group';
    section.innerHTML = `<h3>${group.name}</h3>`;
    const grid = document.createElement('div');
    grid.className = 'palette';
    tiles.forEach(tile => {
      normalizeTile(tile);
      const b = document.createElement('button');
      b.className = 'tile' + (tile.id === selectedTileId ? ' active' : '');
      b.dataset.id = tile.id;
      b.title = `${tile.name} · ${group.name}`;
      b.style.background = `linear-gradient(135deg,${tile.top},${tile.bottom})`;
      b.innerHTML = `<i style="background-image:url(${tilePreviewURL(tile)});background-size:cover"></i>${tile.name}`;
      b.onclick = () => selectTile(tile.id);
      grid.appendChild(b);
    });
    section.appendChild(grid);
    holder.appendChild(section);
  });
}

function renderShapes() {
  const holder = $('shapes');
  if (!holder) return;
  holder.innerHTML = '';
  SHAPE_GROUPS.forEach(group => {
    const wrap = document.createElement('div');
    wrap.className = 'shape-group';
    wrap.innerHTML = `<div class="shape-group-label">${group.name}</div>`;
    const grid = document.createElement('div');
    grid.className = 'shape-grid';
    group.shapes.forEach(shape => {
      const b = document.createElement('button');
      b.className = 'shape-btn' + (shape.id === activeShape ? ' active' : '');
      b.dataset.shape = shape.id;
      b.innerHTML = `<span class="shape-icon">${shape.icon}</span><span>${shape.label}</span>`;
      grid.appendChild(b);
    });
    wrap.appendChild(grid);
    holder.appendChild(wrap);
  });
  STRUCTURE_GROUPS.forEach(group => {
    const list = STRUCTURES_WITH_90.filter(st => st.group === group.id);
    if (!list.length) return;
    const wrap = document.createElement('div');
    wrap.className = 'shape-group';
    wrap.innerHTML = `<div class="shape-group-label">${group.name}</div>`;
    const grid = document.createElement('div');
    grid.className = 'shape-grid';
    list.forEach(structure => {
      const b = document.createElement('button');
      b.className = 'shape-btn' + (structure.id === activeStructure ? ' active' : '');
      b.dataset.structure = structure.id;
      b.title = structure.name;
      b.innerHTML = `<img class="shape-icon" alt="" src="${structurePreviewURL(structure, library.tiles, {rot: activeRot, mirror: activeMirror})}"><span>${structure.name}</span>`;
      grid.appendChild(b);
    });
    wrap.appendChild(grid);
    holder.appendChild(wrap);
  });
}

function selectTile(id) {
  const tile = getTile(id);
  if (!tile) return;
  selectedTileId = tile.id;
  selectedGroupId = tile.groupId || selectedGroupId;
  selectedSetId = library.groups.find(g => g.id === selectedGroupId)?.setId || selectedSetId;
  loadDesignerFromTile(tile);
  renderGroups();
  renderPalette();
  draw();
  say(`Selected tile <b>${tile.name}</b>.`);
}

/* ── designer ────────────────────────────────────────────── */
function readDither(prefix) {
  return {
    mode: $(`${prefix}Mode`).value,
    ink: $(`${prefix}Ink`).value,
    bright: Number($(`${prefix}Bright`).value),
    space: Number($(`${prefix}Space`).value),
    thick: Number($(`${prefix}Thick`).value),
    blend: Number($(`${prefix}Blend`).value),
    blendMode: $(`${prefix}BlendMode`).value,
  };
}

function readDesigner(id = selectedTileId, groupId = selectedGroupId) {
  return {
    id,
    name: $('tileName').value.trim() || 'Custom tile',
    groupId,
    top: $('tileTop').value,
    bottom: $('tileBottom').value,
    split: Number($('tileSplit').value),
    topDither: readDither('top'),
    bottomDither: readDither('bottom'),
  };
}

function loadDesignerFromTile(tile) {
  normalizeTile(tile);
  $('tileName').value = tile.name;
  $('tileTop').value = tile.top;
  $('tileBottom').value = tile.bottom;
  $('tileSplit').value = tile.split;
  ['top', 'bottom'].forEach(prefix => {
    const d = tile[`${prefix}Dither`];
    $(`${prefix}Mode`).value = d.mode;
    $(`${prefix}Ink`).value = d.ink;
    $(`${prefix}Bright`).value = d.bright;
    $(`${prefix}Space`).value = d.space;
    $(`${prefix}Thick`).value = d.thick;
    $(`${prefix}Blend`).value = d.blend;
    $(`${prefix}BlendMode`).value = d.blendMode || 'source-over';
  });
  updateDesignerLabels();
  drawDesignerPreview();
}

function updateDesignerLabels() {
  $('tileSplitValue').textContent = $('tileSplit').value;
  ['top', 'bottom'].forEach(prefix => {
    ['Bright', 'Space', 'Thick', 'Blend'].forEach(key => {
      $(`${prefix}${key}Value`).textContent = $(`${prefix}${key}`).value;
    });
  });
}

function drawDesignerPreview() {
  const tile = readDesigner('__preview__', selectedGroupId);
  const w = designerPreview.width, h = designerPreview.height;
  designerCtx.clearRect(0, 0, w, h);
  designerCtx.fillStyle = '#0b0b0f';
  designerCtx.fillRect(0, 0, w, h);
  designerCtx.strokeStyle = 'rgba(255,255,255,.045)';
  for (let x = -h; x < w + h; x += 18) {
    designerCtx.beginPath(); designerCtx.moveTo(x, h); designerCtx.lineTo(x + h, 0); designerCtx.stroke();
  }
  const cx = w / 2, cy = h * 0.5, s = Math.min(58, w * 0.2), body = s * 0.56;
  const top = [[cx, cy - s * 0.5], [cx + s, cy], [cx, cy + s * 0.5], [cx - s, cy]];
  const left = [[cx - s, cy], [cx, cy + s * 0.5], [cx, cy + s * 0.5 + body], [cx - s, cy + body]];
  const right = [[cx, cy + s * 0.5], [cx + s, cy], [cx + s, cy + body], [cx, cy + s * 0.5 + body]];
  drawTextureQuad(designerCtx, left, faceTexture(tile, 'left'));
  drawTextureQuad(designerCtx, right, faceTexture(tile, 'right'));
  drawTextureQuad(designerCtx, top, faceTexture(tile, 'top'));
}

function saveTile() {
  const tile = readDesigner('custom-' + Date.now(), selectedGroupId);
  library.tiles.push(tile);
  selectedTileId = tile.id;
  saveLibrary();
  renderGroups();
  renderPalette();
  draw();
  say(`Saved tile <b>${tile.name}</b> into the selected group.`);
}

function updateTile() {
  const tile = getTile(selectedTileId);
  if (!tile) return;
  Object.assign(tile, readDesigner(tile.id, tile.groupId));
  saveLibrary();
  renderPalette();
  draw();
  say(`Updated <b>${tile.name}</b>.`);
}

function applyDesignerToGroup() {
  const group = library.groups.find(g => g.id === selectedGroupId);
  if (!group) return;
  const design = readDesigner(selectedTileId, selectedGroupId);
  groupTiles(group.id).forEach(tile => {
    tile.top = design.top;
    tile.bottom = design.bottom;
    tile.split = design.split;
    tile.topDither = { ...design.topDither };
    tile.bottomDither = { ...design.bottomDither };
  });
  saveLibrary();
  renderPalette();
  draw();
  say(`Applied designer colours and dithers to <b>${group.name}</b>.`);
}

function newGroup() {
  const name = prompt('Group name', 'New group');
  if (!name) return;
  const group = { id: 'group-' + Date.now(), name, setId: selectedSetId };
  library.groups.push(group);
  selectedGroupId = group.id;
  saveLibrary();
  renderGroups();
  renderPalette();
}

function duplicateGroup() {
  const source = library.groups.find(g => g.id === selectedGroupId);
  if (!source) return;
  const group = { id: 'group-' + Date.now(), name: source.name + ' copy', setId: source.setId };
  const copies = groupTiles(source.id).map((tile, i) => normalizeTile({
    ...clone(tile),
    id: 'copy-' + Date.now() + '-' + i,
    groupId: group.id,
    name: tile.name + ' copy',
  }));
  library.groups.push(group);
  library.tiles.push(...copies);
  selectedGroupId = group.id;
  if (copies[0]) selectedTileId = copies[0].id;
  saveLibrary();
  renderGroups();
  renderPalette();
  if (copies[0]) loadDesignerFromTile(copies[0]);
  say(`Duplicated group <b>${source.name}</b>.`);
}

function deleteGroup() {
  const group = library.groups.find(g => g.id === selectedGroupId);
  if (!group) return;
  if (!confirm(`Delete group ${group.name} and its tiles?`)) return;
  const ids = new Set(groupTiles(group.id).map(t => t.id));
  library.groups = library.groups.filter(g => g.id !== group.id);
  library.tiles = library.tiles.filter(t => !ids.has(t.id));
  state.tiles = state.tiles.filter(t => !ids.has(t.id));
  selectedGroupId = library.groups.find(g => g.setId === selectedSetId)?.id || library.groups[0]?.id || null;
  selectedTileId = library.tiles[0]?.id || null;
  saveLibrary();
  saveScene();
  if (selectedTileId) selectTile(selectedTileId);
  else { renderGroups(); renderPalette(); draw(); }
}

function newSet() {
  const name = prompt('Set name', 'New set');
  if (!name) return;
  const set = { id: 'set-' + Date.now(), name };
  library.sets.push(set);
  selectedSetId = set.id;
  saveLibrary();
  renderSets();
  renderGroups();
  renderPalette();
}

function duplicateSet() {
  const source = library.sets.find(s => s.id === selectedSetId);
  if (!source) return;
  const set = { id: 'set-' + Date.now(), name: source.name + ' copy' };
  library.sets.push(set);
  const sourceGroups = library.groups.filter(g => g.setId === source.id);
  sourceGroups.forEach(group => {
    const newGroup = { ...clone(group), id: 'group-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6), setId: set.id, name: group.name + ' copy' };
    library.groups.push(newGroup);
    groupTiles(group.id).forEach((tile, i) => {
      library.tiles.push(normalizeTile({ ...clone(tile), id: 'copy-' + Date.now() + '-' + i + '-' + Math.random().toString(36).slice(2, 5), groupId: newGroup.id, name: tile.name + ' copy' }));
    });
  });
  selectedSetId = set.id;
  const firstGroup = library.groups.find(g => g.setId === set.id);
  selectedGroupId = firstGroup?.id || null;
  const firstTile = firstGroup ? groupTiles(firstGroup.id)[0] : null;
  if (firstTile) selectedTileId = firstTile.id;
  saveLibrary();
  renderSets();
  renderGroups();
  renderPalette();
  if (firstTile) loadDesignerFromTile(firstTile);
  say(`Duplicated set <b>${source.name}</b>.`);
}

function deleteSet() {
  const set = library.sets.find(s => s.id === selectedSetId);
  if (!set) return;
  if (library.sets.length <= 1) return say('Keep at least one tile set.');
  if (!confirm(`Delete set ${set.name}? Its groups will move to another set.`)) return;
  const fallback = library.sets.find(s => s.id !== set.id);
  library.groups.filter(g => g.setId === set.id).forEach(g => { g.setId = fallback.id; });
  library.sets = library.sets.filter(s => s.id !== set.id);
  selectedSetId = fallback.id;
  saveLibrary();
  renderSets();
  renderGroups();
  renderPalette();
  say(`Deleted set <b>${set.name}</b>; its groups were moved to <b>${fallback.name}</b>.`);
}

function deleteTile() {
  const tile = getTile(selectedTileId);
  if (!tile) return;
  if (!confirm(`Delete tile ${tile.name}?`)) return;
  library.tiles = library.tiles.filter(t => t.id !== tile.id);
  state.tiles = state.tiles.filter(t => t.id !== tile.id);
  selectedTileId = library.tiles[0]?.id || null;
  saveLibrary();
  saveScene();
  if (selectedTileId) selectTile(selectedTileId);
  else { renderGroups(); renderPalette(); draw(); }
}

/* ── scene helpers ───────────────────────────────────────── */
function tileAt(x, y, z = activeHeight, layer = activeLayer) {
  return state.tiles.find(t => t.x === x && t.y === y && t.z === z && t.layer === layer);
}

function setTile(x, y, z, id, shape = activeShape, layer = activeLayer, structure = activeStructure, rot = activeRot, mirror = activeMirror) {
  const i = state.tiles.findIndex(t => t.x === x && t.y === y && t.z === z && t.layer === layer);
  if (id) {
    const data = { id, shape, structure: structure || null, rot: rot || 0, mirror: !!mirror };
    if (i < 0) state.tiles.push({ x, y, z, layer, ...data });
    else Object.assign(state.tiles[i], data);
  } else if (i >= 0) state.tiles.splice(i, 1);
}

function growCanvasFor(minX, minY, maxX, maxY) {
  const now = performance.now();
  if (now - lastGrowAt < GROW_COOLDOWN) return { dx: 0, dy: 0 };

  let dx = minX < 0 ? 1 : 0;
  let dy = minY < 0 ? 1 : 0;
  if (dx || dy) {
    state.tiles.forEach(t => { t.x += dx; t.y += dy; });
    state.colliders.forEach(c => { c.x += dx; c.y += dy; c.toX += dx; c.toY += dy; });
    state.width += dx;
    state.height += dy;
  }

  let grew = !!(dx || dy);
  if (maxX + dx >= state.width) { state.width += 1; grew = true; }
  if (maxY + dy >= state.height) { state.height += 1; grew = true; }
  if (grew) lastGrowAt = now;

  $('width').value = state.width;
  $('height').value = state.height;
  return { dx, dy };
}

function toggleCollider(kind, x, y, z) {
  const i = state.colliders.findIndex(c => c.kind === kind && c.x === x && c.y === y && c.z === z);
  if (i >= 0) state.colliders.splice(i, 1);
  else state.colliders.push({ kind, x, y, z });
}

function addEdgeCollider(cell) {
  const c = { kind: 'edge', x: cell.x, y: cell.y, z: activeHeight, toX: cell.x, toY: cell.y, toZ: activeHeight };
  if (colliderTool === 'edge-x') c.toX = cell.x + 1;
  else if (colliderTool === 'edge-y') c.toY = cell.y + 1;
  else if (colliderTool === 'edge-z') c.toZ = activeHeight + 1;
  state.colliders.push(c);
  commit();
  draw();
}

function paint(cell, erase = false) {
  const radius = (Number($('brush').value) - 1) / 2;
  const minX = Math.floor(cell.x - radius), maxX = Math.ceil(cell.x + radius);
  const minY = Math.floor(cell.y - radius), maxY = Math.ceil(cell.y + radius);
  const { dx, dy } = growCanvasFor(minX, minY, maxX, maxY);
  const baseX = cell.x + dx, baseY = cell.y + dy;
  const key = `${baseX},${baseY},${activeHeight},${activeLayer},${erase ? 'e' : 'p'}`;
  if (key === lastPaint) return;
  lastPaint = key;

  for (let y = baseY - radius; y <= baseY + radius; y++) {
    for (let x = baseX - radius; x <= baseX + radius; x++) {
      if (x < 0 || y < 0 || x >= state.width || y >= state.height) continue;
      if (activeLayer === 'collider') {
        const kind = ['top', 'left', 'right', 'tile'].includes(colliderTool) ? colliderTool : 'tile';
        if (erase) {
          state.colliders = state.colliders.filter(c => !(c.kind === kind && c.x === x && c.y === y && c.z === activeHeight));
        } else {
          const i = state.colliders.findIndex(c => c.kind === kind && c.x === x && c.y === y && c.z === activeHeight);
          if (i < 0) state.colliders.push({ kind, x, y, z: activeHeight });
        }
      } else {
        setTile(x, y, activeHeight, erase ? null : selectedTileId, activeShape, activeLayer);
      }
    }
  }
  draw();
}

function fill(cell) {
  if (activeLayer === 'collider') return;
  const start = tileAt(cell.x, cell.y)?.id || null;
  if (start === selectedTileId) return;
  const todo = [cell], seen = new Set();
  while (todo.length) {
    const cur = todo.pop(), key = `${cur.x},${cur.y}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (cur.x < 0 || cur.y < 0 || cur.x >= state.width || cur.y >= state.height) continue;
    if ((tileAt(cur.x, cur.y)?.id || null) !== start) continue;
    setTile(cur.x, cur.y, activeHeight, selectedTileId, activeShape, activeLayer);
    todo.push({ x: cur.x + 1, y: cur.y }, { x: cur.x - 1, y: cur.y }, { x: cur.x, y: cur.y + 1 }, { x: cur.x, y: cur.y - 1 });
  }
  draw();
}

/* ── rendering ───────────────────────────────────────────── */
function iso(x, y, z) {
  const base = Math.max(10, Math.min(34, Math.min(canvas.width / (state.width + state.height + 4), canvas.height / (state.width + state.height + 5)) * 1.45));
  const scale = base * zoom;
  return {
    x: canvas.width / 2 + (x - y) * scale + panX,
    y: canvas.height * 0.58 + (x + y - state.width * 0.52) * scale * 0.5 - z * scale + panY,
    scale,
  };
}

function drawTile(tile, alpha = 1) {
  const data = getTile(tile.id);
  const p = iso(tile.x, tile.y, tile.z);
  const s = p.scale;
  const shape = tile.shape || 'cube';
  if (tile.structure) {
    const structure = getStructure(tile.structure);
    if (structure) {
      drawStructure(ctx, structure, library.tiles, {
        x: p.x, y: p.y + s * 0.5, S: s,
        rot: ((tile.rot || 0) % 4 + 4) % 4,
        mirror: !!tile.mirror,
        alpha,
      });
      return;
    }
  }
  const h = s * (shape === 'plane' ? 0 : shape === 'pillar' ? 1.25 : shape === 'wall' ? 1.05 : shape === 'tower' ? 1.65 : shape === 'gate' ? 0.85 : shape === 'stairs' ? 0.8 : shape === 'bridge' ? 0.28 : shape === 'fence' ? 0.38 : 0.56);
  const top = [[p.x, p.y - s * 0.5], [p.x + s, p.y], [p.x, p.y + s * 0.5], [p.x - s, p.y]];
  const left = [[p.x - s, p.y], [p.x, p.y + s * 0.5], [p.x, p.y + s * 0.5 + h], [p.x - s, p.y + h]];
  const right = [[p.x, p.y + s * 0.5], [p.x + s, p.y], [p.x + s, p.y + h], [p.x, p.y + s * 0.5 + h]];

  if (shape === 'plane') {
    drawTextureQuad(ctx, top, faceTexture(data, 'top'), alpha);
    return;
  }

  if (shape === 'bridge') {
    const topLift = s * 0.32;
    const bridgeTop = top.map(([x, y]) => [x, y - topLift]);
    ctx.strokeStyle = 'rgba(0,0,0,.45)';
    ctx.fillStyle = 'rgba(0,0,0,.18)';
    ctx.beginPath(); ctx.moveTo(bridgeTop[0][0], bridgeTop[0][1]); bridgeTop.slice(1).forEach(pt => ctx.lineTo(pt[0], pt[1])); ctx.closePath(); ctx.fill();
    drawTextureQuad(ctx, bridgeTop, faceTexture(data, 'top'), alpha);
    ctx.strokeStyle = '#6e552f';
    ctx.lineWidth = Math.max(1, s * 0.08);
    ctx.beginPath(); ctx.moveTo(bridgeTop[3][0], bridgeTop[3][1] - s * 0.16); ctx.lineTo(bridgeTop[2][0], bridgeTop[2][1] - s * 0.16); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bridgeTop[0][0], bridgeTop[0][1]); ctx.lineTo(bridgeTop[1][0], bridgeTop[1][1]); ctx.stroke();
    ctx.lineWidth = 1;
    return;
  }

  if (shape === 'fence') {
    ctx.strokeStyle = '#5b4428';
    ctx.lineWidth = Math.max(1, s * 0.06);
    const posts = [top[0], top[1], top[2], top[3], [p.x, p.y]];
    posts.forEach(pt => {
      ctx.beginPath(); ctx.moveTo(pt[0], pt[1]); ctx.lineTo(pt[0], pt[1] + s * 0.42); ctx.stroke();
    });
    ctx.beginPath(); ctx.moveTo(top[0][0], top[0][1] + s * 0.18); ctx.lineTo(top[2][0], top[2][1] + s * 0.18); ctx.stroke();
    ctx.lineWidth = 1;
    return;
  }

  if (shape === 'ramp') {
    const r = ((tile.rot || 0) % 4 + 4) % 4;
    const rotUV = (u, v) => [[u, v], [-v, u], [-u, -v], [v, -u]][r];
    const P = (lx, ly, lz) => { const [u, v] = rotUV(lx - 0.5, ly - 0.5); return iso(tile.x + 0.5 + u, tile.y + 0.5 + v, tile.z + lz); };
    const q = (pts, face) => drawTextureQuad(ctx, pts.map(pt => [pt.x, pt.y]), faceTexture(data, face), alpha);
    const t = (pts, face) => drawTextureTri(ctx, pts.map(pt => [pt.x, pt.y]), faceTexture(data, face), alpha);
    const A = P(0, 0, 0), B = P(1, 0, 0), C = P(1, 1, 0), D = P(0, 1, 0), E = P(0, 0, 1), F = P(0, 1, 1);
    t([A, B, E], 'left');
    t([C, D, F], 'right');
    q([A, E, F, D], 'left');
    q([B, C, F, E], 'top');
    return;
  }

  if (shape === 'roof') {
    const apex = [p.x, p.y - s * 0.95];
    const topV = [p.x, p.y - s * 0.5];
    const rightV = [p.x + s, p.y];
    const bottomV = [p.x, p.y + s * 0.5];
    const leftV = [p.x - s, p.y];
    drawTextureTri(ctx, [leftV, bottomV, apex], faceTexture(data, 'left'), alpha);
    drawTextureTri(ctx, [bottomV, rightV, apex], faceTexture(data, 'right'), alpha);
    drawTextureTri(ctx, [rightV, topV, apex], faceTexture(data, 'right'), alpha);
    drawTextureTri(ctx, [topV, leftV, apex], faceTexture(data, 'left'), alpha);
    return;
  }

  if (shape !== 'plane') {
    drawTextureQuad(ctx, left, faceTexture(data, 'left'), alpha);
    drawTextureQuad(ctx, right, faceTexture(data, 'right'), alpha);
  }
  drawTextureQuad(ctx, top, faceTexture(data, 'top'), alpha);

  if (shape === 'arch' || shape === 'gate') {
    const P = (lx, ly, lz) => iso(tile.x + lx, tile.y + ly, tile.z + lz);
    const q = (pts, face) => drawTextureQuad(ctx, pts.map(pt => [pt.x, pt.y]), faceTexture(data, face), alpha);
    const ow = 0.46, oh = 0.56, lw = (1 - ow) / 2, rs = lw + ow;

    q([P(0, 0, 0), P(lw, 0, 0), P(lw, 0, oh), P(0, 0, oh)], 'left');
    q([P(rs, 0, 0), P(1, 0, 0), P(1, 0, oh), P(rs, 0, oh)], 'left');
    q([P(0, 0, oh), P(1, 0, oh), P(1, 0, 1), P(0, 0, 1)], 'left');

    q([P(lw, 0, 0), P(lw, 1, 0), P(lw, 1, oh), P(lw, 0, oh)], 'left');
    q([P(rs, 0, 0), P(rs, 1, 0), P(rs, 1, oh), P(rs, 0, oh)], 'right');
    q([P(lw, 0, oh), P(rs, 0, oh), P(rs, 1, oh), P(lw, 1, oh)], 'top');

    q([P(0, 0, 0), P(0, 1, 0), P(0, 1, 1), P(0, 0, 1)], 'left');
    q([P(1, 0, 0), P(1, 1, 0), P(1, 1, 1), P(1, 0, 1)], 'right');

    q([P(0, 1, 0), P(lw, 1, 0), P(lw, 1, oh), P(0, 1, oh)], 'right');
    q([P(rs, 1, 0), P(1, 1, 0), P(1, 1, oh), P(rs, 1, oh)], 'right');
    q([P(0, 1, oh), P(1, 1, oh), P(1, 1, 1), P(0, 1, 1)], 'right');

    q([P(0, 0, 1), P(1, 0, 1), P(1, 1, 1), P(0, 1, 1)], 'top');
    return;
  }

  if (shape === 'stairs') {
    ctx.strokeStyle = 'rgba(0,0,0,.38)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
      const yy = p.y + s * 0.5 + (h * i) / 3;
      ctx.beginPath(); ctx.moveTo(p.x - s, p.y + (h * i) / 3); ctx.lineTo(p.x, yy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(p.x, yy); ctx.lineTo(p.x + s, p.y + (h * i) / 3); ctx.stroke();
    }
  }

  if (shape === 'tower') {
    ctx.strokeStyle = 'rgba(0,0,0,.35)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
      const yy = p.y - s * 0.5 + (s * 1.65 * i) / 4;
      ctx.beginPath(); ctx.moveTo(p.x, yy); ctx.lineTo(p.x + s, yy + s * 0.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(p.x, yy); ctx.lineTo(p.x - s, yy + s * 0.5); ctx.stroke();
    }
  }

  if (shape === 'pillar' || shape === 'wall' || shape === 'tower') {
    ctx.strokeStyle = 'rgba(255,255,255,.22)';
    ctx.beginPath(); ctx.moveTo(p.x, p.y - s * 0.5); ctx.lineTo(p.x, p.y + s * 0.5 + h); ctx.stroke();
  }

  if (tile.id === 'water') {
    ctx.globalAlpha = alpha * 0.35;
    ctx.strokeStyle = '#e8ffff';
    ctx.beginPath(); ctx.moveTo(p.x - s * 0.45, p.y); ctx.lineTo(p.x + s * 0.25, p.y + s * 0.34); ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function draw() {
  const rect = canvas.getBoundingClientRect();
  if (canvas.width !== Math.max(1, Math.floor(rect.width)) || canvas.height !== Math.max(1, Math.floor(rect.height))) {
    canvas.width = Math.max(1, Math.floor(rect.width));
    canvas.height = Math.max(1, Math.floor(rect.height));
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#0d0d10';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < state.height; y++) {
    for (let x = 0; x < state.width; x++) {
      const p = iso(x, y, activeHeight), s = p.scale;
      ctx.beginPath(); ctx.moveTo(p.x, p.y - s * 0.5); ctx.lineTo(p.x + s, p.y); ctx.lineTo(p.x, p.y + s * 0.5); ctx.lineTo(p.x - s, p.y); ctx.closePath();
      ctx.strokeStyle = 'rgba(255,255,255,.055)'; ctx.stroke();
    }
  }

  const visual = state.tiles
    .filter(t => t.layer !== 'collider')
    .slice()
    .sort((a, b) => (LAYER_RANK[a.layer] - LAYER_RANK[b.layer]) || ((a.x + a.y + a.z * 0.5) - (b.x + b.y + b.z * 0.5)));
  visual.forEach(t => drawTile(t));

  (state.colliders || []).forEach(c => {
    const a = iso(c.x, c.y, c.z || 0);
    ctx.strokeStyle = '#4eff91';
    ctx.fillStyle = 'rgba(78,255,145,.12)';
    ctx.lineWidth = 2;
    if (c.kind === 'edge') {
      const b = iso(c.toX, c.toY, c.toZ ?? c.z ?? 0);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    } else {
      const z = c.z || 0;
      const pts = c.kind === 'left'
        ? [iso(c.x, c.y + 1, z + 1), iso(c.x + 1, c.y + 1, z + 1), iso(c.x + 1, c.y + 1, z), iso(c.x, c.y + 1, z)]
        : c.kind === 'right'
          ? [iso(c.x + 1, c.y, z + 1), iso(c.x + 1, c.y + 1, z + 1), iso(c.x + 1, c.y + 1, z), iso(c.x + 1, c.y, z)]
          : [iso(c.x, c.y, z + 1), iso(c.x + 1, c.y, z + 1), iso(c.x + 1, c.y + 1, z + 1), iso(c.x, c.y + 1, z + 1)];
      ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
      pts.slice(1).forEach(pt => ctx.lineTo(pt.x, pt.y));
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.lineWidth = 1;
  });

  if (pointer) {
    if (activeLayer === 'collider') drawColliderGhost();
    else {
      const p = iso(pointer.x, pointer.y, activeHeight), s = p.scale;
      if (tool === 'brush' && Number.isFinite(pointer.x) && Number.isFinite(pointer.y) && !(pointer.x < 0 || pointer.y < 0 || pointer.x >= state.width || pointer.y >= state.height)) {
        drawTile({ x: pointer.x, y: pointer.y, z: activeHeight, id: selectedTileId, shape: activeShape, layer: activeLayer, structure: activeStructure, rot: activeRot, mirror: activeMirror }, 0.38);
      }
      ctx.strokeStyle = tool === 'erase' ? '#d76670' : '#4eff91';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(p.x, p.y - s * 0.5); ctx.lineTo(p.x + s, p.y); ctx.lineTo(p.x, p.y + s * 0.5); ctx.lineTo(p.x - s, p.y); ctx.closePath(); ctx.stroke();
      ctx.lineWidth = 1;
    }
  }
  updateHud();
}

function drawColliderGhost() {
  const z = activeHeight;
  const p = iso(pointer.x, pointer.y, z);
  const s = p.scale;
  ctx.save();
  ctx.strokeStyle = '#4eff91';
  ctx.setLineDash([4, 3]);
  ctx.lineWidth = 2;

  const top = [[p.x, p.y - s * 0.5], [p.x + s, p.y], [p.x, p.y + s * 0.5], [p.x - s, p.y]];
  const left = [[p.x - s, p.y], [p.x, p.y + s * 0.5], [p.x, p.y + s * 0.5 + s * 0.56], [p.x - s, p.y + s * 0.56]];
  const right = [[p.x, p.y + s * 0.5], [p.x + s, p.y], [p.x + s, p.y + s * 0.56], [p.x, p.y + s * 0.5 + s * 0.56]];

  if (colliderTool === 'left') polyPath(left);
  else if (colliderTool === 'right') polyPath(right);
  else if (colliderTool === 'top' || colliderTool === 'tile') {
    ctx.beginPath(); ctx.moveTo(p.x, p.y - s * 0.5); ctx.lineTo(p.x + s, p.y); ctx.lineTo(p.x, p.y + s * 0.5); ctx.lineTo(p.x - s, p.y); ctx.closePath(); ctx.stroke();
  } else if (colliderTool === 'edge-x') lineGhost(p, iso(pointer.x + 1, pointer.y, z));
  else if (colliderTool === 'edge-y') lineGhost(p, iso(pointer.x, pointer.y + 1, z));
  else if (colliderTool === 'edge-z') lineGhost(p, iso(pointer.x, pointer.y, z + 1));

  ctx.restore();
}

function polyPath(points) {
  ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach(pt => ctx.lineTo(pt.x, pt.y));
  ctx.closePath(); ctx.stroke();
}

function lineGhost(a, b) {
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
}

function updateHud() {
  $('coords').textContent = pointer ? `x ${pointer.x} · y ${pointer.y}` : 'x — · y —';
  $('hudText').textContent = `${tool[0].toUpperCase() + tool.slice(1)} · ${getTile()?.name || '—'} · ${activeLayer} · z ${activeHeight}`;
}

/* ── interaction ─────────────────────────────────────────── */
function cellFromEvent(event) {
  const r = canvas.getBoundingClientRect();
  const mx = event.clientX - r.left;
  const my = event.clientY - r.top;
  const zero = iso(0, 0, activeHeight), s = zero.scale;
  const u = (mx - canvas.width / 2 - panX) / s;
  const v = (my - (canvas.height * 0.58 + panY - state.width * 0.52 * s * 0.5) + activeHeight * s) / (s * 0.5);
  return { x: Math.floor((v + u) / 2), y: Math.floor((v - u) / 2) };
}

function pointCellFromEvent(event) {
  const cell = cellFromEvent(event);
  pointer = cell;
  draw();
  return cell;
}

canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('pointerdown', e => {
  canvas.setPointerCapture(e.pointerId);
  if (panMode || e.button === 1) {
    panning = true;
    panStart = { x: e.clientX, y: e.clientY, px: panX, py: panY };
    canvas.style.cursor = 'grabbing';
    return;
  }
  const cell = pointCellFromEvent(e);
  drawing = true;
  lastPaint = '';
  if (activeLayer === 'collider' && colliderTool.startsWith('edge-') && e.button === 0) {
    addEdgeCollider(cell);
    drawing = false;
    return;
  }
  if (e.button === 2 || tool === 'erase') paint(cell, true);
  else if (tool === 'fill') { fill(cell); drawing = false; commit(); }
  else paint(cell);
  draw();
});
canvas.addEventListener('pointermove', e => {
  if (panning && panStart) {
    panX = panStart.px + (e.clientX - panStart.x);
    panY = panStart.py + (e.clientY - panStart.y);
    draw();
    return;
  }
  const cell = pointCellFromEvent(e);
  if (drawing && (e.buttons & 1 || e.buttons & 2)) paint(cell, (e.buttons & 2) || tool === 'erase');
  draw();
});
canvas.addEventListener('pointerup', () => {
  if (panning) { panning = false; panStart = null; canvas.style.cursor = panMode ? 'grab' : 'crosshair'; return; }
  if (drawing) { drawing = false; commit(); }
});
canvas.addEventListener('pointerleave', () => { pointer = null; draw(); });

/* ── controls ────────────────────────────────────────────── */
$('tools').addEventListener('click', e => {
  const b = e.target.closest('[data-tool]'); if (!b) return;
  tool = b.dataset.tool;
  syncToolUI();
  draw();
});
$('shapes').addEventListener('click', e => {
  const st = e.target.closest('[data-structure]');
  if (st) { activeStructure = st.dataset.structure; activeShape = 'structure'; syncToolUI(); draw(); return; }
  const b = e.target.closest('[data-shape]'); if (!b) return;
  activeStructure = null;
  activeShape = b.dataset.shape;
  syncToolUI();
  draw();
});
$('layers').addEventListener('click', e => {
  const b = e.target.closest('[data-layer]'); if (!b) return;
  activeLayer = b.dataset.layer;
  document.querySelectorAll('[data-layer]').forEach(x => x.classList.toggle('active', x === b));
  syncLayerOptions();
  draw();
});
$('colliderTools').addEventListener('click', e => {
  const b = e.target.closest('[data-collider]'); if (!b) return;
  colliderTool = b.dataset.collider;
  document.querySelectorAll('[data-collider]').forEach(x => x.classList.toggle('active', x === b));
});
$('rotateBtn')?.addEventListener('click', () => { activeRot = (activeRot + 1) % 4; if ($('rotVal')) $('rotVal').textContent = activeRot * 90 + '°'; renderShapes(); syncToolUI(); draw(); });
$('mirrorBtn')?.addEventListener('click', () => { activeMirror = !activeMirror; $('mirrorBtn').classList.toggle('active', activeMirror); renderShapes(); syncToolUI(); draw(); });
$('brush').oninput = () => { $('brushValue').textContent = $('brush').value + '×' + $('brush').value; draw(); };
$('heightDown').onclick = () => { activeHeight = Math.max(0, activeHeight - 1); $('heightValue').textContent = activeHeight; draw(); };
$('heightUp').onclick = () => { activeHeight = Math.min(8, activeHeight + 1); $('heightValue').textContent = activeHeight; draw(); };
$('resize').onclick = () => {
  state.width = Math.max(4, Math.min(120, Number($('width').value) || state.width));
  state.height = Math.max(4, Math.min(120, Number($('height').value) || state.height));
  state.tiles = state.tiles.filter(t => t.x < state.width && t.y < state.height);
  renderInputs(); commit(); draw(); say(`Resized scene to <b>${state.width} × ${state.height}</b>.`);
};
$('clear').onclick = () => {
  if (confirm('Clear every painted tile?')) { state.tiles = []; state.colliders = []; commit(); draw(); say('Cleared all layers.'); }
};
$('undo').onclick = undo;
$('redo').onclick = redo;
$('save').onclick = () => { saveScene(); saveLibrary(); say('Scene and tile library saved in this browser.'); };
$('load').onclick = () => { state = loadScene(); library = loadLibrary(); selectedTileId = library.tiles[0]?.id; selectedGroupId = library.groups[0]?.id; history = []; historyIndex = -1; commit(); renderInputs(); renderGroups(); renderPalette(); if (selectedTileId) selectTile(selectedTileId); draw(); };
$('export').onclick = () => download('pixel-isometric-scene.json', new Blob([JSON.stringify(projectExport(), null, 2)], { type: 'application/json' }));
$('png').onclick = () => canvas.toBlob(blob => download('pixel-isometric-scene.png', blob));
$('chooseFile').onclick = () => $('file').click();
$('file').onchange = async e => {
  const file = e.target.files[0]; if (!file) return;
  try { importScene(await file.text()); } catch (_) { say('<b>Could not load that JSON.</b>'); }
  e.target.value = '';
};

$('setSelect').onchange = e => { selectedSetId = e.target.value; renderSets(); renderGroups(); renderPalette(); };
$('newSet').onclick = newSet;
$('duplicateSet').onclick = duplicateSet;
$('deleteSet').onclick = deleteSet;
$('groupSelect').onchange = e => { selectedGroupId = e.target.value; renderGroups(); renderPalette(); };
$('newGroup').onclick = newGroup;
$('duplicateGroup').onclick = duplicateGroup;
$('deleteGroup').onclick = deleteGroup;
$('applyGroup').onclick = applyDesignerToGroup;
$('deleteTile').onclick = deleteTile;
$('saveTile').onclick = saveTile;
$('updateTile').onclick = updateTile;

$('btn-pan').onclick = () => {
  panMode = !panMode;
  $('btn-pan').classList.toggle('active', panMode);
  canvas.style.cursor = panMode ? 'grab' : 'crosshair';
};
$('btn-zoom-in').onclick = () => { zoom = Math.min(2.5, zoom * 1.15); draw(); };
$('btn-zoom-out').onclick = () => { zoom = Math.max(0.4, zoom / 1.15); draw(); };
$('btn-zoom-reset').onclick = () => { zoom = 1; panX = 0; panY = 0; draw(); };

const designerInputs = ['tileName', 'tileTop', 'tileBottom', 'tileSplit', 'topMode', 'topInk', 'topBright', 'topSpace', 'topThick', 'topBlend', 'topBlendMode', 'bottomMode', 'bottomInk', 'bottomBright', 'bottomSpace', 'bottomThick', 'bottomBlend', 'bottomBlendMode'];
designerInputs.forEach(id => {
  const el = $(id); if (!el) return;
  el.addEventListener('input', () => { updateDesignerLabels(); drawDesignerPreview(); });
  el.addEventListener('change', () => { updateDesignerLabels(); drawDesignerPreview(); });
});

/* ── import/export ───────────────────────────────────────── */
function projectExport() {
  return {
    format: 'town-tilemap', version: 2, width: state.width, height: state.height, tileSize: 32,
    drawOrder: ['background', 'isometric'],
    layers: [
      { id: 'background', name: 'Background', data: new Array(state.width * state.height).fill(0) },
      { id: 'isometric', name: 'Isometric scene tiles', data: state.tiles },
      { id: 'collider', name: 'Collider overlays', data: state.colliders },
    ],
    isometricScene: { version: 1, tiles: state.tiles, colliders: state.colliders },
    tileLibrary: library,
  };
}

function download(name, blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function importScene(raw) {
  const data = JSON.parse(raw);
  if (data.isometricScene) {
    state = { ...defaultScene(), width: data.width, height: data.height, tiles: (data.isometricScene.tiles || []).map(t => ({ ...t, layer: t.layer || 'ground', shape: t.shape || 'cube' })), colliders: data.isometricScene.colliders || [] };
    if (data.tileLibrary?.tiles) {
      library = data.tileLibrary;
      library.sets = library.sets || clone(DEFAULT_SETS);
      library.groups = library.groups || clone(DEFAULT_GROUPS);
      library.tiles = library.tiles.map(normalizeTile);
      selectedTileId = library.tiles[0]?.id;
      selectedGroupId = library.groups?.[0]?.id;
      selectedSetId = library.groups?.[0]?.setId || library.sets[0]?.id;
    }
  } else if (['town-tilemap', 'brighton-tilemap'].includes(data.format)) {
    state = defaultScene();
    state.width = data.width;
    state.height = data.height;
    const ground = data.layers?.find(layer => layer.id === 'bg' || layer.id === 'background' || /ground/i.test(layer.name))?.data || [];
    ground.forEach((value, index) => {
      if (value) state.tiles.push({ x: index % state.width, y: Math.floor(index / state.width), z: 0, id: 'grass', shape: 'cube', layer: 'ground' });
    });
  } else throw new Error('Unsupported format');
  history = []; historyIndex = -1;
  commit(); renderInputs(); renderGroups(); renderPalette();
  if (selectedTileId) selectTile(selectedTileId);
  draw();
  say('Loaded scene data and tile library.');
}

/* ── boot ────────────────────────────────────────────────── */
function renderInputs() {
  $('width').value = state.width;
  $('height').value = state.height;
  $('brushValue').textContent = $('brush').value + '×' + $('brush').value;
  $('heightValue').textContent = activeHeight;
}

function syncToolUI() {
  document.querySelectorAll('[data-tool]').forEach(b => b.classList.toggle('active', b.dataset.tool === tool));
  document.querySelectorAll('[data-shape]').forEach(b => b.classList.toggle('active', !activeStructure && b.dataset.shape === activeShape));
  document.querySelectorAll('[data-structure]').forEach(b => b.classList.toggle('active', b.dataset.structure === activeStructure));
  canvas.style.cursor = tool === 'fill' ? 'cell' : tool === 'erase' ? 'not-allowed' : 'crosshair';
  syncLayerOptions();
}

function syncLayerOptions() {
  const tileOptions = $('tileOptions');
  const colliderOptions = $('colliderTools');
  if (tileOptions) tileOptions.style.display = activeLayer === 'collider' ? 'none' : 'block';
  if (colliderOptions) colliderOptions.style.display = activeLayer === 'collider' ? 'grid' : 'none';
}

addEventListener('keydown', e => {
  if (/INPUT|SELECT/.test(e.target.tagName)) return;
  const key = e.key.toLowerCase();
  if ((e.metaKey || e.ctrlKey) && key === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if ((e.metaKey || e.ctrlKey) && key === 'y') { e.preventDefault(); redo(); return; }
  if ({ b: 'brush', e: 'erase', f: 'fill' }[key]) { tool = { b: 'brush', e: 'erase', f: 'fill' }[key]; syncToolUI(); draw(); }
  if (key === 'r' && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); $('rotateBtn')?.click(); }
  if (key === 'm' && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); $('mirrorBtn')?.click(); }
});

addEventListener('resize', draw);

renderInputs();
renderSets();
renderGroups();
renderPalette();
renderShapes();
syncToolUI();
if (selectedTileId) loadDesignerFromTile(getTile(selectedTileId));
drawDesignerPreview();
commit();
draw();
