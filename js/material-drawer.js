import { copyCubeMaterialUniforms } from './material-instance.js';
import * as THREE from 'three';

const DMODE_OPTS = [['0', 'Off'], ['1', 'Noise'], ['2', 'H-Lines'], ['3', 'V-Lines'], ['4', 'Crosshatch']];
const IMODE_OPTS = [['0', 'Bright'], ['1', 'Color']];

const MODE_OPTS = [['0', 'Split'], ['1', 'Solid'], ['2', 'Water']];

/* ── Saved material palette ────────────────────────────────────── */
const STORAGE_KEY = 'pixelIso_savedMaterials';
let savedMaterials = [];
let selectedSwatchIndex = null;

function loadSavedMaterials() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) savedMaterials = JSON.parse(raw);
  } catch { savedMaterials = []; }
}

function persistSavedMaterials() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(savedMaterials)); } catch {}
}

loadSavedMaterials();

export function selectSwatch(index) {
  selectedSwatchIndex = index;
  renderSwatches();
  const mesh = getCurrentMesh();
  if (mesh && index !== null && savedMaterials[index]) {
    applySavedUniforms(mesh, savedMaterials[index]);
    openDrawerFor(mesh, true); // refresh drawer without re-rendering swatches
  }
}

export function deselectSwatch() {
  selectedSwatchIndex = null;
  renderSwatches();
}

export function getSelectedSwatchIndex() { return selectedSwatchIndex; }

export function deleteSwatch(index, e) {
  e?.stopPropagation?.();
  savedMaterials.splice(index, 1);
  if (selectedSwatchIndex === index) selectedSwatchIndex = null;
  else if (selectedSwatchIndex > index) selectedSwatchIndex--;
  persistSavedMaterials();
  renderSwatches();
}

export function saveCurrentMaterial() {
  const mesh = getCurrentMesh();
  if (!mesh || !mesh.material.userData.uniforms) return;

  const snapshot = serializeUniforms(mesh.material.userData.uniforms);
  snapshot.materialMode = mesh.material.userData.uniforms.materialMode.value;

  if (selectedSwatchIndex !== null) {
    savedMaterials[selectedSwatchIndex] = snapshot;
  } else {
    savedMaterials.push(snapshot);
    selectedSwatchIndex = savedMaterials.length - 1;
  }
  persistSavedMaterials();
  renderSwatches();
}

function serializeUniforms(uniforms) {
  const obj = {};
  for (const [k, u] of Object.entries(uniforms)) {
    if (k === 'pStart' || k === 'pEnd') {
      obj[k] = { value: { x: u.value.x, y: u.value.y } };
    } else if (u.value && typeof u.value.clone === 'function') {
      obj[k] = { value: '#' + u.value.getHexString() };
    } else {
      obj[k] = { value: u.value };
    }
  }
  return obj;
}

function applySavedUniforms(mesh, saved) {
  const u = mesh.material.userData.uniforms;
  const mat = mesh.material;
  for (const [k, entry] of Object.entries(saved)) {
    if (!u[k]) continue;
    if (k === 'pStart' || k === 'pEnd') {
      u[k].value.set(entry.value.x, entry.value.y);
    } else if (entry.value && typeof entry.value === 'string' && entry.value.startsWith('#')) {
      u[k].value.set(entry.value);
    } else {
      u[k].value = entry.value;
    }
  }
  if (saved.materialMode !== undefined) {
    u.materialMode.value = saved.materialMode;
    const mode = saved.materialMode;
    if (mode === 2) {
      mat.transparent = true;
      mat.opacity = parseFloat(saved.waterOpacity?.value ?? 60) / 100;
      mat.roughness = 0.1;
    } else {
      mat.transparent = false;
      mat.opacity = 1.0;
      mat.roughness = 0.6;
    }
  }
  mat.needsUpdate = true;
}

