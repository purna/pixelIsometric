/**
 * js/2d/app2d.js — 2D Canvas editor entry point.
 *
 * Architecture (mirrors js/3d/app3d.js):
 *  - Canvas-based isometric rendering (no THREE.js)
 *  - Blob-backed stamp / grid persistence via blobStorage.js
 *  - Shared kernel: state.js (scene state), config.js, layerManager.js,
 *                   materialBuilder.js (colour/split/dither preview),
 *                   geometryBuilder.js (cube face geometries)
 *  - Stands alone: no THREE.js dependency
 *
 * Module pattern (no global side-effects):
 *  init(mountEl): call once to wire UI + kick off render loop
 *  getApp():   returns the export object after init()
 */
import { stateManager }             from '../shared/state.js';
import config                       from '../shared/config.js';
import { LayerManager }             from '../shared/layerManager.js';
import { MaterialBuilder }          from '../shared/materialBuilder.js';
import { Canvas2DRenderer }         from '../shared/renderer.js';

import { initStampTray }            from './stampLayer.js';
import { BlobStorage }              from './blobStorage.js';

// ── Internal state ─────────────────────────────────────────────────────────
let app = null;          // export object (set in init)
let rootEl = null;       // #app mount element
let canvasEl = null;     // main drawing canvas
let overlayEl = null;    // colliders overlay canvas

let layers  = null;      // LayerManager instance
let builder = null;      // shared MaterialBuilder
let renderer = null;     // Canvas2DRenderer
let storage = null;      // BlobStorage instance

let activeTool   = 'cube';
let activeLayer  = 'cube';
let gridNRows    = 7;
let gridNCols    = 7;

// ── Internal helpers ───────────────────────────────────────────────────────
function iso(x, y, z) {
    // delegates to renderer's internal projection
    return renderer._iso(x, y, z);
}

function hexToRgb(h) {
    return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}
function shaded(hex, f) {
    const [r, g, b] = hexToRgb(hex);
    return `rgb(${Math.min(255, r * f | 0)},${Math.min(255, g * f | 0)},${Math.min(255, b * f | 0)})`;
}

// ── Init ───────────────────────────────────────────────────────────────────
function init(mountEl) {
    rootEl   = mountEl;

    // ── DOM refs
    canvasEl  = rootEl.querySelector('#c-cube');   // existing id from v7 HTML
    overlayEl = rootEl.querySelector('#c-col');

    // ── Shared kernel
    layers  = new LayerManager();
    builder = new MaterialBuilder();
    builder.init(document.getElementById('material-builder-canvas')); // shared preview
    renderer = new Canvas2DRenderer(canvasEl);
    renderer._setOverlayContext(overlayEl.getContext('2d'));
    renderer._applyBgFromState();                 // ← pick up #808080 from state (or default)
    const savedBg = rootEl.dataset.__iso3dBg;     // ← 3D stashes current bg before the switch
    if (savedBg) renderer._setExplicitBg(savedBg); // ← use the exact 3D scene background
    storage  = new BlobStorage();

    // Prop shared builder defaults from v7 HTML
    const colA = document.getElementById('colA');
    const colB = document.getElementById('colB');
    const splitEl = document.getElementById('split');
    if (colA) renderer.colorA = builder.colorA = colA.value;
    if (colB) renderer.colorB = builder.colorB = colB.value;
    if (splitEl) renderer.splitPct = builder.splitPct = parseInt(splitEl.value) / 100;

    // ── MaterialBuilder preview sync
    builder.setColors(renderer.colorA, renderer.colorB);
    builder.setSplit(renderer.splitPct);
    // TODO: hook up tDither* / bDither* to builder UI slots

    // ── Event wiring ── toolbar
    wireToolbar();
    _wireMaterialBuilderUI();

    // ── Stamp tray init
    initStampTray(renderer, storage, builder, sharedRedraw);

    // ── Tool init
    setTool('cube');

    // ── Resize handler
    new ResizeObserver(() => { renderer.resize(); }).observe(canvasEl.parentElement);

    // ── Expose
    app = {
        getRenderer:   () => renderer,
        getBuilder:    () => builder,
        getLayers:     () => layers,
        setTool,        clearAll,  sharedRedraw,
        saveStamp,     removeStamp, selectStamp,
    };
    return app;
}

