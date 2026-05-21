/**
 * js/2d/stampLayer.js — Stamp / grid tile management for the 2D editor.
 *
 * Stamp = isometric snapshot (isometric cubes + colliders + col/split/blend state)
 * captured as a canvas blob URL, stored in localStorage as a base64 DataURL
 * long-term, and also kept as an object-URL-backed <img> reference for fast
 * live re-rendering.
 *
 * Grid Panel = 12×8 iso-static-tile arrangement where stamp instances are
 * placed by copying their canvas image content onto a persistent overlay canvas.
 *
 * Depends on:
 *  BlobStorage (storing blobs to localStorage)
 *  Canvas2DRenderer (for asSnapshot + redrawing)
 */
import { BlobStorage } from './blobStorage.js';

let _renderer   = null;   // Canvas2DRenderer
let _builder    = null;   // shared MaterialBuilder
let _storage    = null;   // BlobStorage
let _redrawAll  = null;   // callback => re-render everything (canvas + stamp-tray + grid)

let _stamps     = [];     // live stamp in-memory records: {id, label, imgLabel, blobRef, meta}
let _activeStamp= null;   // stamp id currently selected for placement
let stampCounter = 0;     // auto-incrementing stamp id

// ── helpers ────────────────────────────────────────────────────────────────
function _addItem(stamp) {
    const tray    = document.getElementById('stamp-tray');
    const emptyMsg= document.getElementById('stamp-empty-msg');
    if (!tray) return;
    emptyMsg && (emptyMsg.style.display = 'none');

    const THUMB = 54, item = document.createElement('div');
    item.className = 'stamp-item'; item.id = `stamp-item-${stamp.id}`;
    item.onclick   = () => selectStamp(stamp.id);

    // thumbnail canvas
    const tc = document.createElement('canvas');
    const aspect = stamp.dispW / stamp.dispH;
    if (aspect >= 1) { tc.width = THUMB; tc.height = Math.round(THUMB / aspect); }
    else             { tc.height = THUMB; tc.width  = Math.round(THUMB * aspect); }
    const tcx = tc.getContext('2d');
    const img = new Image();
    img.onload = () => tcx.drawImage(img, 0, 0, tc.width, tc.height);
    img.src    = stamp.blobRef; // data-url or objectURL
    tc.style.width  = `${tc.width}px`;
    tc.style.height = `${tc.height}px`;

    const label = document.createElement('div');
    label.className = 'stamp-label';
    label.textContent = stamp.label;

    const del = document.createElement('div');
    del.className = 'stamp-del'; del.textContent = '×';
    del.onclick = e => { e.stopPropagation(); removeStamp(stamp.id); };

    item.append(del, tc, label);
    tray.insertBefore(item, tray.firstChild);
}

function _findStamp(id) { return _stamps.find(s => s.id === id); }

// ── Snapshot ────────────────────────────────────────────────────────────────
/**
 * Render the current scene to an offscreen canvas and return a Blob URL.
 * @param {number} [scale=2]  pixel density multiplier
 * @returns  {Promise<string|null>}  object URL (caller revokes when done)
 */
