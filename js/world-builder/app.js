import { DEFAULT_TILES } from '../scene-studio/config.js';
import { normalizeTile, faceTexture, drawTextureQuad, drawTextureTri, shade, tilePreviewURL } from '../scene-studio/textures.js';
import { STRUCTURE_GROUPS, STRUCTURES_WITH_90, getStructure, drawStructure, structureTiles } from '../scene-studio/structures.js';
import { createTileEditor } from '../scene-studio/tile-editor.js';
import { getTheme } from './themes.js';

const theme = getTheme(document.body.dataset.theme);
const MAX_LEVEL = 10;
const SCENE_KEY = `pixelIsometric.worldBuilder.scene.${theme.id}`;
const EDIT_KEY = `pixelIsometric.worldBuilder.tileEdits.${theme.id}`;
const clone = value => JSON.parse(JSON.stringify(value));

document.title = `${theme.name} World Builder — Pixel Isometric`;
document.documentElement.style.setProperty('--accent', theme.accent);
document.documentElement.style.setProperty('--accent-bg', theme.accentBg);
document.documentElement.style.setProperty('--canvas-top', theme.canvasTop);
document.documentElement.style.setProperty('--canvas-bottom', theme.canvasBottom);

/* ── shell ───────────────────────────────────────────────── */
const themeLinks = [
  ['desert', 'Desert', 'desert-builder.html'],
  ['jungle', 'Jungle', 'jungle-builder.html'],
  ['snow', 'Snow', 'snow-builder.html'],
  ['temperate', 'Temperate', 'temperate-builder.html']
].map(([id, name, href]) => id === theme.id ? `<span>${name}</span>` : `<a href="${href}">${name}</a>`).join('');
const exampleButtons = theme.examples.map(([key, label]) => `<button data-example="${key}">${label}</button>`).join('');

document.getElementById('app').innerHTML = `
<div class="app">
  <header class="topbar">
    <div class="brand">${theme.brand}</div>
    <div class="sub">${theme.subtitle}</div>
    <nav class="theme-links">${themeLinks}</nav>
    <div class="spacer"></div>
    <button id="undo" title="Undo (Ctrl/Cmd+Z)">Undo</button>
    <button id="redo" title="Redo (Ctrl/Cmd+Shift+Z)">Redo</button>
    <button id="save">Save</button>
    <button id="load">Load</button>
    <button id="export">Export JSON</button>
    <button id="png">Export PNG</button>
    <button id="tileEditorBtn" title="Open the ${theme.name} tile editor">Tile editor</button>
    <input class="file" id="file" type="file" accept="application/json,.json">
  </header>
  <main class="body">
    <aside class="sidebar left">
      <section class="section">
        <h2>Tools</h2>
        <div class="button-grid three" id="tools">
          <button data-tool="brush" class="active">Paint</button>
          <button data-tool="erase">Erase</button>
          <button data-tool="fill">Fill</button>
        </div>
        <div class="row"><label>Brush</label><input id="brush" type="range" min="1" max="5" step="2" value="1"><span class="value" id="brushValue">1×1</span></div>
        <div class="row"><label>Facing</label><button id="rotateBtn" title="Rotate (R)">Rotate ↻ <span id="rotVal">0°</span></button><button id="mirrorBtn" title="Mirror (M)">Mirror</button></div>
      </section>
      <section class="section">
        <h2>Terrain Shape</h2>
        <div class="button-grid three" id="terrainShapes">
          <button data-shape="plane" class="active">Floor</button>
          <button data-shape="cube">Block</button>
          <button data-shape="ramp">Ramp</button>
        </div>
        <p class="hint">Floor builds solid terrain columns. Block raises one block. Ramp makes a slope.</p>
      </section>
      <section class="section">
        <h2>Elevation Layers</h2>
        <div class="row"><label>Level</label><button id="levelDown">−</button><span class="value" id="levelValue">0</span><button id="levelUp">+</button></div>
        <div id="levelList" class="level-list"></div>
        <div class="row"><label>Terrain</label><button id="terrainFill" class="active">Columns on</button></div>
        <p class="hint">Paint a floor at level 1, 2, 3… to raise real terrain. High ground around lower ground makes valleys.</p>
      </section>
      <section class="section">
        <h2>Paint Layers</h2>
        <div class="button-grid three" id="layers">
          <button data-layer="ground" class="active">Ground</button>
          <button data-layer="decoration">Detail</button>
          <button data-layer="structure">Structure</button>
        </div>
      </section>
      <section class="section">
        <h2>${theme.name} Tiles</h2>
        <div id="tilePalette" class="palette"></div>
      </section>
    </aside>
    <section class="canvas-wrap">
      <canvas id="scene"></canvas>
      <div class="hud"><b id="coords">x 0 · y 0</b><br><span id="hudText">Paint · terrain · z 0</span></div>
    </section>
    <aside class="sidebar right">
      <section class="section"><h2>${theme.name} Structures</h2><div id="structurePalette"></div></section>
      <section class="section">
        <h2>Scene</h2>
        <div class="row"><label>Width</label><input id="width" type="number" min="8" max="80" value="30"></div>
        <div class="row"><label>Height</label><input id="height" type="number" min="8" max="80" value="24"></div>
        <div class="button-grid"><button id="resize">Resize</button><button class="danger" id="clear">Clear</button></div>
      </section>
      <section class="section">
        <h2>Example Scenes</h2>
        <div class="button-grid" id="exampleButtons">${exampleButtons}</div>
        <p class="hint">Loading an example is undoable. Paint over it to make it yours.</p>
      </section>
      <section class="section">
        <h2>How to build</h2>
        <p class="hint">Paint terrain first, then raise elevation for hills. Use <b>Rotate</b> before placing walls and roofs. The tile editor edits this world's tiles live.</p>
      </section>
    </aside>
  </main>
  <footer class="status" id="status">Ready. <b>Autosaves in this browser.</b></footer>
</div>
<div class="drawer" id="tileDrawer" aria-hidden="true">
  <div class="drawer-head"><div><b>TILE EDITOR</b><span class="drawer-sub">${theme.name} set</span></div><button id="closeDrawer">Close ×</button></div>
  <div class="drawer-body" id="editor"></div>
</div>`;

