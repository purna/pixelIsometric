import { DEFAULT_TILES, dither } from '../scene-studio/config.js';
import { normalizeTile, faceTexture, drawTextureQuad, drawTextureTri, shade, tilePreviewURL } from '../scene-studio/textures.js';
import { STRUCTURE_GROUPS, STRUCTURES_WITH_90, getStructure, drawStructure, structurePreviewURL } from '../scene-studio/structures.js';

const $ = id => document.getElementById(id);
const canvas = $('scene');
const ctx = canvas.getContext('2d');
const SCENE_KEY = 'pixelIsometric.desertBuilder.v1';
const LAYER_RANK = { ground: 0, decoration: 1, structure: 2 };

/* ── desert tile set ─────────────────────────────────────── */
const clone = value => JSON.parse(JSON.stringify(value));
const RECOLOR = {
  'mossy-flagstone': ['#d2b47a', '#9c7c4c', 55],
  'plank-floor': ['#a86b45', '#6f4430', 50],
  'plank-floor-worn': ['#8a5238', '#5a3424', 50],
  'courtyard-water': ['#4fb3c4', '#267b8a', 62],
  'moss-block': ['#c79a5c', '#8a6337', 52],
  'moss-block-light': ['#ddb877', '#a57a45', 52],
  'stone-steps-town': ['#c9a266', '#8d6a3e', 48],
  'stone-pillar': ['#c9a266', '#8d6a3e', 55],
  'stone-well': ['#d2b47a', '#9c7c4c', 50],
  'plaster-stone-wall': ['#e0b96e', '#a57a45', 60],
  'timber-wall': ['#a86b45', '#6f4430', 55],
  'timber-trim': ['#8a5238', '#5a3424', 58],
  'lattice-window': ['#8a5238', '#5a3424', 70],
  'door-wood': ['#7a4a30', '#4f2f1e', 50],
  'doorway-dark': ['#4a3526', '#2e2018', 50],
  'roof-shingle-red': ['#b5613f', '#7d3f2a', 50],
  'roof-shingle-plum': ['#8a5a4a', '#5d3a2e', 50],
  'roof-ridge': ['#b98a62', '#7a5238', 48],
  'gable-plaster': ['#e0b96e', '#c79a5c', 55],
  'table-wood': ['#a86b45', '#6f4430', 40],
  'stool-wood': ['#8a5238', '#5a3424', 45],
  'planter-soil': ['#6b4a2f', '#4a3320', 55],
  'desert-sand': ['#e0b96e', '#9a6a32', 50],
  'sandstone': ['#d3a466', '#8a6337', 55],
  'desert-roof': ['#b97f4d', '#6b4327', 52],
  'paving': ['#c2a276', '#7d674a', 55],
  'brick-pale': ['#d8c39a', '#8f7a59', 52],
  'dirt': ['#b08a5a', '#6b4a2f', 55],
  'sand': ['#ecd394', '#b8944f', 48],
  'water': ['#4fb3c4', '#267b8a', 62]
};
function extraTile(id, name, groupId, top, bottom, split, topDither, bottomDither) {
  return { id, name, groupId, top, bottom, split, topDither, bottomDither };
}
const EXTRA_TILES = [
  extraTile('dune-sand', 'Dune Sand', 'desert-ground', '#e8cf8e', '#b8944f', 55,
    dither('noise', 'bright', 62, 44, 28, 58), dither('lines', 'dark', 50, 34, 24, 60, 'multiply')),
  extraTile('cracked-earth', 'Cracked Earth', 'desert-ground', '#c09760', '#7a5634', 52,
    dither('paving', 'dark', 48, 38, 24, 64, 'multiply'), dither('noise', 'dark', 46, 46, 32, 60)),
  extraTile('oasis-water', 'Oasis Water', 'desert-ground', '#4fb3c4', '#267b8a', 62,
    dither('lines', 'bright', 58, 26, 22, 55), dither('solid', 'dark', 42, 44, 30, 55)),
  extraTile('palm-wood', 'Palm Wood', 'desert-build', '#9a6b3f', '#5d3d24', 50,
    dither('lines', 'dark', 52, 30, 24, 62, 'multiply'), dither('plank', 'dark', 48, 36, 22, 60, 'multiply')),
  extraTile('palm-leaf', 'Palm Leaf', 'desert-build', '#5f8a4a', '#3b5c32', 58,
    dither('crosshatch', 'bright', 52, 34, 26, 62), dither('noise', 'dark', 46, 44, 30, 60, 'multiply'))
];
function makeDesertTiles() {
  const tiles = DEFAULT_TILES.map(clone);
  const byId = new Map(tiles.map(t => [t.id, t]));
  Object.entries(RECOLOR).forEach(([id, [top, bottom, split]]) => {
    const tile = byId.get(id);
    if (tile) Object.assign(tile, { top, bottom, split });
  });
  const all = [...tiles, ...EXTRA_TILES.map(clone)];
  applyExample3Edits(all);
  all.forEach(normalizeTile);
  return all;
}
/** Pick up tile edits saved by demos/example3 (the full tile editor). */
function applyExample3Edits(tiles) {
  try {
    const saved = JSON.parse(localStorage.getItem('pixelIsometric.sceneStudio.tileEdits.v1') || 'null');
    if (!saved || !saved.tiles) return;
    const byId = new Map(tiles.map(t => [t.id, t]));
    Object.entries(saved.tiles).forEach(([id, edit]) => {
      const tile = byId.get(id);
      if (!tile || !edit) return;
      if (typeof edit.name === 'string' && edit.name.trim()) tile.name = edit.name.trim().slice(0, 40);
      if (/^#[0-9a-f]{6}$/i.test(edit.top || '')) tile.top = edit.top;
      if (/^#[0-9a-f]{6}$/i.test(edit.bottom || '')) tile.bottom = edit.bottom;
      if (Number.isFinite(+edit.split)) tile.split = Math.max(0, Math.min(100, Math.round(+edit.split)));
      if (edit.topDither && typeof edit.topDither === 'object') tile.topDither = { ...tile.topDither, ...edit.topDither };
      if (edit.bottomDither && typeof edit.bottomDither === 'object') tile.bottomDither = { ...tile.bottomDither, ...edit.bottomDither };
    });
  } catch (_) { /* storage unavailable */ }
}
const TILES = makeDesertTiles();
const TILE_BY_ID = new Map(TILES.map(t => [t.id, t]));
const tileOf = id => TILE_BY_ID.get(id) || TILES[0];

const PALETTE_IDS = [
  'desert-sand', 'dune-sand', 'cracked-earth', 'sandstone', 'paving',
  'brick-pale', 'dirt', 'sand', 'oasis-water', 'palm-wood', 'palm-leaf'
];

/* ── state ───────────────────────────────────────────────── */
function defaultScene() { return { width: 30, height: 24, tiles: [] }; }
let state = defaultScene();
let history = [];
let historyIndex = -1;
let tool = 'brush';
let activeTile = 'desert-sand';
let activeShape = 'plane';
let activeStructure = null;
let activeRot = 0;
let activeMirror = false;
let activeLayer = 'ground';
let activeHeight = 0;
let terrainFill = true;
let peakZ = 0;
let brushSize = 1;
const MAX_LEVEL = 10;
let pointer = null;
let drawing = false;
let lastPaint = '';

function say(message) { $('status').innerHTML = message; }
function snapshot() { return JSON.stringify(state); }
function saveLocal() { try { localStorage.setItem(SCENE_KEY, snapshot()); } catch (_) {} }
function updateHistory() {
  $('undo').disabled = historyIndex <= 0;
  $('redo').disabled = historyIndex >= history.length - 1;
}
function commit() {
  const now = snapshot();
  if (history[historyIndex] === now) return;
  history = history.slice(0, historyIndex + 1);
  history.push(now);
  if (history.length > 80) history.shift();
  historyIndex = history.length - 1;
  saveLocal();
  updateHistory();
  renderLevels();
}
function restore(raw) { state = JSON.parse(raw); syncInputs(); renderLevels(); draw(); saveLocal(); }
function undo() { if (historyIndex > 0) { restore(history[--historyIndex]); updateHistory(); say('Undid last change.'); } }
function redo() { if (historyIndex < history.length - 1) { restore(history[++historyIndex]); updateHistory(); say('Redid change.'); } }
function loadLocal() {
  try {
    const raw = localStorage.getItem(SCENE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.tiles)) return false;
    state = { ...defaultScene(), ...data };
    return true;
  } catch (_) { return false; }
}

/* ── scene helpers ───────────────────────────────────────── */
function tileAt(x, y, z = activeHeight, layer = activeLayer) {
  return state.tiles.find(t => t.x === x && t.y === y && t.z === z && t.layer === layer);
}
function setTile(x, y, z, id, shape = activeShape, layer = activeLayer, structure = activeStructure, rot = activeRot, mirror = activeMirror) {
  const i = state.tiles.findIndex(t => t.x === x && t.y === y && t.z === z && t.layer === layer);
  if (id) {
    const data = { id, shape, layer, structure: structure || null, rot: rot || 0, mirror: !!mirror };
    if (i < 0) state.tiles.push({ x, y, z, ...data });
    else Object.assign(state.tiles[i], data);
  } else if (i >= 0) state.tiles.splice(i, 1);
}
function paint(cell, erase = false) {
  if (cell.x < 0 || cell.y < 0 || cell.x >= state.width || cell.y >= state.height) return;
  const radius = (brushSize - 1) / 2;
  const key = `${cell.x},${cell.y},${activeHeight},${erase ? 'e' : 'p'},${activeLayer}`;
  if (key === lastPaint) return;
  lastPaint = key;
  for (let y = cell.y - radius; y <= cell.y + radius; y++) {
    for (let x = cell.x - radius; x <= cell.x + radius; x++) {
      if (x < 0 || y < 0 || x >= state.width || y >= state.height) continue;
      setTile(x, y, activeHeight, erase ? null : activeTile, activeShape, activeLayer);
    }
  }
  draw();
}
function fill(cell) {
  if (cell.x < 0 || cell.y < 0 || cell.x >= state.width || cell.y >= state.height) return;
  const startTile = tileAt(cell.x, cell.y);
  const start = startTile ? `${startTile.id}|${startTile.shape}|${startTile.structure || ''}` : null;
  const target = `${activeTile}|${activeShape}|${activeStructure || ''}`;
  if (start === target) return;
  const todo = [cell], seen = new Set();
  while (todo.length) {
    const cur = todo.pop(), key = `${cur.x},${cur.y}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (cur.x < 0 || cur.y < 0 || cur.x >= state.width || cur.y >= state.height) continue;
    const t = tileAt(cur.x, cur.y);
    const sig = t ? `${t.id}|${t.shape}|${t.structure || ''}` : null;
    if (sig !== start) continue;
    setTile(cur.x, cur.y, activeHeight, activeTile, activeShape, activeLayer);
    todo.push({ x: cur.x + 1, y: cur.y }, { x: cur.x - 1, y: cur.y }, { x: cur.x, y: cur.y + 1 }, { x: cur.x, y: cur.y - 1 });
  }
  draw();
}

/* ── rendering ───────────────────────────────────────────── */
function refreshPeak() {
  peakZ = state.tiles.reduce((m, t) => Math.max(m, t.z || 0), 0);
}
function viewLift(s) { return Math.max(0, peakZ - 2) * s * 0.22; }
function iso(x, y, z) {
  const base = Math.max(10, Math.min(30, Math.min(canvas.width / (state.width + state.height + 4), canvas.height / (state.width + state.height + 5)) * 1.35));
  const scale = base;
  return {
    x: canvas.width / 2 + (x - y) * scale,
    y: canvas.height * 0.56 + (x + y - state.width * 0.52) * scale * 0.5 - z * scale + viewLift(scale),
    scale
  };
}
const groundSpriteCache = new Map();
function groundSprite(data, s) {
  const key = `${data.id}|${Math.round(s * 2)}`;
  const cached = groundSpriteCache.get(key);
  if (cached) return cached;
  const W = Math.max(2, Math.ceil(2 * s));
  const H = Math.max(1, Math.ceil(s));
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  drawTextureQuad(g, [[W / 2, 0], [W, H / 2], [W / 2, H], [0, H / 2]], faceTexture(data, 'top'));
  groundSpriteCache.set(key, c);
  return c;
}
function fillPoly(points, fill, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  points.forEach((pt, i) => (i ? ctx.lineTo(pt[0], pt[1]) : ctx.moveTo(pt[0], pt[1])));
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.34)';
  ctx.stroke();
  ctx.restore();
}
function drawTile(tile, alpha = 1) {
  const data = tileOf(tile.id);
  const p = iso(tile.x, tile.y, tile.z);
  const s = p.scale;
  const shape = tile.shape || 'plane';
  if (tile.structure) {
    const structure = getStructure(tile.structure);
    if (structure) {
      drawStructure(ctx, structure, TILES, {
        x: p.x, y: p.y + s * 0.5, S: s,
        rot: ((tile.rot || 0) % 4 + 4) % 4,
        mirror: !!tile.mirror,
        alpha
      });
      return;
    }
  }
  const top = [[p.x, p.y - s * 0.5], [p.x + s, p.y], [p.x, p.y + s * 0.5], [p.x - s, p.y]];
  if (shape === 'plane') {
    if (alpha >= 1 && terrainFill && tile.z > 0) {
      const H = tile.z * s;
      const left = [[p.x - s, p.y], [p.x, p.y + s * 0.5], [p.x, p.y + s * 0.5 + H], [p.x - s, p.y + H]];
      const right = [[p.x, p.y + s * 0.5], [p.x + s, p.y], [p.x + s, p.y + H], [p.x, p.y + s * 0.5 + H]];
      fillPoly(left, shade(data.top, -0.2), alpha);
      fillPoly(right, shade(data.top, -0.06), alpha);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = 'rgba(0,0,0,.22)';
      for (let k = 1; k < tile.z; k++) {
        const y = p.y + k * s;
        ctx.beginPath();
        ctx.moveTo(p.x - s, y);
        ctx.lineTo(p.x, y + s * 0.5);
        ctx.lineTo(p.x + s, y);
        ctx.stroke();
      }
      ctx.restore();
    }
    if (alpha < 1) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = data.top;
      ctx.beginPath();
      top.forEach((pt, i) => (i ? ctx.lineTo(pt[0], pt[1]) : ctx.moveTo(pt[0], pt[1])));
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.45)';
      ctx.stroke();
      ctx.restore();
      return;
    }
    const sprite = groundSprite(data, s);
    ctx.drawImage(sprite, p.x - sprite.width / 2, p.y - sprite.height / 2);
    return;
  }
  if (shape === 'ramp') {
    const r = ((tile.rot || 0) % 4 + 4) % 4;
    const rotUV = (u, v) => [[u, v], [-v, u], [-u, -v], [v, -u]][r];
    const P = (lx, ly, lz) => {
      const [u, v] = rotUV(lx - 0.5, ly - 0.5);
      return iso(tile.x + 0.5 + u, tile.y + 0.5 + v, tile.z + lz);
    };
    const q = (pts, face) => drawTextureQuad(ctx, pts.map(pt => [pt.x, pt.y]), faceTexture(data, face), alpha);
    const t = (pts, face) => drawTextureTri(ctx, pts.map(pt => [pt.x, pt.y]), faceTexture(data, face), alpha);
    const A = P(0, 0, 0), B = P(1, 0, 0), C = P(1, 1, 0), D = P(0, 1, 0), E = P(0, 0, 1), F = P(0, 1, 1);
    t([A, B, E], 'left');
    t([C, D, F], 'right');
    q([A, E, F, D], 'left');
    q([B, C, F, E], 'top');
    return;
  }
  const h = s * (terrainFill ? 1 : 0.56);
  const left = [[p.x - s, p.y], [p.x, p.y + s * 0.5], [p.x, p.y + s * 0.5 + h], [p.x - s, p.y + h]];
  const right = [[p.x, p.y + s * 0.5], [p.x + s, p.y], [p.x + s, p.y + h], [p.x, p.y + s * 0.5 + h]];
  drawTextureQuad(ctx, left, faceTexture(data, 'left'), alpha);
  drawTextureQuad(ctx, right, faceTexture(data, 'right'), alpha);
  drawTextureQuad(ctx, top, faceTexture(data, 'top'), alpha);
}
function draw() {
  const rect = canvas.getBoundingClientRect();
  if (canvas.width !== Math.max(1, Math.floor(rect.width)) || canvas.height !== Math.max(1, Math.floor(rect.height))) {
    canvas.width = Math.max(1, Math.floor(rect.width));
    canvas.height = Math.max(1, Math.floor(rect.height));
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, '#191610');
  sky.addColorStop(1, '#0b0a08');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < state.height; y++) {
    for (let x = 0; x < state.width; x++) {
      const p = iso(x, y, activeHeight), s = p.scale;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - s * 0.5); ctx.lineTo(p.x + s, p.y);
      ctx.lineTo(p.x, p.y + s * 0.5); ctx.lineTo(p.x - s, p.y);
      ctx.closePath();
      ctx.strokeStyle = 'rgba(255,220,160,.055)';
      ctx.stroke();
    }
  }

  refreshPeak();
  state.tiles
    .slice()
    .sort((a, b) => (LAYER_RANK[a.layer] - LAYER_RANK[b.layer]) || ((a.x + a.y) - (b.x + b.y)) || ((a.z || 0) - (b.z || 0)))
    .forEach(t => drawTile(t));

  if (pointer) {
    const p = iso(pointer.x, pointer.y, activeHeight), s = p.scale;
    if (tool === 'brush' && Number.isFinite(pointer.x) && Number.isFinite(pointer.y) &&
        !(pointer.x < 0 || pointer.y < 0 || pointer.x >= state.width || pointer.y >= state.height)) {
      drawTile({ x: pointer.x, y: pointer.y, z: activeHeight, id: activeTile, shape: activeShape, layer: activeLayer, structure: activeStructure, rot: activeRot, mirror: activeMirror }, 0.4);
    }
    ctx.strokeStyle = tool === 'erase' ? '#d76670' : '#e0b23e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - s * 0.5); ctx.lineTo(p.x + s, p.y);
    ctx.lineTo(p.x, p.y + s * 0.5); ctx.lineTo(p.x - s, p.y);
    ctx.closePath(); ctx.stroke();
    ctx.lineWidth = 1;
  }
  updateHud();
}

/* ── palette ─────────────────────────────────────────────── */
function renderTilePalette() {
  const holder = $('tilePalette');
  holder.innerHTML = '';
  PALETTE_IDS.forEach(id => {
    const tile = tileOf(id);
    if (!tile) return;
    const b = document.createElement('button');
    b.className = 'tile' + (!activeStructure && activeTile === id ? ' active' : '');
    b.dataset.tile = id;
    b.title = tile.name;
    b.innerHTML = `<i style="background-image:url(${tilePreviewURL(tile)});background-size:cover"></i>${tile.name}`;
    b.onclick = () => {
      activeTile = id;
      activeStructure = null;
      activeShape = ['plane', 'cube', 'ramp'].includes(activeShape) ? activeShape : 'plane';
      activeLayer = 'ground';
      syncUI();
      draw();
      say(`Selected <b>${tile.name}</b>.`);
    };
    holder.appendChild(b);
  });
}
function renderStructurePalette() {
  const holder = $('structurePalette');
  holder.innerHTML = '';
  STRUCTURE_GROUPS.forEach(group => {
    const list = STRUCTURES_WITH_90.filter(s => s.group === group.id);
    if (!list.length) return;
    const wrap = document.createElement('div');
    wrap.className = 'struct-group';
    wrap.innerHTML = `<h3>${group.name}</h3>`;
    const grid = document.createElement('div');
    grid.className = 'struct-grid';
    list.forEach(structure => {
      const b = document.createElement('button');
      b.className = 'struct-btn' + (activeStructure === structure.id ? ' active' : '');
      b.dataset.structure = structure.id;
      b.title = structure.name;
      b.innerHTML = `<img alt="" src="${structurePreviewURL(structure, TILES, { w: 64, h: 50, S: 18 })}"><span>${structure.name}</span>`;
      b.onclick = () => {
        activeStructure = structure.id;
        activeShape = 'structure';
        activeLayer = 'structure';
        syncUI();
        draw();
        say(`Selected <b>${structure.name}</b>. Paint with it, or press Rotate first.`);
      };
      grid.appendChild(b);
    });
    wrap.appendChild(grid);
    holder.appendChild(wrap);
  });
}

/* ── UI sync + events ────────────────────────────────────── */
function syncUI() {
  document.querySelectorAll('[data-tool]').forEach(b => b.classList.toggle('active', b.dataset.tool === tool));
  document.querySelectorAll('[data-shape]').forEach(b => b.classList.toggle('active', !activeStructure && b.dataset.shape === activeShape));
  document.querySelectorAll('[data-layer]').forEach(b => b.classList.toggle('active', b.dataset.layer === activeLayer));
  document.querySelectorAll('[data-tile]').forEach(b => b.classList.toggle('active', !activeStructure && b.dataset.tile === activeTile));
  document.querySelectorAll('[data-structure]').forEach(b => b.classList.toggle('active', b.dataset.structure === activeStructure));
  canvas.style.cursor = tool === 'fill' ? 'cell' : tool === 'erase' ? 'not-allowed' : 'crosshair';
}
function syncInputs() {
  $('width').value = state.width;
  $('height').value = state.height;
  $('levelValue').textContent = activeHeight;
  $('brushValue').textContent = brushSize + '×' + brushSize;
  $('rotVal').textContent = activeRot * 90 + '°';
  const fillBtn = $('terrainFill');
  if (fillBtn) {
    fillBtn.textContent = terrainFill ? 'Columns on' : 'Columns off';
    fillBtn.classList.toggle('active', terrainFill);
  }
}
function renderLevels() {
  const holder = $('levelList');
  if (!holder) return;
  const counts = new Map();
  state.tiles.forEach(t => {
    const z = Math.round(t.z || 0);
    if (Math.abs((t.z || 0) - z) < 0.01) counts.set(z, (counts.get(z) || 0) + 1);
  });
  const usedTop = Math.max(0, ...counts.keys());
  const top = Math.max(3, Math.min(MAX_LEVEL, usedTop + 1));
  holder.innerHTML = '';
  for (let z = top; z >= 0; z--) {
    const b = document.createElement('button');
    b.className = 'level-btn' + (z === activeHeight ? ' active' : '');
    b.dataset.level = z;
    const count = counts.get(z) || 0;
    b.innerHTML = `<span>Level ${z}${z === 0 ? ' · base' : ''}</span><span class="level-count">${count} tile${count === 1 ? '' : 's'}</span>`;
    b.onclick = () => { activeHeight = z; syncInputs(); renderLevels(); draw(); };
    holder.appendChild(b);
  }
}
function updateHud() {
  $('coords').textContent = pointer ? `x ${pointer.x} · y ${pointer.y}` : 'x — · y —';
  const name = activeStructure ? (getStructure(activeStructure)?.name || 'Structure') : tileOf(activeTile).name;
  $('hudText').textContent = `${tool[0].toUpperCase() + tool.slice(1)} · ${name} · ${activeLayer} · z ${activeHeight}`;
}
function cellFromEvent(event) {
  const r = canvas.getBoundingClientRect();
  const mx = event.clientX - r.left, my = event.clientY - r.top;
  const zero = iso(0, 0, activeHeight), s = zero.scale;
  const sx = mx - canvas.width / 2;
  const sy = my - (canvas.height * 0.56 - state.width * 0.52 * s * 0.5) - viewLift(s) + activeHeight * s;
  return {
    x: Math.floor((sy / (s * 0.5) + sx / s) / 2),
    y: Math.floor((sy / (s * 0.5) - sx / s) / 2)
  };
}

/* ── examples ────────────────────────────────────────────── */
function addT(list, x, y, z, id, shape = 'plane', layer = 'ground', extra = null) {
  const t = { x, y, z, id, shape, layer };
  if (extra) Object.assign(t, extra);
  list.push(t);
  return t;
}
function addStructure(list, x, y, z, id, rot = 0, mirror = false) {
  return addT(list, x, y, z, 'sandstone', 'structure', 'structure', { structure: id, rot, mirror });
}
function addPalm(list, x, y, base = 0) {
  addT(list, x, y, base + 1.3, 'palm-wood', 'pillar', 'decoration');
  addT(list, x, y, base + 1.35, 'palm-leaf', 'roof', 'decoration');
}
function setGround(list, x, y, id) {
  const t = list.find(tile => tile.x === x && tile.y === y && tile.z === 0 && tile.layer === 'ground');
  if (t) t.id = id;
}
function heightField(list, w, h, fn, tileFor) {
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const z = Math.max(0, Math.min(MAX_LEVEL, Math.round(fn(x, y))));
      if (z > 0) addT(list, x, y, z, tileFor ? tileFor(z, x, y) : 'dune-sand', 'plane', 'ground');
    }
  }
}
function baseSand(w, h, variant) {
  const tiles = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let id = 'desert-sand';
      const n = (x * 7 + y * 13 + x * y) % 19;
      if (variant === 'oasis' && n < 4) id = 'cracked-earth';
      if (variant === 'ruins' && n < 3) id = 'dirt';
      if (variant === 'ruins' && n === 3) id = 'paving';
      if (variant === 'dunes' && n < 6) id = 'dune-sand';
      addT(tiles, x, y, 0, id, 'plane', 'ground');
    }
  }
  return tiles;
}
function oasisScene() {
  const w = 30, h = 24;
  const tiles = baseSand(w, h, 'oasis');
  const cx = 15, cy = 12;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const d = Math.hypot(x - cx, (y - cy) * 1.25);
      const t = tiles.find(tile => tile.x === x && tile.y === y && tile.z === 0 && tile.layer === 'ground');
      if (!t) continue;
      if (d < 3.1) t.id = 'oasis-water';
      else if (d < 4.2) t.id = 'cracked-earth';
      else if (d < 5.0) t.id = 'dune-sand';
    }
  }
  addStructure(tiles, cx - 5, cy - 3, 0, 'well');
  addStructure(tiles, cx + 5, cy - 3, 0, 'table', 0);
  addStructure(tiles, cx + 4, cy - 2, 0, 'stool', 0);
  addStructure(tiles, cx - 6, cy + 4, 0, 'block-moss', 0);
  addStructure(tiles, cx + 6, cy + 4, 0, 'pillar-short', 0);
  [[cx - 4, cy + 1], [cx - 6, cy - 1], [cx + 4, cy + 2], [cx + 6, cy + 5]].forEach(([x, y]) => addPalm(tiles, x, y));
  [[cx - 8, cy + 6], [cx + 8, cy - 5], [cx + 2, cy + 7]].forEach(([x, y]) => addStructure(tiles, x, y, 0, 'block-light', 0));
  return { width: w, height: h, tiles };
}
function ruinsScene() {
  const w = 30, h = 24;
  const tiles = baseSand(w, h, 'ruins');
  // broken perimeter wall
  for (let x = 6; x <= 16; x++) {
    if (x === 11) addStructure(tiles, x, 7, 0, 'wall-doorway', 0);
    else if (x === 14) addStructure(tiles, x, 7, 0, 'wall-window', 0);
    else if (x !== 9 && x !== 15) addStructure(tiles, x, 7, 0, 'wall-plain', 0);
  }
  for (let y = 8; y <= 15; y++) {
    if (y !== 11 && y !== 12) addStructure(tiles, 6, y, 0, 'wall-plain', 1);
    if (y !== 13) addStructure(tiles, 16, y, 0, 'wall-plain', 1);
  }
  addStructure(tiles, 11, 13, 0, 'steps', 0);
  addStructure(tiles, 9, 12, 0, 'pillar-tall', 0);
  addStructure(tiles, 13, 12, 0, 'pillar-tall', 0);
  addStructure(tiles, 9, 10, 0, 'pillar-short', 0);
  addStructure(tiles, 13, 10, 0, 'pillar-short', 0);
  addStructure(tiles, 10, 9, 0, 'roof-gable', 0);
  addStructure(tiles, 12, 9, 0, 'roof-gable-plum', 0);
  [[8, 8], [14, 8], [7, 15], [15, 15], [10, 16], [18, 11], [5, 10]].forEach(([x, y], i) => {
    addStructure(tiles, x, y, 0, i % 2 ? 'block-moss' : 'block-hollow', 0);
  });
  addStructure(tiles, 20, 6, 0, 'keep-doorway', 0);
  addStructure(tiles, 23, 10, 0, 'pillar-tall', 0);
  addStructure(tiles, 24, 12, 0, 'block-moss', 0);
  addStructure(tiles, 19, 15, 0, 'well', 0);
  addPalm(tiles, 22, 16);
  addPalm(tiles, 4, 7);
  addPalm(tiles, 4, 18);
  return { width: w, height: h, tiles };
}
function dunesScene() {
  const w = 30, h = 22;
  const tiles = baseSand(w, h, 'dunes');
  const mounds = [[7, 7, 5], [17, 5, 4], [24, 11, 5], [11, 16, 3], [21, 18, 2], [4, 14, 2]];
  const heightAt = (x, y) => {
    let z = 0;
    mounds.forEach(([cx, cy, peak]) => {
      const d = Math.hypot(x - cx, (y - cy) * 1.1);
      z = Math.max(z, Math.round(peak - d * 0.95));
    });
    return z;
  };
  heightField(tiles, w, h, heightAt, z => z >= 3 ? 'desert-sand' : 'dune-sand');
  const hAt = (x, y) => Math.max(0, Math.min(MAX_LEVEL, Math.round(heightAt(x, y))));
  addStructure(tiles, 14, 11, hAt(14, 11), 'steps', 0);
  addStructure(tiles, 13, 9, hAt(13, 9), 'pillar-short', 0);
  addStructure(tiles, 15, 13, hAt(15, 13), 'block-light', 0);
  addStructure(tiles, 6, 19, hAt(6, 19), 'well', 0);
  addStructure(tiles, 24, 4, hAt(24, 4), 'block-moss', 0);
  addPalm(tiles, 6, 10, hAt(6, 10));
  addPalm(tiles, 26, 18, hAt(26, 18));
  return { width: w, height: h, tiles };
}
function canyonScene() {
  const w = 30, h = 24;
  const tiles = baseSand(w, h, 'ruins');
  const centre = x => 12 + Math.sin(x * 0.34) * 5;
  const heightAt = (x, y) => {
    const d = Math.abs(y - centre(x));
    if (d < 2.2) return 0;
    return Math.min(6, Math.floor((d - 2.2) / 1.4) + 1);
  };
  heightField(tiles, w, h, heightAt, z => z >= 3 ? 'sandstone' : 'dune-sand');
  const hAt = (x, y) => Math.max(0, Math.min(MAX_LEVEL, Math.round(heightAt(x, y))));
  for (let x = 3; x < w - 3; x += 4) {
    const y = Math.round(centre(x));
    setGround(tiles, x, y, 'oasis-water');
    setGround(tiles, x + 1, y, 'oasis-water');
  }
  addPalm(tiles, 5, Math.round(centre(5)), 0);
  addPalm(tiles, 18, Math.round(centre(18)), 0);
  addPalm(tiles, 26, Math.round(centre(26)), 0);
  addStructure(tiles, 9, Math.round(centre(9)) - 1, 0, 'well', 0);
  addStructure(tiles, 21, Math.round(centre(21)) + 1, 0, 'steps', 0);
  addStructure(tiles, 13, 4, hAt(13, 4), 'pillar-tall', 0);
  addStructure(tiles, 18, 20, hAt(18, 20), 'pillar-short', 0);
  addStructure(tiles, 8, 4, hAt(8, 4), 'block-moss', 0);
  addStructure(tiles, 24, 19, hAt(24, 19), 'block-light', 0);
  addStructure(tiles, 15, 2, hAt(15, 2), 'keep-doorway', 0);
  return { width: w, height: h, tiles };
}
function highlandsScene() {
  const w = 30, h = 24;
  const tiles = baseSand(w, h, 'dunes');
  const hills = [[8, 8, 7], [20, 6, 8], [16, 17, 5], [26, 18, 4], [4, 18, 3]];
  const heightAt = (x, y) => {
    let z = 0;
    hills.forEach(([cx, cy, peak]) => {
      const d2 = (x - cx) * (x - cx) + (y - cy) * (y - cy) * 1.15;
      z = Math.max(z, Math.round(peak * Math.exp(-d2 / 42)));
    });
    return z;
  };
  heightField(tiles, w, h, heightAt, (z, x, y) => z >= 5 ? 'sandstone' : z >= 3 ? 'dune-sand' : 'cracked-earth');
  const hAt = (x, y) => Math.max(0, Math.min(MAX_LEVEL, Math.round(heightAt(x, y))));
  // a sheltered valley between the two big hills
  [[14, 11], [15, 11], [14, 12], [15, 12]].forEach(([x, y]) => setGround(tiles, x, y, 'oasis-water'));
  addPalm(tiles, 13, 13, 0);
  addPalm(tiles, 16, 10, 0);
  addStructure(tiles, 12, 10, 0, 'well', 0);
  addStructure(tiles, 17, 13, hAt(17, 13), 'steps', 0);
  addStructure(tiles, 7, 6, hAt(7, 6), 'pillar-tall', 0);
  addStructure(tiles, 9, 5, hAt(9, 5), 'block-moss', 0);
  addStructure(tiles, 20, 5, hAt(20, 5), 'keep-doorway', 0);
  addStructure(tiles, 21, 7, hAt(21, 7), 'pillar-short', 0);
  addStructure(tiles, 25, 17, hAt(25, 17), 'block-light', 0);
  return { width: w, height: h, tiles };
}
function tileAtIn(list, x, y, z) { return list.find(t => t.x === x && t.y === y && t.z === z); }
function emptyScene() {
  const w = 30, h = 24;
  return { width: w, height: h, tiles: baseSand(w, h, 'empty') };
}
const EXAMPLES = {
  oasis: { build: oasisScene, label: 'oasis' },
  ruins: { build: ruinsScene, label: 'desert ruins' },
  dunes: { build: dunesScene, label: 'dune sea' },
  canyon: { build: canyonScene, label: 'canyon' },
  highlands: { build: highlandsScene, label: 'highlands' },
  empty: { build: emptyScene, label: 'empty sand' }
};
function loadExample(kind) {
  const example = EXAMPLES[kind] || EXAMPLES.oasis;
  state = example.build();
  activeHeight = 0;
  syncInputs();
  commit();
  draw();
  say(`Loaded the <b>${example.label}</b> scene. Undo restores your previous scene.`);
}

/* ── persistence ─────────────────────────────────────────── */
function download(name, blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function exportScene() {
  download('desert-world.json', new Blob([JSON.stringify({ format: 'desert-world-builder', version: 1, ...state }, null, 2)], { type: 'application/json' }));
}
function importScene(raw) {
  const data = JSON.parse(raw);
  if (!data || !Array.isArray(data.tiles)) throw new Error('Unsupported scene');
  state = { width: Math.max(8, Math.min(80, data.width || 30)), height: Math.max(8, Math.min(80, data.height || 24)), tiles: data.tiles };
  history = []; historyIndex = -1;
  syncInputs(); commit(); draw();
  say('Loaded scene data. <b>Saved to browser autosave.</b>');
}

/* ── boot + events ───────────────────────────────────────── */
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('pointerdown', e => {
  canvas.setPointerCapture(e.pointerId);
  pointer = cellFromEvent(e);
  drawing = true;
  lastPaint = '';
  if (e.button === 2 || tool === 'erase') paint(pointer, true);
  else if (tool === 'fill') { fill(pointer); drawing = false; commit(); }
  else paint(pointer);
  draw();
});
canvas.addEventListener('pointermove', e => {
  pointer = cellFromEvent(e);
  if (drawing && (e.buttons & 1 || e.buttons & 2)) paint(pointer, (e.buttons & 2) || tool === 'erase');
  draw();
});
canvas.addEventListener('pointerup', () => { if (drawing) { drawing = false; commit(); } });
canvas.addEventListener('pointerleave', () => { pointer = null; draw(); });

$('tools').addEventListener('click', e => {
  const b = e.target.closest('[data-tool]'); if (!b) return;
  tool = b.dataset.tool; syncUI(); draw();
});
$('terrainShapes').addEventListener('click', e => {
  const b = e.target.closest('[data-shape]'); if (!b) return;
  activeStructure = null;
  activeShape = b.dataset.shape;
  syncUI(); draw();
});
$('layers').addEventListener('click', e => {
  const b = e.target.closest('[data-layer]'); if (!b) return;
  activeLayer = b.dataset.layer;
  syncUI(); draw();
});
$('rotateBtn').onclick = () => { activeRot = (activeRot + 1) % 4; syncInputs(); draw(); };
$('mirrorBtn').onclick = () => { activeMirror = !activeMirror; $('mirrorBtn').classList.toggle('active', activeMirror); draw(); };
$('brush').oninput = () => { brushSize = Number($('brush').value); $('brushValue').textContent = brushSize + '×' + brushSize; draw(); };
$('levelDown').onclick = () => { activeHeight = Math.max(0, activeHeight - 1); syncInputs(); renderLevels(); draw(); };
$('levelUp').onclick = () => { activeHeight = Math.min(MAX_LEVEL, activeHeight + 1); syncInputs(); renderLevels(); draw(); };
$('terrainFill').onclick = () => { terrainFill = !terrainFill; syncInputs(); draw(); };
$('resize').onclick = () => {
  state.width = Math.max(8, Math.min(80, Number($('width').value) || state.width));
  state.height = Math.max(8, Math.min(80, Number($('height').value) || state.height));
  state.tiles = state.tiles.filter(t => t.x < state.width && t.y < state.height);
  syncInputs(); commit(); draw();
  say(`Resized to <b>${state.width} × ${state.height}</b>.`);
};
$('clear').onclick = () => {
  if (!confirm('Clear every tile?')) return;
  state.tiles = [];
  commit(); draw();
  say('Cleared the scene.');
};
$('undo').onclick = undo;
$('redo').onclick = redo;
$('save').onclick = () => { saveLocal(); say('Scene saved in this browser. <b>Use Export JSON to share it.</b>'); };
$('load').onclick = () => { if (loadLocal()) { history = []; historyIndex = -1; syncInputs(); commit(); draw(); say('Loaded the latest browser autosave.'); } };
$('export').onclick = exportScene;
$('png').onclick = () => canvas.toBlob(blob => download('desert-world.png', blob));
$('openEditor').onclick = () => window.open('demos/example3/structures-demo.html', '_blank', 'noopener');
$('file').onchange = async e => {
  const file = e.target.files[0];
  if (!file) return;
  try { importScene(await file.text()); }
  catch (_) { say('<b>Could not load that JSON.</b> Choose a desert world export.'); }
  e.target.value = '';
};
$('exOasis').onclick = () => loadExample('oasis');
$('exRuins').onclick = () => loadExample('ruins');
$('exDunes').onclick = () => loadExample('dunes');
$('exCanyon').onclick = () => loadExample('canyon');
$('exHighlands').onclick = () => loadExample('highlands');
$('exEmpty').onclick = () => loadExample('empty');
document.querySelector('.file') && ($('chooseFile')?.addEventListener('click', () => $('file').click()));

addEventListener('keydown', e => {
  if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  const key = e.key.toLowerCase();
  if ((e.metaKey || e.ctrlKey) && key === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if ((e.metaKey || e.ctrlKey) && key === 'y') { e.preventDefault(); redo(); return; }
  if ({ b: 'brush', e: 'erase', f: 'fill' }[key]) { tool = { b: 'brush', e: 'erase', f: 'fill' }[key]; syncUI(); draw(); return; }
  if (key === 'r' && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); $('rotateBtn').click(); }
  if (key === 'm' && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); $('mirrorBtn').click(); }
  if (/^[0-9]$/.test(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey) {
    activeHeight = Math.min(MAX_LEVEL, Number(e.key));
    syncInputs(); renderLevels(); draw();
  }
});
addEventListener('resize', draw);

if (!loadLocal()) state = oasisScene();
renderTilePalette();
renderStructurePalette();
syncInputs();
syncUI();
renderLevels();
commit();
draw();
