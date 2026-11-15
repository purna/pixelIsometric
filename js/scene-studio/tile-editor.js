/**
 * tile-editor.js
 *
 * Self-contained tile editor for the Scene Studio tile library.
 * Edits the live tile objects (colours, split, top/bottom dither) in place, so
 * anything drawn with faceTexture()/structures.js updates as soon as onChange fires.
 *
 *   const editor = createTileEditor(document.getElementById('editor'), {
 *     tiles: DEFAULT_TILES, sets: DEFAULT_SETS, groups: DEFAULT_GROUPS,
 *     startSet: 'town', onChange: id => redraw(), onSelect: id => {},
 *   });
 *
 * Edits autosave to localStorage (only the tiles that differ from the defaults).
 */
import { faceTexture, drawTextureQuad, tilePreviewURL, normalizeTile } from './textures.js';
import { DEFAULT_TILES, DEFAULT_SETS, DEFAULT_GROUPS } from './config.js';

export const DITHER_MODES = [
  'solid', 'noise', 'lines', 'crosshatch', 'dots', 'random',
  'brick', 'paving', 'checker', 'weave', 'plank', 'shingle', 'stonework', 'lattice',
];
export const BLEND_MODES = [
  ['source-over', 'Normal'], ['multiply', 'Multiply'], ['screen', 'Screen'],
  ['overlay', 'Overlay'], ['soft-light', 'Soft light'], ['hard-light', 'Hard light'],
];

const clone = o => JSON.parse(JSON.stringify(o));
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const pickTile = t => ({ name: t.name, top: t.top, bottom: t.bottom, split: t.split, topDither: { ...t.topDither }, bottomDither: { ...t.bottomDither } });

function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  kids.flat().forEach(c => { if (c != null) el.append(c.nodeType ? c : document.createTextNode(c)); });
  return el;
}