export function renderSwatches() {
  ['palette-swatches', 'saved-swatches'].forEach(containerId => {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    savedMaterials.forEach((mat, index) => {
      const swatch = document.createElement('div');
      swatch.className = 'saved-swatch' + (index === selectedSwatchIndex ? ' active' : '');
      swatch.style.background = '#' + new THREE.Color(mat.baseColor?.value || '#8a7a60').getHexString();
      swatch.title = `Material ${index + 1}`;

      const del = document.createElement('span');
      del.className = 'swatch-delete';
      del.innerHTML = '\u00d7';
      del.addEventListener('click', (e) => deleteSwatch(index, e));

      swatch.addEventListener('click', () => {
        if (selectedSwatchIndex === index) {
          deselectSwatch();
        } else {
          selectSwatch(index);
        }
      });

      swatch.appendChild(del);
      container.appendChild(swatch);
    });
  });
}

/* ── Drawer state ──────────────────────────────────────────────── */

let currentPanelMesh = null;
let isRefresh = false;

export function openDrawerFor(mesh, refresh = false) {
  if (!mesh) { closeDrawer(); return; }
  isRefresh = refresh;
  currentPanelMesh = mesh;
  const u = mesh?.material?.userData?.uniforms;
  const mode = u?.materialMode?.value ?? 0;
  const baseCol = u?.baseColor ? '#' + u.baseColor.value.getHexString() : (mesh?.material?.color ? '#' + mesh.material.color.getHexString() : '#8a7a60');
  const colA = u?.colorA ? '#' + u.colorA.value.getHexString() : (mesh?.material?.color ? '#' + mesh.material.color.getHexString() : '#3ecfb2');
  const colB = u?.colorB ? '#' + u.colorB.value.getHexString() : '#c94b6e';
  const split = u?.splitY ? Math.round((u.splitY.value / 0.5) * 50) : 0;
  const html = buildPanelHTML(mesh, mode, baseCol, colA, colB, split);
  const drawer = document.getElementById('viewport-bottom-drawer');
  const drawerInner = document.getElementById('drawer-inner');
  if (!drawer || !drawerInner) return;

  drawerInner.innerHTML = html;
  drawer.classList.add('open');
  const height = mode === 1 ? 80 : 148;
  drawer.style.height = height + 'px';
  wireDrawerEvents(mesh, mode);
}

export function closeDrawer() {
  const drawer = document.getElementById('viewport-bottom-drawer');
  if (drawer) {
    drawer.classList.remove('open');
    drawer.style.height = '0';
  }
  currentPanelMesh = null;
  selectedSwatchIndex = null;
}

export function getCurrentMesh() { return currentPanelMesh; }
export function setCurrentMesh(m) { currentPanelMesh = m; }

function updateSidebarVisibility(mode) {
  const baseColRow = document.getElementById('baseColRow');
  const botColRow = document.getElementById('botColRow');
  const splitRow = document.getElementById('splitRow');
  const bottomDitherSection = document.getElementById('bottomDitherSection');
  const topColRow = document.getElementById('topColRow');

  if (mode === 0) {
    baseColRow && (baseColRow.style.display = 'flex');
    topColRow && (topColRow.style.display = 'flex');
    botColRow && (botColRow.style.display = 'flex');
    splitRow && (splitRow.style.display = 'flex');
    bottomDitherSection && (bottomDitherSection.style.display = 'block');
  } else if (mode === 1) {
    baseColRow && (baseColRow.style.display = 'flex');
    topColRow && (topColRow.style.display = 'flex');
    botColRow && (botColRow.style.display = 'none');
    splitRow && (splitRow.style.display = 'none');
    bottomDitherSection && (bottomDitherSection.style.display = 'none');
  } else if (mode === 2) {
    baseColRow && (baseColRow.style.display = 'none');
    topColRow && (topColRow.style.display = 'none');
    botColRow && (botColRow.style.display = 'none');
    splitRow && (splitRow.style.display = 'none');
    bottomDitherSection && (bottomDitherSection.style.display = 'none');
  }
}