const $ = id => document.getElementById(id);
const canvas = $('scene');
const ctx = canvas.getContext('2d');

/* ── tiles ───────────────────────────────────────────────── */
function makeTiles() {
  const tiles = DEFAULT_TILES.map(clone);
  const byId = new Map(tiles.map(tile => [tile.id, tile]));
  Object.entries(theme.recolor).forEach(([id, [top, bottom, split]]) => {
    const tile = byId.get(id);
    if (tile) Object.assign(tile, { top, bottom, split });
  });
  theme.extraTiles.forEach(tile => tiles.push(clone(tile)));
  tiles.forEach(normalizeTile);
  return tiles;
}
const TILES = makeTiles();
const TILE_BY_ID = new Map(TILES.map(tile => [tile.id, tile]));
const tileOf = id => TILE_BY_ID.get(id) || TILES[0];

/* ── state ───────────────────────────────────────────────── */
const LAYER_RANK = { ground: 0, decoration: 1, structure: 2 };
function defaultScene() { return { width: 30, height: 24, tiles: [] }; }
let state = defaultScene();
let history = [];
let historyIndex = -1;
let tool = 'brush';
let activeTile = theme.palette[0];
let activeShape = 'plane';
let activeStructure = null;
let activeRot = 0;
let activeMirror = false;
let activeLayer = 'ground';
let activeHeight = 0;
let terrainFill = true;
let peakZ = 0;
let brushSize = 1;
let pointer = null;
let drawing = false;
let lastPaint = '';
let tilesVersion = 0;

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
function refreshPeak() { peakZ = state.tiles.reduce((m, t) => Math.max(m, t.z || 0), 0); }
function viewLift(s) { return Math.max(0, peakZ - 2) * s * 0.22; }
function iso(x, y, z) {
  const base = Math.max(10, Math.min(30, Math.min(canvas.width / (state.width + state.height + 4), canvas.height / (state.width + state.height + 5)) * 1.35));
  return {
    x: canvas.width / 2 + (x - y) * base,
    y: canvas.height * 0.56 + (x + y - state.width * 0.52) * base * 0.5 - z * base + viewLift(base),
    scale: base
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
  c.width = W; c.height = H;
  drawTextureQuad(c.getContext('2d'), [[W / 2, 0], [W, H / 2], [W / 2, H], [0, H / 2]], faceTexture(data, 'top'));
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
      ctx.strokeStyle = 'rgba(0,0,0,.22)';
      for (let k = 1; k < tile.z; k++) {
        const y = p.y + k * s;
        ctx.beginPath();
        ctx.moveTo(p.x - s, y); ctx.lineTo(p.x, y + s * 0.5); ctx.lineTo(p.x + s, y);
        ctx.stroke();
      }
      ctx.restore();
    }
    if (alpha < 1) { fillPoly(top, data.top, alpha); return; }
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
  sky.addColorStop(0, theme.canvasTop);
  sky.addColorStop(1, theme.canvasBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < state.height; y++) {
    for (let x = 0; x < state.width; x++) {
      const p = iso(x, y, activeHeight), s = p.scale;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - s * 0.5); ctx.lineTo(p.x + s, p.y);
      ctx.lineTo(p.x, p.y + s * 0.5); ctx.lineTo(p.x - s, p.y);
      ctx.closePath();
      ctx.strokeStyle = 'rgba(255,255,255,.055)';
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
    ctx.strokeStyle = tool === 'erase' ? '#d76670' : theme.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - s * 0.5); ctx.lineTo(p.x + s, p.y);
    ctx.lineTo(p.x, p.y + s * 0.5); ctx.lineTo(p.x - s, p.y);
    ctx.closePath(); ctx.stroke();
    ctx.lineWidth = 1;
  }
  updateHud();
}