async function _snapshot(scale = 2) {
    if (!_renderer || !Object.keys(_renderer.cubes || {}).length) return null;

    // bounding box of all placed cubes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const key in _renderer.cubes) {
        const [c, r] = key.split(',').map(Number);
        [[c, r, 1], [c + 1, r, 1], [c + 1, r + 1, 1], [c, r + 1, 1],
         [c, r, 0], [c + 1, r, 0], [c + 1, r + 1, 0], [c, r + 1, 0]].forEach(([x, y, z]) => {
            const [px, py] = _renderer._iso(x, y, z);
            minX = Math.min(minX, px); minY = Math.min(minY, py);
            maxX = Math.max(maxX, px); maxY = Math.max(maxY, py);
        });
    }
    const PAD = 6;
    minX -= PAD; minY -= PAD; maxX += PAD; maxY += PAD;
    const sw2 = (maxX - minX) * scale, sh2 = (maxY - minY) * scale;

    const off = document.createElement('canvas');
    off.width = sw2; off.height = sh2;
    const octx = off.getContext('2d');
    octx.clearRect(0, 0, sw2, sh2);

    // Re-bind projection origin so world → offscreen-crop-space transformation
    const savedOX = _renderer.OX, savedOY = _renderer.OY, savedS = _renderer.S;
    _renderer.OX = (_renderer.OX - minX) * scale;
    _renderer.OY = (_renderer.OY - minY) * scale;
    _renderer.S  *= scale;

    for (const key in _renderer.cubes) {
        const [c, r] = key.split(',').map(Number);
        _renderer._drawCube(octx, c, r);
    }

    _renderer.OX = savedOX; _renderer.OY = savedOY; _renderer.S = savedS;

    return new Promise(resolve => off.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        resolve({ blob, url, w: sw2, h: sh2, scale });
    }, 'image/png'));
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Save the current 2D scene as a stamp.
 * Reads renderer state, captures a blob, persists to localStorage,
 * adds the stamp to the tray, and activates it for grid placement.
 */
async function saveStamp(label) {
    if (!_renderer || !Object.keys(_renderer.cubes).length) {
        document.getElementById('status-msg').textContent = '⚠ draw some cubes first';
        return;
    }
    document.getElementById('status-msg').textContent = '…saving';

    const snap = await _snapshot(2);
    if (!snap) return;

    const persistId = await _storage.persistScene(
        label || `stamp ${++stampCounter}`,
        { cubes: _renderer.cubes, colliders: _renderer.colliders, colorA: _renderer.colorA, colorB: _renderer.colorB, splitPct: renderer.splitPct },
        snap.blob
    );

    stampCounter = Math.max(stampCounter, persistId);

    const stamp = {
        id:       stampCounter,
        label:    label || `#${stampCounter}`,
        blobRef:  snap.url,
        dispW:    snap.w / snap.scale,
        dispH:    snap.h / snap.scale,
        persistId,
    };
    _stamps.push(stamp);
    _addItem(stamp);
    selectStamp(stamp.id);

    document.getElementById('status-msg').textContent = `✓ saved #${stampCounter} — click the grid to place`;
}

/** Remove a stamp from memory + localStorage */
function removeStamp(id) {
    _stamps = _stamps.filter(s => s.id !== id);
    const el = document.getElementById(`stamp-item-${id}`);
    el?.remove();
    if (_activeStamp === id) { _activeStamp = null; }
    if (!_stamps.length) document.getElementById('stamp-empty-msg').style.display = '';
    _redrawAll && _redrawAll();
}

/** Select a stamp; its thumbnail is activated in the tray */
function selectStamp(id) {
    _activeStamp = id;
    document.querySelectorAll('.stamp-item')?.forEach(el => el.classList.toggle('active-stamp', el.id === `stamp-item-${id}`));
    document.getElementById('grid-status').textContent = `#${id} selected — click grid to stamp`;
}

/** Restore all saved blobs from localStorage into the stamp tray */
function loadFromStorage() {
    _stamps = [];
    const metaRecords = _storage.loadMeta().sort((a, b) => a.idx - b.idx);
    metaRecords.forEach(rec => {
        const blobRef = _storage.loadBlobUrl(rec.idx);
        if (!blobRef) return;
        const stamp = {
            id: rec.stampIndex, label: rec.label || `#${rec.stampIndex}`,
            blobRef, dispW: 40, dispH: 40, persistId: rec.idx,
        };
        _stamps.push(stamp);
        _addItem(stamp);
    });
}

// ── Initialise ──────────────────────────────────────────────────────────────
function initStampTray(renderer, blobStorage, builderFn, redrawAll) {
    _renderer  = renderer;
    _storage   = blobStorage;
    _builder   = builderFn;
    _redrawAll = redrawAll;

    loadFromStorage();
}

const stampLayer = { saveStamp, removeStamp, selectStamp, loadFromStorage, initStampTray };

export { stampLayer, saveStamp, removeStamp, selectStamp, loadFromStorage, initStampTray };