export function updateSidebarFromMesh(mesh) {
  if (!mesh?.material?.userData?.uniforms) return;
  const u = mesh.material.userData.uniforms;
  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };

  setVal('materialMode', u.materialMode?.value ?? 0);
  setVal('globalOpacity', Math.round((mesh.material.opacity ?? 1) * 100));
  setVal('baseColor', u.baseColor ? '#' + u.baseColor.value.getHexString() : '#8a7a60');
  setVal('colA', u.colorA ? '#' + u.colorA.value.getHexString() : '#3ecfb2');
  setVal('colB', u.colorB ? '#' + u.colorB.value.getHexString() : '#c94b6e');
  setVal('split', u.splitY ? Math.round(u.splitY.value * 50) : 0);

  setVal('tMode', u.tMode?.value ?? 4);
  setVal('tInkMode', u.tInkMode?.value ?? 0);
  setVal('tBright', u.tBright ? Math.round(u.tBright.value * 100) : 100);
  setVal('tInkCol', u.tInkColor ? '#' + u.tInkColor.value.getHexString() : '#ffffff');
  setVal('tSpace', Math.round(u.tSpace?.value ?? 6));
  setVal('tThick', u.tThick ? Math.round(u.tThick.value * 2) / 2 : 1);
  setVal('tAlpha', u.tAlpha ? Math.round(u.tAlpha.value * 100) : 50);

  setVal('bMode', u.bMode?.value ?? 1);
  setVal('bInkMode', u.bInkMode?.value ?? 0);
  setVal('bBright', u.bBright ? Math.round(u.bBright.value * 100) : -100);
  setVal('bInkCol', u.bInkColor ? '#' + u.bInkColor.value.getHexString() : '#000000');
  setVal('bSpace', Math.round(u.bSpace?.value ?? 4));
  setVal('bThick', u.bThick ? Math.round(u.bThick.value * 2) / 2 : 1);
  setVal('bAlpha', u.bAlpha ? Math.round(u.bAlpha.value * 100) : 70);

  updateSidebarVisibility(u.materialMode?.value ?? 0);
}

function swatchesToolbarHTML() {
  return `
    <div class="drawer-col" style="flex: 1 1 100%; border-right: none; margin-right: 0;">
      <div class="d-title" style="--dt-color:#7a7a9a">Saved Materials</div>
      <div class="d-row" style="justify-content: flex-start; gap: 8px; flex-wrap: wrap;">
        <button id="btn-save-mat" class="tb-mini">Save</button>
        <button id="btn-new-mat" class="tb-mini">New</button>
        <div id="saved-swatches" style="display: flex; flex-wrap: wrap; gap: 6px; align-items: center;"></div>
      </div>
    </div>`;
}