/* ── palettes ────────────────────────────────────────────── */
function renderTilePalette() {
  const holder = $('tilePalette');
  holder.innerHTML = '';
  theme.palette.forEach(id => {
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
      syncUI(); draw();
      say(`Selected <b>${tile.name}</b>.`);
    };
    holder.appendChild(b);
  });
}
const structureThumbCache = new Map();
function structureThumb(structure) {
  const key = `${structure.id}|${tilesVersion}`;
  const hit = structureThumbCache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = 64; c.height = 50;
  drawStructure(c.getContext('2d'), structure, TILES, { x: 32, y: 35, S: 18 });
  const url = c.toDataURL();
  structureThumbCache.set(key, url);
  return url;
}
function renderStructurePalette() {
  const holder = $('structurePalette');
  holder.innerHTML = '';
  STRUCTURE_GROUPS.forEach(group => {
    const list = STRUCTURES_WITH_90.filter(st => st.group === group.id);
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
      b.innerHTML = `<img alt="" src="${structureThumb(structure)}"><span>${structure.name}</span>`;
      b.onclick = () => {
        activeStructure = structure.id;
        activeShape = 'structure';
        activeLayer = 'structure';
        syncUI(); draw();
        say(`Selected <b>${structure.name}</b>. Paint with it, or press Rotate first.`);
      };
      grid.appendChild(b);
    });
    wrap.appendChild(grid);
    holder.appendChild(wrap);
  });
}