function downloadText(name, text, type = 'text/plain') {
  const a = document.createElement('a');
  const url = URL.createObjectURL(new Blob([text], { type }));
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/** Keep only valid values from untrusted input (imported JSON, localStorage). */
function sanitize(o) {
  const out = {};
  if (!o || typeof o !== 'object') return out;
  const hex = v => (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : null);
  const num = v => (Number.isFinite(+v) ? Math.max(0, Math.min(100, Math.round(+v))) : null);
  if (typeof o.name === 'string' && o.name.trim()) out.name = o.name.trim().slice(0, 40);
  if (hex(o.top)) out.top = hex(o.top);
  if (hex(o.bottom)) out.bottom = hex(o.bottom);
  if (num(o.split) != null) out.split = num(o.split);
  ['topDither', 'bottomDither'].forEach(key => {
    const d = o[key];
    if (!d || typeof d !== 'object') return;
    const s = {};
    if (DITHER_MODES.includes(d.mode)) s.mode = d.mode;
    if (d.ink === 'bright' || d.ink === 'dark') s.ink = d.ink;
    if (BLEND_MODES.some(b => b[0] === d.blendMode)) s.blendMode = d.blendMode;
    ['bright', 'space', 'thick', 'blend'].forEach(f => { if (num(d[f]) != null) s[f] = num(d[f]); });
    out[key] = s;
  });
  return out;
}

const STYLE = `
.te-root{color:#a0a0c0;font:12px Inter,system-ui,-apple-system,Segoe UI,sans-serif}
.te-root *{box-sizing:border-box}
.te-root button,.te-root select,.te-root input[type=text]{font:inherit;background:#0f0f14;color:#a0a0c0;border:1px solid #2a2a38;border-radius:4px;padding:6px 8px}
.te-root button{cursor:pointer}
.te-root button:hover:not(:disabled){border-color:#3ecfb2;color:#fff}
.te-root button:disabled{opacity:.4;cursor:default}
.te-root button.danger:hover:not(:disabled){border-color:#d76670}
.te-sec{border-bottom:1px solid #2a2a38;padding-bottom:12px;margin-bottom:12px}
.te-sec:last-child{border:0;margin-bottom:0}
.te-h{font:700 9px 'Press Start 2P',ui-monospace,monospace;letter-spacing:.04em;color:#616174;margin:0 0 9px}
.te-sub{font:700 9px 'Press Start 2P',ui-monospace,monospace;letter-spacing:.04em;color:#3ecfb2;margin:12px 0 6px;text-transform:uppercase}
.te-row{display:flex;align-items:center;gap:7px;margin:6px 0}
.te-row>label{color:#616174;min-width:72px}
.te-row input[type=range]{flex:1;min-width:0;accent-color:#3ecfb2}
.te-row select,.te-row input[type=text]{flex:1;min-width:0}
.te-row input[type=color]{width:38px;height:26px;padding:2px;background:#0f0f14;border:1px solid #2a2a38;border-radius:4px}
.te-row .te-hex{flex:1;font-family:ui-monospace,monospace}
.te-val{width:30px;text-align:right;color:#3ecfb2;font-size:11px}
.te-btns{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin-top:8px}
.te-btns.three{grid-template-columns:repeat(3,1fr)}
.te-btns button{font-size:10px;padding:6px 4px}
.te-preview{display:block;width:100%;max-width:230px;margin:0 auto 8px;height:auto;background:#09090c;border:1px solid #2a2a38;border-radius:4px;image-rendering:pixelated}
.te-palscroll{max-height:228px;overflow:auto;padding-right:4px;margin-top:6px;border:1px solid #1c1c26;border-radius:4px;padding:0 6px 6px}
.te-pal-group h3{font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:#616174;margin:10px 0 6px;padding-bottom:4px;border-bottom:1px solid #2a2a38}
.te-pal{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.te-tile{padding:3px;display:flex;flex-direction:column;align-items:center;gap:2px;font-size:9px;line-height:1.15;text-align:center;min-height:62px}
.te-tile img{width:100%;max-width:64px;height:auto;image-rendering:pixelated;display:block}
.te-tile.active{border-color:#3ecfb2!important;background:#14342f!important;color:#3ecfb2!important}
.te-status{color:#616174;font-size:11px;min-height:15px;margin-top:8px;line-height:1.4}
.te-status b{color:#3ecfb2}
`;

export function createTileEditor(root, opts = {}) {
  const {
    tiles = DEFAULT_TILES, sets = DEFAULT_SETS, groups = DEFAULT_GROUPS,
    storageKey = 'pixelIsometric.tileEditor.v1', onChange = () => {}, onSelect = () => {}, onSetChange = () => {},
    startSet = sets[0] && sets[0].id,
  } = opts;

  tiles.forEach(normalizeTile);
  const byId = Object.fromEntries(tiles.map(t => [t.id, t]));
  const defaults = Object.fromEntries(tiles.map(t => [t.id, clone(pickTile(t))]));
  const setOfGroup = Object.fromEntries(groups.map(g => [g.id, g.setId]));

  let setId = startSet;
  let selectedId = null;
  const history = [];
  let hi = -1;
  const controls = [];          // fns that copy the selected tile into the inputs
  const thumbs = {};            // tile id -> { btn, img, label }

  const cur = () => byId[selectedId];

  /* ───────── state helpers ───────── */

  const snapshot = () => JSON.stringify(Object.fromEntries(tiles.map(t => [t.id, pickTile(t)])));
  function applyMap(map) {
    for (const [id, o] of Object.entries(map)) {
      const t = byId[id];
      if (!t) continue;
      const s = sanitize(o);
      const { topDither, bottomDither, ...flat } = s;
      Object.assign(t, flat);
      if (topDither) t.topDither = { ...t.topDither, ...topDither };
      if (bottomDither) t.bottomDither = { ...t.bottomDither, ...bottomDither };
    }
  }
  const changedMap = () => {
    const out = {};
    tiles.forEach(t => { if (JSON.stringify(pickTile(t)) !== JSON.stringify(defaults[t.id])) out[t.id] = pickTile(t); });
    return out;
  };
  function persist() {
    try { localStorage.setItem(storageKey, JSON.stringify({ v: 1, tiles: changedMap() })); } catch (e) { /* storage unavailable */ }
  }
  function pushHistory() {
    const s = snapshot();
    if (history[hi] === s) return;
    history.length = hi + 1;
    history.push(s);
    if (history.length > 100) history.shift();
    hi = history.length - 1;
    updateButtons();
  }

  /* ───────── DOM ───────── */

  if (!document.getElementById('te-style')) document.head.appendChild(h('style', { id: 'te-style', text: STYLE }));
  root.innerHTML = '';
  root.classList.add('te-root');

  const status = h('div', { class: 'te-status' });
  const say = (html) => { status.innerHTML = html; };

  const btnUndo = h('button', { text: 'Undo', title: 'Undo (Ctrl/Cmd+Z)', onclick: () => undo() });
  const btnRedo = h('button', { text: 'Redo', title: 'Redo (Ctrl/Cmd+Shift+Z)', onclick: () => redo() });
  const btnResetTile = h('button', { class: 'danger', text: 'Reset tile', onclick: () => resetTile() });
  const btnResetAll = h('button', { class: 'danger', text: 'Reset all', onclick: () => resetAll() });

  const setSelect = h('select', { onchange: e => { setId = e.target.value; renderPalette(); const first = tiles.find(t => setOfGroup[t.groupId] === setId); if (first) select(first.id); onSetChange(setId); } },
    sets.map(s => h('option', { value: s.id, text: s.name })));
  const palette = h('div', { class: 'te-palscroll' });

  const previewCanvas = h('canvas', { class: 'te-preview', width: 260, height: 204 });

  const nameInput = h('input', { type: 'text', maxlength: 40 });
  nameInput.addEventListener('input', () => { cur().name = nameInput.value || cur().id; const th = thumbs[selectedId]; if (th) th.label.textContent = cur().name; onChange(selectedId); });
  nameInput.addEventListener('change', commit);
  controls.push(() => { nameInput.value = cur().name; });

  function colorRow(label, key) {
    const c = h('input', { type: 'color' });
    const t = h('input', { type: 'text', maxlength: 7, spellcheck: 'false', class: 'te-hex' });
    c.addEventListener('input', () => { cur()[key] = c.value; t.value = c.value; changed(); });
    c.addEventListener('change', commit);
    t.addEventListener('change', () => {
      const m = /^#?([0-9a-f]{6})$/i.exec(t.value.trim());
      if (m) { cur()[key] = '#' + m[1].toLowerCase(); c.value = cur()[key]; t.value = cur()[key]; changed(); commit(); } else t.value = cur()[key];
    });
    controls.push(() => { c.value = cur()[key]; t.value = cur()[key]; });
    return h('div', { class: 'te-row' }, h('label', { text: label }), c, t);
  }
  function sliderRow(label, get, set) {
    const input = h('input', { type: 'range', min: 0, max: 100, step: 1 });
    const val = h('span', { class: 'te-val' });
    input.addEventListener('input', () => { set(+input.value); val.textContent = input.value; changed(); });
    input.addEventListener('change', commit);
    controls.push(() => { input.value = get(); val.textContent = input.value; });
    return h('div', { class: 'te-row' }, h('label', { text: label }), input, val);
  }
  function selectRow(label, options, get, set) {
    const sel = h('select', {}, options.map(([v, l]) => h('option', { value: v, text: l })));
    sel.addEventListener('change', () => { set(sel.value); changed(); commit(); });
    controls.push(() => { sel.value = get(); });
    return h('div', { class: 'te-row' }, h('label', { text: label }), sel);
  }
  function ditherSection(key, title) {
    const d = () => cur()[key];
    return h('div', {},
      h('h3', { class: 'te-sub', text: title }),
      selectRow('Mode', DITHER_MODES.map(m => [m, cap(m)]), () => d().mode, v => { d().mode = v; }),
      selectRow('Ink type', [['bright', 'Bright'], ['dark', 'Dark']], () => d().ink, v => { d().ink = v; }),
      selectRow('Blend mode', BLEND_MODES, () => d().blendMode || 'source-over', v => { d().blendMode = v; }),
      sliderRow('Bright', () => d().bright, v => { d().bright = v; }),
      sliderRow('Space', () => d().space, v => { d().space = v; }),
      sliderRow('Thick', () => d().thick, v => { d().thick = v; }),
      sliderRow('Blend', () => d().blend, v => { d().blend = v; }),
    );
  }

  const fileInput = h('input', { type: 'file', accept: 'application/json,.json', style: 'display:none' });
  fileInput.addEventListener('change', async () => {
    const f = fileInput.files && fileInput.files[0];
    fileInput.value = '';
    if (!f) return;
    try { importJSON(JSON.parse(await f.text())); } catch (e) { say('Could not read that file as JSON.'); }
  });

  root.append(
    h('section', { class: 'te-sec' },
      h('h2', { class: 'te-h', text: 'Tile Editor' }),
      h('div', { class: 'te-btns three' }, btnUndo, btnRedo, btnResetTile),
      h('div', { class: 'te-row' }, h('label', { text: 'Set' }), setSelect),
      palette,
    ),
    h('section', { class: 'te-sec' },
      h('h2', { class: 'te-h', text: 'Live Tile' }),
      previewCanvas,
      h('div', { class: 'te-row' }, h('label', { text: 'Name' }), nameInput),
      h('h3', { class: 'te-sub', text: 'Geometry' }),
      colorRow('Top colour', 'top'),
      colorRow('Bottom colour', 'bottom'),
      sliderRow('Split', () => cur().split, v => { cur().split = v; }),
      ditherSection('topDither', 'Top Pattern'),
      ditherSection('bottomDither', 'Bottom Pattern'),
    ),
    h('section', { class: 'te-sec' },
      h('h2', { class: 'te-h', text: 'Save & Share' }),
      h('div', { class: 'te-btns' },
        h('button', { text: 'Export edits (JSON)', onclick: () => exportJSON() }),
        h('button', { text: 'Import JSON…', onclick: () => fileInput.click() }),
        h('button', { text: 'Export set as config.js', onclick: () => exportConfig() }),
        btnResetAll,
      ),
      fileInput,
      status,
    ),
  );

  /* ───────── rendering ───────── */

  function drawPreview() {
    const t = cur();
    if (!t) return;
    const g = previewCanvas.getContext('2d');
    g.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    g.fillStyle = '#09090c';
    g.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
    g.imageSmoothingEnabled = false;
    const k = 3, ox = 10, oy = 6;
    const sc = pts => pts.map(([x, y]) => [x * k + ox, y * k + oy]);
    drawTextureQuad(g, sc([[10, 23], [40, 39], [40, 57], [10, 41]]), faceTexture(t, 'left'));
    drawTextureQuad(g, sc([[40, 39], [70, 23], [70, 41], [40, 57]]), faceTexture(t, 'right'));
    drawTextureQuad(g, sc([[40, 7], [70, 23], [40, 39], [10, 23]]), faceTexture(t, 'top'));
  }

  function updateThumb(id) {
    const th = thumbs[id];
    if (th) { th.img.src = tilePreviewURL(byId[id]); th.label.textContent = byId[id].name; }
  }

  function renderPalette() {
    palette.innerHTML = '';
    Object.keys(thumbs).forEach(k => delete thumbs[k]);
    setSelect.value = setId;
    groups.filter(g => g.setId === setId).forEach(g => {
      const list = tiles.filter(t => t.groupId === g.id);
      if (!list.length) return;
      const grid = h('div', { class: 'te-pal' });
      list.forEach(t => {
        const img = h('img', { alt: '', src: tilePreviewURL(t) });
        const label = h('span', { text: t.name });
        const btn = h('button', { class: 'te-tile' + (t.id === selectedId ? ' active' : ''), title: t.name, 'data-id': t.id, onclick: () => select(t.id) }, img, label);
        thumbs[t.id] = { btn, img, label };
        grid.appendChild(btn);
      });
      palette.appendChild(h('div', { class: 'te-pal-group' }, h('h3', { text: g.name }), grid));
    });
  }

  function syncControls() { controls.forEach(fn => fn()); }
  function updateButtons() {
    btnUndo.disabled = hi <= 0;
    btnRedo.disabled = hi >= history.length - 1;
  }

  /* ───────── actions ───────── */

  function changed() {
    drawPreview();
    updateThumb(selectedId);
    onChange(selectedId);
  }
  function commit() {
    pushHistory();
    persist();
    const n = Object.keys(changedMap()).length;
    say(n ? `<b>${n}</b> tile${n === 1 ? '' : 's'} edited · autosaved in this browser` : 'No edits yet · autosaves in this browser');
  }

  function select(id) {
    if (!byId[id]) return;
    const s = setOfGroup[byId[id].groupId];
    if (s && s !== setId) { setId = s; selectedId = id; renderPalette(); }
    selectedId = id;
    Object.entries(thumbs).forEach(([k, th]) => th.btn.classList.toggle('active', k === id));
    syncControls();
    drawPreview();
    onSelect(id);
  }

  function refreshAll() {
    Object.keys(thumbs).forEach(updateThumb);
    syncControls();
    drawPreview();
  }

  function restore(snap) {
    applyMap(JSON.parse(snap));
    refreshAll();
    onChange(null);
    persist();
  }
  function undo() { if (hi > 0) { hi--; restore(history[hi]); updateButtons(); } }
  function redo() { if (hi < history.length - 1) { hi++; restore(history[hi]); updateButtons(); } }

  function resetTile() {
    if (!selectedId) return;
    applyMap({ [selectedId]: defaults[selectedId] });
    // dithers were merged field-by-field above, so write them back whole
    cur().topDither = { ...defaults[selectedId].topDither };
    cur().bottomDither = { ...defaults[selectedId].bottomDither };
    refreshAll(); onChange(selectedId); commit();
  }
  function resetAll() {
    tiles.forEach(t => {
      const d = defaults[t.id];
      Object.assign(t, { name: d.name, top: d.top, bottom: d.bottom, split: d.split });
      t.topDither = { ...d.topDither };
      t.bottomDither = { ...d.bottomDither };
    });
    refreshAll(); onChange(null); commit();
  }

  function exportJSON() {
    const map = changedMap();
    const n = Object.keys(map).length;
    downloadText('tile-edits.json', JSON.stringify({ app: 'pixel-isometric-tile-editor', version: 1, tiles: map }, null, 2), 'application/json');
    say(`Exported <b>${n}</b> edited tile${n === 1 ? '' : 's'} (only tiles that differ from the defaults).`);
    return map;
  }
  function importJSON(data) {
    let map = data && data.tiles;
    if (Array.isArray(map)) map = Object.fromEntries(map.filter(t => t && t.id).map(t => [t.id, t]));
    if (!map || typeof map !== 'object') { say('That file has no tiles in it.'); return 0; }
    const ids = Object.keys(map).filter(id => byId[id]);
    ids.forEach(id => {
      const s = sanitize(map[id]);
      const { topDither, bottomDither, ...flat } = s;
      Object.assign(byId[id], flat);
      if (topDither) byId[id].topDither = { ...byId[id].topDither, ...topDither };
      if (bottomDither) byId[id].bottomDither = { ...byId[id].bottomDither, ...bottomDither };
    });
    refreshAll(); onChange(null); commit();
    say(`Imported <b>${ids.length}</b> tile${ids.length === 1 ? '' : 's'}${ids.length < Object.keys(map).length ? ' (unknown ids skipped)' : ''}.`);
    return ids.length;
  }
  function configText(forSet = setId) {
    const gs = new Set(groups.filter(g => g.setId === forSet).map(g => g.id));
    const q = s => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
    const d = x => `dither(${q(x.mode)}, ${q(x.ink)}, ${x.bright}, ${x.space}, ${x.thick}, ${x.blend}, ${q(x.blendMode || 'source-over')})`;
    const list = tiles.filter(t => gs.has(t.groupId));
    const setName = (sets.find(s => s.id === forSet) || {}).name || forSet;
    return `// ${setName} tiles — paste into DEFAULT_TILES in config.js (replaces the existing entries with the same ids)\n` +
      list.map(t => `  tile(${q(t.id)}, ${q(t.name)}, ${q(t.groupId)}, ${q(t.top)}, ${q(t.bottom)}, ${t.split},\n    ${d(t.topDither)}, ${d(t.bottomDither)}),`).join('\n') + '\n';
  }
  function exportConfig() {
    downloadText(`${setId}-tiles.config.js`, configText(setId), 'text/javascript');
    say('Exported the tiles in this set in <b>config.js</b> format.');
  }

  document.addEventListener('keydown', e => {
    if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'z') return;
    const t = e.target;
    if (t && t.tagName === 'INPUT' && t.type === 'text') return;
    e.preventDefault();
    if (e.shiftKey) redo(); else undo();
  });

  /* ───────── boot ───────── */

  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (saved && saved.tiles) applyMap(saved.tiles);
  } catch (e) { /* ignore bad or missing storage */ }

  renderPalette();
  const first = tiles.find(t => setOfGroup[t.groupId] === setId) || tiles[0];
  pushHistory();
  select(first.id);
  commit();

  return {
    select, undo, redo, resetAll, resetTile, exportJSON, importJSON, exportConfig, configText,
    refresh: refreshAll,
    getSelected: () => selectedId,
    getTile: id => byId[id],
    changed: changedMap,
  };
}