function ditherColsHTML(u, titleTop, titleBot, accentTop, accentBot) {
  if (!u) return '';
  const topMode = u.tMode?.value ?? 4;
  const topInk = u.tInkMode?.value ?? 0;
  const topBright = u.tBright?.value ?? 1;
  const topInkCol = u.tInkColor?.value ?? '#ffffff';
  const topSpace = u.tSpace?.value ?? 6;
  const topThick = u.tThick?.value ?? 1;
  const topAlpha = u.tAlpha?.value ?? 0.5;

  const botMode = u.bMode?.value ?? 1;
  const botInk = u.bInkMode?.value ?? 0;
  const botBright = u.bBright?.value ?? -1;
  const botInkCol = u.bInkColor?.value ?? '#000000';
  const botSpace = u.bSpace?.value ?? 4;
  const botThick = u.bThick?.value ?? 1;
  const botAlpha = u.bAlpha?.value ?? 0.7;

  const fmt = (v, isFloat) => isFloat ? parseFloat(v.toFixed(2)) : Math.round(v);
  const tBrightRow = topInk === 1 ? ' hidden' : '';
  const tColorRow = topInk === 0 ? ' hidden' : '';
  const bBrightRow = botInk === 1 ? ' hidden' : '';
  const bColorRow = botInk === 0 ? ' hidden' : '';

  return `
  <div class="drawer-col">
    <div class="d-title" style="--dt-color:${accentTop}">${titleTop}</div>
    <div class="d-row">Mode ${mkSelect('tMode', DMODE_OPTS, topMode)}</div>
    <div class="d-row">Ink ${mkSelect('tInkMode', IMODE_OPTS, topInk)}</div>
    <div class="d-row${tBrightRow}" id="tBrightRow">Bright <input type="range" id="tBright" min="-100" max="100" value="${fmt(topBright * 100, false)}"></div>
    <div class="d-row hidden${tColorRow}" id="tColorRow">Ink Col <input type="color" id="tInkCol" value="${topInkCol}"></div>
    <div class="d-row">Space <input type="range" id="tSpace" min="2" max="16" value="${fmt(topSpace, false)}"></div>
    <div class="d-row">Thick <input type="range" id="tThick" min="1" max="6" value="${fmt(topThick * 2, false) / 2}" step="0.5"></div>
    <div class="d-row">Blend <input type="range" id="tAlpha" min="5" max="100" value="${fmt(topAlpha * 100, false)}"></div>
  </div>
  <div class="drawer-col">
    <div class="d-title" style="--dt-color:${accentBot}">${titleBot}</div>
    <div class="d-row">Mode ${mkSelect('bMode', DMODE_OPTS, botMode)}</div>
    <div class="d-row">Ink ${mkSelect('bInkMode', IMODE_OPTS, botInk)}</div>
    <div class="d-row${bBrightRow}" id="bBrightRow">Bright <input type="range" id="bBright" min="-100" max="100" value="${fmt(botBright * 100, false)}"></div>
    <div class="d-row hidden${bColorRow}" id="bColorRow">Ink Col <input type="color" id="bInkCol" value="${botInkCol}"></div>
    <div class="d-row">Space <input type="range" id="bSpace" min="2" max="16" value="${fmt(botSpace, false)}"></div>
    <div class="d-row">Thick <input type="range" id="bThick" min="1" max="6" value="${fmt(botThick * 2, false) / 2}" step="0.5"></div>
    <div class="d-row">Blend <input type="range" id="bAlpha" min="5" max="100" value="${fmt(botAlpha * 100, false)}"></div>
  </div>`;
}

function mkSelect(id, options, selectedVal) {
  return `<select id="${id}">${options.map(([v, t]) => `<option value="${v}"${v == selectedVal ? ' selected' : ''}>${t}</option>`).join('')}</select>`;
}

function buildPanelHTML(mesh, mode, baseCol, colA, colB, split) {
  const modeSel = mkSelect('materialMode', MODE_OPTS, mode);
  let body = '';
  if (mode === 0) {
    body = `
      <div class="drawer-col">
        <div class="d-title" style="--dt-color:#e8a838">Split</div>
        <div class="d-row">Base Col <input type="color" id="baseColor" value="${baseCol}"></div>
        <div class="d-row">Top Overlay <input type="color" id="colA" value="${colA}"></div>
        <div class="d-row">Bot Overlay <input type="color" id="colB" value="${colB}"></div>
        <div class="d-row">Split Y <input type="range" id="split" min="-50" max="50" value="${split}"></div>
      </div>
      ${ditherColsHTML(mesh.material.userData.uniforms, 'Top Dither', 'Bot Dither', '#e8a838', '#c94b6e')}`;
  } else if (mode === 1) {
    body = `
      <div class="drawer-col">
        <div class="d-title" style="--dt-color:#3ecfb2">Solid Overlay</div>
        <div class="d-row">Base Col <input type="color" id="baseColor" value="${baseCol}"></div>
        <div class="d-row">Overlay Col <input type="color" id="colA" value="${colA}"></div>
      </div>`;
  } else if (mode === 2) {
    const op = mesh.material.opacity ?? 0.6;
    body = `
      <div class="drawer-col">
        <div class="d-title" style="--dt-color:#5b9bd5">Water</div>
        <div class="d-row">Opacity <input type="range" id="waterOpacity" min="10" max="100" value="${Math.round(op * 100)}"></div>
        <div class="d-row">Color <input type="color" id="colA" value="${colA}"></div>
      </div>`;
  }
  return `<div class="drawer-inner">
    ${swatchesToolbarHTML()}
    <div class="drawer-col">
      <div class="d-title" style="--dt-color:#7a7a9a">Material Mode</div>
      <div class="d-row">${modeSel}</div>
    </div>
    ${body}
  </div>`;
}