/* ── UI sync ─────────────────────────────────────────────── */
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
  fillBtn.textContent = terrainFill ? 'Columns on' : 'Columns off';
  fillBtn.classList.toggle('active', terrainFill);
}
function renderLevels() {
  const holder = $('levelList');
  const counts = new Map();
  state.tiles.forEach(tile => {
    const z = Math.round(tile.z || 0);
    if (Math.abs((tile.z || 0) - z) < 0.01) counts.set(z, (counts.get(z) || 0) + 1);
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
function addT(list, x, y, z, id, shape = 'plane', layer = 'ground') {
  list.push({ x, y, z, id, shape, layer });
}
function addStructure(list, x, y, z, id, rot = 0, mirror = false) {
  list.push({ x, y, z, id: theme.terrain.rock, shape: 'structure', layer: 'structure', structure: id, rot, mirror });
}
function setGround(list, x, y, id) {
  const tile = list.find(tile => tile.x === x && tile.y === y && tile.z === 0 && tile.layer === 'ground');
  if (tile) tile.id = id;
}
function addTree(list, x, y, base = 0) {
  addT(list, x, y, base + 1.3, theme.tree.trunk, 'pillar', 'decoration');
  addT(list, x, y, base + 1.35, theme.tree.leaf, 'roof', 'decoration');
}
function baseGround(w, h) {
  const tiles = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const n = (x * 7 + y * 13 + x * y) % 19;
      const id = n < 3 ? theme.terrain.low : n === 3 ? theme.terrain.high : theme.terrain.base;
      addT(tiles, x, y, 0, id, 'plane', 'ground');
    }
  }
  return tiles;
}
function heightField(list, w, h, fn, tileFor) {
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const z = Math.max(0, Math.min(MAX_LEVEL, Math.round(fn(x, y))));
      if (z > 0) addT(list, x, y, z, tileFor ? tileFor(z, x, y) : theme.terrain.high, 'plane', 'ground');
    }
  }
}
function heightOf(fn, x, y) { return Math.max(0, Math.min(MAX_LEVEL, Math.round(fn(x, y)))); }
function tileForHeight(z) {
  return z >= 5 ? theme.terrain.peak : z >= 3 ? theme.terrain.high : theme.terrain.base;
}
function hillsHeight(hills) {
  return (x, y) => {
    let z = 0;
    hills.forEach(([cx, cy, peak, spread]) => {
      const d2 = (x - cx) * (x - cx) + (y - cy) * (y - cy) * 1.12;
      z = Math.max(z, Math.round(peak * Math.exp(-d2 / (spread || 42))));
    });
    return z;
  };
}
function scatterTrees(tiles, w, h, heightAt, count = 28, seed = 3) {
  let placed = 0, n = seed;
  for (let i = 0; i < 500 && placed < count; i++) {
    n = (n * 1103515245 + 12345) & 0x7fffffff;
    const x = n % w;
    n = (n * 1103515245 + 12345) & 0x7fffffff;
    const y = n % h;
    const z = heightOf(heightAt, x, y);
    const ground = tiles.find(tile => tile.x === x && tile.y === y && tile.z === z && tile.layer === 'ground');
    if (!ground || ground.id === theme.terrain.water) continue;
    if (tiles.some(tile => tile.x === x && tile.y === y && tile.layer === 'decoration')) continue;
    addTree(tiles, x, y, z);
    placed++;
  }
}
function clearAbove(tiles, x, y) {
  tiles.forEach(tile => {
    if (tile.x === x && tile.y === y && tile.z > 0 && tile.layer === 'ground') tile.deleted = true;
  });
}
const LAYOUTS = {
  jungle: { hills: [[8, 8, 6, 46], [20, 5, 7, 52], [15, 18, 4, 40], [26, 17, 3, 30]], trees: 44, pond: [[13, 12], [14, 12], [13, 13], [14, 13]] },
  snow: { hills: [[6, 6, 8, 40], [21, 7, 9, 46], [14, 18, 5, 34], [26, 18, 4, 28]], trees: 22, pond: [[14, 11], [15, 11], [14, 12], [15, 12]] },
  temperate: { hills: [[8, 10, 4, 46], [20, 7, 5, 52], [15, 18, 3, 40], [26, 17, 3, 30]], trees: 30, pond: [[13, 13], [14, 13]] }
};
function rollingScene() {
  const w = 30, h = 24;
  const layout = LAYOUTS[theme.id] || LAYOUTS.temperate;
  const tiles = baseGround(w, h);
  const hills = layout.hills;
  const heightAt = hillsHeight(hills);
  heightField(tiles, w, h, heightAt, tileForHeight);
  const hAt = (x, y) => heightOf(heightAt, x, y);
  layout.pond.forEach(([x, y]) => { setGround(tiles, x, y, theme.terrain.water); clearAbove(tiles, x, y); });
  scatterTrees(tiles, w, h, heightAt, layout.trees);
  addStructure(tiles, 20, 4, hAt(20, 4), 'steps', 0);
  addStructure(tiles, 19, 4, hAt(19, 4), 'pillar-short', 0);
  addStructure(tiles, 5, 18, hAt(5, 18), 'well', 0);
  addStructure(tiles, 24, 12, hAt(24, 12), 'block-moss', 0);
  return { width: w, height: h, tiles: tiles.filter(tile => !tile.deleted) };
}
function riverScene() {
  const w = 30, h = 24;
  const tiles = baseGround(w, h);
  const centre = x => 12 + Math.sin(x * 0.32) * 5;
  const heightAt = (x, y) => {
    const d = Math.abs(y - centre(x));
    if (d < 2.1) return 0;
    return Math.min(6, Math.floor((d - 2.1) / 1.45) + 1);
  };
  heightField(tiles, w, h, heightAt, tileForHeight);
  for (let x = 2; x < w - 2; x++) {
    const y = Math.round(centre(x));
    setGround(tiles, x, y, theme.terrain.water);
    setGround(tiles, x, y + 1, theme.terrain.water);
    clearAbove(tiles, x, y);
    clearAbove(tiles, x, y + 1);
  }
  const hAt = (x, y) => heightOf(heightAt, x, y);
  scatterTrees(tiles, w, h, heightAt, 26);
  addStructure(tiles, 10, Math.round(centre(10)) + 3, hAt(10, Math.round(centre(10)) + 3), 'pillar-tall', 0);
  addStructure(tiles, 20, Math.round(centre(20)) - 3, hAt(20, Math.round(centre(20)) - 3), 'steps', 0);
  addStructure(tiles, 26, 6, hAt(26, 6), 'block-light', 0);
  return { width: w, height: h, tiles: tiles.filter(tile => !tile.deleted) };
}
function ruinsScene() {
  const w = 30, h = 24;
  const tiles = baseGround(w, h);
  const heightAt = (x, y) => {
    const d = Math.max(0, Math.abs(x - 15) - 8) + Math.max(0, Math.abs(y - 12) - 7);
    return Math.min(4, Math.round(d / 4));
  };
  heightField(tiles, w, h, heightAt, tileForHeight);
  const hAt = (x, y) => heightOf(heightAt, x, y);
  for (let x = 7; x <= 17; x++) {
    if (x === 12) addStructure(tiles, x, 7, hAt(x, 7), 'wall-doorway', 0);
    else if (x === 15) addStructure(tiles, x, 7, hAt(x, 7), 'wall-window', 0);
    else if (x !== 10 && x !== 16) addStructure(tiles, x, 7, hAt(x, 7), 'wall-plain', 0);
  }
  for (let y = 8; y <= 16; y++) {
    if (y !== 11 && y !== 12) addStructure(tiles, 7, y, hAt(7, y), 'wall-plain', 1);
    if (y !== 13) addStructure(tiles, 17, y, hAt(17, y), 'wall-plain', 1);
  }
  addStructure(tiles, 12, 14, hAt(12, 14), 'steps', 0);
  addStructure(tiles, 10, 13, hAt(10, 13), 'pillar-tall', 0);
  addStructure(tiles, 14, 13, hAt(14, 13), 'pillar-tall', 0);
  addStructure(tiles, 10, 10, hAt(10, 10), 'pillar-short', 0);
  addStructure(tiles, 14, 10, hAt(14, 10), 'pillar-short', 0);
  addStructure(tiles, 11, 9, hAt(11, 9), 'roof-gable', 0);
  addStructure(tiles, 13, 9, hAt(13, 9), 'roof-gable-plum', 0);
  [[8, 8], [16, 8], [8, 16], [16, 16], [12, 17]].forEach(([x, y], i) => {
    addStructure(tiles, x, y, hAt(x, y), i % 2 ? 'block-moss' : 'block-hollow', 0);
  });
  scatterTrees(tiles, w, h, heightAt, 22);
  [['keep-doorway', 21, 6], ['pillar-tall', 24, 11], ['well', 20, 16]].forEach(([id, x, y]) => {
    addStructure(tiles, x, y, hAt(x, y), id, 0);
  });
  return { width: w, height: h, tiles };
}
function highlandsScene() {
  const w = 30, h = 24;
  const tiles = baseGround(w, h);
  const hills = [[9, 8, 9, 34], [21, 7, 10, 38], [16, 18, 6, 30], [27, 18, 5, 26], [4, 18, 4, 24]];
  const heightAt = hillsHeight(hills);
  heightField(tiles, w, h, heightAt, z => z >= 7 ? theme.terrain.peak : z >= 4 ? theme.terrain.rock : theme.terrain.high);
  const hAt = (x, y) => heightOf(heightAt, x, y);
  [[14, 12], [15, 12], [14, 13], [15, 13]].forEach(([x, y]) => { setGround(tiles, x, y, theme.terrain.water); clearAbove(tiles, x, y); });
  scatterTrees(tiles, w, h, heightAt, 20);
  addStructure(tiles, 7, 6, hAt(7, 6), 'pillar-tall', 0);
  addStructure(tiles, 10, 5, hAt(10, 5), 'block-moss', 0);
  addStructure(tiles, 21, 5, hAt(21, 5), 'keep-doorway', 0);
  addStructure(tiles, 22, 7, hAt(22, 7), 'pillar-short', 0);
  addStructure(tiles, 16, 20, hAt(16, 20), 'steps', 0);
  return { width: w, height: h, tiles: tiles.filter(tile => !tile.deleted) };
}
function emptyScene() {
  const w = 30, h = 24;
  return { width: w, height: h, tiles: baseGround(w, h) };
}
const EXAMPLES = {
  rainforest: rollingScene, snowfield: rollingScene, meadow: rollingScene, forest: rollingScene,
  river: riverScene, ruins: ruinsScene, highlands: highlandsScene, empty: emptyScene
};
function loadExample(key) {
  const build = EXAMPLES[key] || rollingScene;
  const label = (theme.examples.find(e => e[0] === key) || [key, key])[1];
  state = build();
  activeHeight = 0;
  syncInputs();
  commit();
  draw();
  say(`Loaded the <b>${label.toLowerCase()}</b> scene. Undo restores your previous scene.`);
}