// ── Toolbar wiring ─────────────────────────────────────────────────────────
function wireToolbar() {
    // Cube / collider / erase buttons
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.addEventListener('click', () => setTool(btn.id.replace('btn-', '')));
    });

    // Palette dots
    const sw = document.getElementById('swatches');
    if (sw) {
        const PALETTE = ['#3ecfb2', '#c94b6e', '#5b9bd5', '#e8a838', '#9b7fd4', '#74c476', '#fa9fb5', '#aaaaaa'];
        PALETTE.forEach((col, i) => {
            const d = document.createElement('div');
            d.className = 'color-dot' + (i === 0 ? ' active' : '');
            d.style.background = col;
            d.onclick = () => {
                renderer.colorA = col;
                builder.setColors(col, builder.colorB);
                document.getElementById('swA').style.background = col;
                document.getElementById('colA').value = col;
                document.querySelectorAll('.color-dot').forEach((s, j) => s.classList.toggle('active', j === i));
                sharedRedraw();
            };
            sw.appendChild(d);
        });
    }

    // Color A input
    document.getElementById('colA')?.addEventListener('input', e => {
        renderer.colorA = builder.colorA = e.target.value;
        document.getElementById('swA').style.background = e.target.value;
        sharedRedraw();
    });

    // Color B / Split inputs
    document.getElementById('colB')?.addEventListener('input', e => {
        renderer.colorB = builder.colorB = e.target.value;
        document.getElementById('swB').style.background = e.target.value;
        sharedRedraw();
    });
    document.getElementById('split')?.addEventListener('input', e => {
        renderer.splitPct = builder.splitPct = parseInt(e.target.value) / 100;
        sharedRedraw();
    });

    // Hit-canvas events
    const hit = canvasEl?.nextElementSibling; // c-hit (overlay sits between c-cube and c-col)
    const cHit = document.getElementById('c-hit');
    cHit?.addEventListener('mousemove', e => {
        const rect  = cHit.getBoundingClientRect();
        const px    = e.clientX - rect.left, py = e.clientY - rect.top;
        if (activeTool === 'col-line') {
            renderer.hoverTile = null;
            renderer.hoverDot  = renderer._nearestVertex(px, py);
        } else {
            renderer.hoverDot  = null;
            renderer.hoverTile = renderer._nearestTile(px, py);
        }
        renderer.redraw();
    });
    cHit?.addEventListener('mouseleave', () => {
        renderer.hoverTile = null; renderer.hoverDot = null;
        renderer.redraw();
    });
    cHit?.addEventListener('click', e => {
        const rect = cHit.getBoundingClientRect();
        const px   = e.clientX - rect.left, py = e.clientY - rect.top;
        if (activeTool === 'cube' || activeTool === 'add-cube') {
            const tile = renderer._nearestTile(px, py);
            if (!tile) return;
            const key = `${tile.col},${tile.row}`;
            renderer.cubes[key] ? delete renderer.cubes[key] : (renderer.cubes[key] = 1);
        } else if (activeTool.startsWith('col-')) {
            const tile = renderer._nearestTile(px, py);
            if (!tile) return;
            const face = activeTool.replace('col-', '');
            const idx  = renderer.colliders.findIndex(c => c.type === face && c.col === tile.col && c.row === tile.row);
            idx >= 0 ? renderer.colliders.splice(idx, 1)
                     : renderer.colliders.push({ type: face, col: tile.col, row: tile.row });
            if (overlayEl) {
                const ctx2 = overlayEl.getContext('2d');
                renderer._drawCollidersOn(ctx2);
            }
            return;
        } else if (activeTool === 'col-line') {
            const dot = renderer._nearestVertex(px, py);
            if (!dot) return;
            if (!renderer._lineStart) {
                renderer._lineStart = dot;
                document.getElementById('status-msg').textContent = '◎ click second vertex to finish line';
            } else if (!(dot.gx === renderer._lineStart.gx && dot.gy === renderer._lineStart.gy)) {
                renderer.colliders.push({ type: 'line', x1: renderer._lineStart.gx, y1: renderer._lineStart.gy, x2: dot.gx, y2: dot.gy });
                renderer._lineStart = null;
                document.getElementById('status-msg').textContent = '◎ click a vertex to start next line';
            }
            return;
        } else if (activeTool === 'erase') {
            // erase logic
            const tile = renderer._nearestTile(px, py);
            if (tile) delete renderer.cubes[`${tile.col},${tile.row}`];
        }
        sharedRedraw();
    });

    // Save button
    document.getElementById('btn-save')?.addEventListener('click', saveStamp);
}

// ── MaterialBuilder UI wiring (sliders in v7 HTML) ─────────────────────────
function _wireMaterialBuilderUI() {
    const builderEl = document.getElementById('material-builder-canvas');
    if (!builderEl) return;
    // Color / split sliders already wired above via shared state
    // wiring for the builder's dither sliders lives here (2D-specific)
}

// ── Shared redraw ──────────────────────────────────────────────────────────
function sharedRedraw() {
    renderer.redraw();
    // repaint MaterialBuilder preview
    // builder's dither calls .draw() internally
    const overlay = document.getElementById('c-col');
    if (overlay) {
        const ctx2 = overlay.getContext('2d');
        renderer._drawCollidersOn(ctx2);
    }
}

// ── Tool switching ─────────────────────────────────────────────────────────
function setTool(tool) {
    activeTool = tool; renderer.activeTool = tool;
    renderer._lineStart = null; renderer.hoverTile = null; renderer.hoverDot = null;
    document.querySelectorAll('.tool-btn')?.forEach(b => b.classList.remove('active'));
    const map = { cube: 'btn-cube', 'add-cube': 'btn-cube', 'col-top': 'btn-col-top', 'col-left': 'btn-col-left', 'col-right': 'btn-col-right', 'col-line': 'btn-col-line', erase: 'btn-erase' };
    document.getElementById(map[tool])?.classList.add('active');
    const layer = tool.startsWith('col-') ? 'collider' : (tool === 'erase' ? activeLayer : 'cube');
    const hintEl = document.getElementById('layer-hint');
    if (hintEl) {
        hintEl.textContent = layer === 'collider' ? 'painting colliders — green = physics boundaries' : 'painting cubes';
    }
    sharedRedraw();
}

function clearAll() {
    if (activeLayer === 'collider') { renderer.colliders = []; }
    else { renderer.cubes = {}; }
    sharedRedraw();
}

// ── Stamp persistence (delegates to stampLayer.js / BlobStorage) ────────────
function saveStamp()   { return stampLayer.saveStamp(); }
function removeStamp(id){ return stampLayer.removeStamp(id); }
function selectStamp(id){ return stampLayer.selectStamp(id); }

// ── Exports ─────────────────────────────────────────────────────────────────
const _app2d = { init, getApp: () => app, setTool, clearAll, sharedRedraw };

export { init, saveStamp, removeStamp, selectStamp };
export default _app2d;