function wireDrawerEvents(mesh, mode) {
  const $ = (s) => document.getElementById(s);
  if (!mesh || !mesh.material.userData.uniforms) return;
  const u = mesh.material.userData.uniforms;
  const mat = mesh.material;

  function wireInkToggle(selectId, brightRowId, colorRowId, inkColInputId, uTarget, uKeyMode, uKeyColor) {
    const sel = $(selectId); if (!sel) return;
    sel.addEventListener('change', e => {
      const v = parseInt(e.target.value);
      uTarget[uKeyMode].value = v;
      $(brightRowId)?.classList.toggle('hidden', v === 1);
      $(colorRowId)?.classList.toggle('hidden', v === 0);
    });
    $(inkColInputId)?.addEventListener('input', e => uTarget[uKeyColor].value.set(e.target.value));
  }

  renderSwatches();

  $('btn-save-mat')?.addEventListener('click', () => saveCurrentMaterial());
  $('btn-new-mat')?.addEventListener('click', () => {
    deselectSwatch();
    document.getElementById('status-msg').textContent = 'New material — adjust settings then Save';
  });

  $('materialMode')?.addEventListener('change', e => {
    const newMode = parseInt(e.target.value);
    u.materialMode.value = newMode;
    if (newMode === 2) {
      mat.transparent = true;
      mat.opacity = parseFloat($('waterOpacity')?.value ?? 60) / 100;
      mat.roughness = 0.1;
    } else {
      mat.transparent = false;
      mat.opacity = 1.0;
      mat.roughness = 0.6;
    }
    mat.needsUpdate = true;
    openDrawerFor(mesh);
  });

  if (mode === 0 || mode === 1 || mode === 2) {
    $('baseColor')?.addEventListener('input', e => {
      if (u.baseColor) u.baseColor.value.set(e.target.value);
    });
    if (mode === 0 || mode === 2) {
      $('colA')?.addEventListener('input', e => u.colorA.value.set(e.target.value));
    }
  }
  if (mode === 0) {
    $('colB')?.addEventListener('input', e => u.colorB.value.set(e.target.value));
    $('split')?.addEventListener('input', e => u.splitY.value = (parseFloat(e.target.value) / 50) * 0.5);
    $('tMode')?.addEventListener('change', e => u.tMode.value = parseInt(e.target.value));
    wireInkToggle('tInkMode', 'tBrightRow', 'tColorRow', 'tInkCol', u, 'tInkMode', 'tInkColor');
    $('tBright')?.addEventListener('input', e => u.tBright.value = parseFloat(e.target.value) / 100);
    $('tSpace')?.addEventListener('input', e => u.tSpace.value = parseFloat(e.target.value));
    $('tThick')?.addEventListener('input', e => u.tThick.value = parseFloat(e.target.value));
    $('tAlpha')?.addEventListener('input', e => u.tAlpha.value = parseFloat(e.target.value) / 100);

    $('bMode')?.addEventListener('change', e => u.bMode.value = parseInt(e.target.value));
    wireInkToggle('bInkMode', 'bBrightRow', 'bColorRow', 'bInkCol', u, 'bInkMode', 'bInkColor');
    $('bBright')?.addEventListener('input', e => u.bBright.value = parseFloat(e.target.value) / 100);
    $('bSpace')?.addEventListener('input', e => u.bSpace.value = parseFloat(e.target.value));
    $('bThick')?.addEventListener('input', e => u.bThick.value = parseFloat(e.target.value));
    $('bAlpha')?.addEventListener('input', e => u.bAlpha.value = parseFloat(e.target.value) / 100);
  }
  if (mode === 2) {
    $('waterOpacity')?.addEventListener('input', e => {
      mat.opacity = parseFloat(e.target.value) / 100;
    });
  }
}