/* ── tile editor ─────────────────────────────────────────── */
let editor = null;
let refreshTimer = 0;
function prettyGroup(id) {
  return String(id).replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
function onTileEdited() {
  groundSpriteCache.clear();
  tilesVersion++;
  draw();
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => { renderStructurePalette(); renderTilePalette(); draw(); }, 90);
}
function initEditor() {
  if (editor) return;
  const wanted = new Set(theme.palette);
  theme.extraTiles.forEach(tile => wanted.add(tile.id));
  STRUCTURES_WITH_90.forEach(structure => structureTiles(structure).forEach(id => wanted.add(id)));
  const editorTiles = TILES.filter(tile => wanted.has(tile.id));
  const groupIds = [...new Set(editorTiles.map(tile => tile.groupId).filter(Boolean))];
  const groups = groupIds.map(id => ({ id, name: prettyGroup(id), setId: theme.id }));
  editor = createTileEditor($('editor'), {
    tiles: editorTiles,
    sets: [{ id: theme.id, name: `${theme.name} set` }],
    groups,
    startSet: theme.id,
    storageKey: EDIT_KEY,
    onChange: onTileEdited,
    onSelect: () => {}
  });
}
function openDrawer(open) {
  const drawer = $('tileDrawer');
  drawer.classList.toggle('open', open);
  drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
  if (open) initEditor();
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
  download(`${theme.id}-world.json`, new Blob([JSON.stringify({ format: 'world-builder', version: 1, theme: theme.id, ...state }, null, 2)], { type: 'application/json' }));
}
function importScene(raw) {
  const data = JSON.parse(raw);
  if (!data || !Array.isArray(data.tiles)) throw new Error('Unsupported scene');
  state = { width: Math.max(8, Math.min(80, data.width || 30)), height: Math.max(8, Math.min(80, data.height || 24)), tiles: data.tiles };
  history = []; historyIndex = -1;
  syncInputs(); commit(); draw();
  say('Loaded scene data. <b>Saved to browser autosave.</b>');
}

/* ── events ──────────────────────────────────────────────── */
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
$('exampleButtons').addEventListener('click', e => {
  const b = e.target.closest('[data-example]'); if (!b) return;
  loadExample(b.dataset.example);
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
$('png').onclick = () => canvas.toBlob(blob => download(`${theme.id}-world.png`, blob));
$('tileEditorBtn').onclick = () => openDrawer(!$('tileDrawer').classList.contains('open'));
$('closeDrawer').onclick = () => openDrawer(false);
$('file').onchange = async e => {
  const file = e.target.files[0];
  if (!file) return;
  try { importScene(await file.text()); }
  catch (_) { say('<b>Could not load that JSON.</b> Choose a world export.'); }
  e.target.value = '';
};

addEventListener('keydown', e => {
  if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  const key = e.key.toLowerCase();
  if (key === 'escape') { openDrawer(false); return; }
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

/* ── boot ────────────────────────────────────────────────── */
initEditor();
if (!loadLocal()) state = rollingScene();
renderTilePalette();
renderStructurePalette();
renderLevels();
syncInputs();
syncUI();
commit();
draw();
