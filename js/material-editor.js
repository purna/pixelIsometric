import * as THREE from 'three';
import { getActiveMaterial, setActiveMaterial as setManagerActiveMaterial } from './material-manager.js';

const STORAGE_KEY = 'pixelIso_savedMaterials';
let savedMaterials = [];
let activeMaterial = null;

function loadSavedMaterials() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) savedMaterials = JSON.parse(raw);
    } catch { savedMaterials = []; }
}

function persistSavedMaterials() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(savedMaterials)); } catch {}
}

function serializeUniforms(uniforms) {
    const obj = {};
    for (const [k, u] of Object.entries(uniforms)) {
        if (u.value instanceof THREE.Color) {
            obj[k] = { value: '#' + u.value.getHexString() };
        } else {
            obj[k] = { value: u.value };
        }
    }
    return obj;
}

export function applySavedUniforms(material, saved) {
    if (!material.userData.uniforms) return;
    const u = material.userData.uniforms;
    for (const [k, entry] of Object.entries(saved)) {
        if (!u[k]) continue;
        if (entry.value && typeof entry.value === 'string' && entry.value.startsWith('#')) {
            u[k].value.set(entry.value);
        } else {
            u[k].value = entry.value;
        }
    }
    if (saved.materialMode !== undefined) {
        u.materialMode.value = saved.materialMode;
        const mode = saved.materialMode;
        material.transparent = mode === 2;
        material.opacity = mode === 2 ? (parseFloat(saved.globalOpacity?.value ?? 60) / 100) : 1.0;
        material.roughness = mode === 2 ? 0.1 : 0.6;
    }
    material.needsUpdate = true;
    updateUIFromMaterial(material);
}

function renderSwatches() {
    const container = document.getElementById('palette-swatches');
    const currentActive = getActiveMaterial();
    if (!container) return;
    container.innerHTML = '';
    savedMaterials.forEach((mat, index) => {
        const swatch = document.createElement('div');
        const isActive = currentActive?.userData?.savedId === mat.id;
        swatch.className = 'saved-swatch' + (isActive ? ' active' : '');
        swatch.style.background = mat.baseColor?.value || '#8a7a60';
        swatch.title = `Material ${index + 1}`;

        const del = document.createElement('span');
        del.className = 'swatch-delete';
        del.innerHTML = '\u00d7';
        del.onclick = (e) => {
            e.stopPropagation();
            savedMaterials.splice(index, 1);
            persistSavedMaterials();
            renderSwatches();
        };

        swatch.onclick = () => {
            const newMat = activeMaterial.clone();
            newMat.userData.uniforms = THREE.UniformsUtils.clone(activeMaterial.userData.uniforms);
            newMat.userData.savedId = mat.id;
            applySavedUniforms(newMat, mat);
            setManagerActiveMaterial(newMat);
            setActiveMaterial(newMat);
        };

        swatch.appendChild(del);
        container.appendChild(swatch);
    });
}

function updateUIFromMaterial(material) {
    if (!material?.userData?.uniforms) return;
    const u = material.userData.uniforms;
    const get = (key, fallback) => u[key]?.value ?? fallback;
    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };

    setVal('materialMode', get('materialMode', 0));
    setVal('globalOpacity', material.opacity * 100);

    setVal('baseColor', '#' + get('baseColor', new THREE.Color('#8a7a60')).getHexString());
    setVal('colA', '#' + get('colorA', new THREE.Color('#3ecfb2')).getHexString());
    setVal('colB', '#' + get('colorB', new THREE.Color('#c94b6e')).getHexString());
    setVal('split', get('splitY', 0) * 100); // The shader uses -0.5 to 0.5, UI is -50 to 50

    setVal('tMode', get('tMode', 4));
    setVal('tInkMode', get('tInkMode', 0));
    setVal('tBright', get('tBright', 1) * 100);
    setVal('tInkCol', '#' + get('tInkColor', new THREE.Color('#ffffff')).getHexString());
    setVal('tSpace', get('tSpace', 6));
    setVal('tThick', get('tThick', 1));
    setVal('tAlpha', get('tAlpha', 0.5) * 100);

    setVal('bMode', get('bMode', 1));
    setVal('bInkMode', get('bInkMode', 0));
    setVal('bBright', get('bBright', -1) * 100);
    setVal('bInkCol', '#' + get('bInkColor', new THREE.Color('#000000')).getHexString());
    setVal('bSpace', get('bSpace', 4));
    setVal('bThick', get('bThick', 1));
    setVal('bAlpha', get('bAlpha', 0.7) * 100);

    document.getElementById('materialMode').dispatchEvent(new Event('change'));
}

function setupPanelVisibility() {
    const materialModeSelect = document.getElementById('materialMode');
    materialModeSelect.addEventListener('change', e => {
        const mode = parseInt(e.target.value);
        if (activeMaterial) activeMaterial.userData.uniforms.materialMode.value = mode;

        const isSplit = mode === 0;
        const isSolid = mode === 1;
        const isWater = mode === 2;

        if (activeMaterial) {
            activeMaterial.transparent = isWater;
            activeMaterial.opacity = isWater ? parseFloat(document.getElementById('globalOpacity').value) / 100 : 1.0;
            activeMaterial.roughness = isWater ? 0.1 : 0.6;
            activeMaterial.needsUpdate = true;
        }

        document.getElementById('globalOpacityRow').style.display = isWater ? 'flex' : 'none';
        document.getElementById('baseColRow').style.display = isWater ? 'none' : 'flex';
        document.getElementById('botColRow').style.display = isSplit ? 'flex' : 'none';
        document.getElementById('splitRow').style.display = isSplit ? 'flex' : 'none';
        document.getElementById('bottomDitherSection').style.display = isSplit ? 'block' : 'none';
        document.querySelector('#topColRow span').textContent = isSolid ? 'Overlay Col' : 'Top Overlay';
    });

    ['t', 'b'].forEach(prefix => {
        document.getElementById(`${prefix}InkMode`).addEventListener('change', e => {
            const val = parseInt(e.target.value);
            if (activeMaterial) activeMaterial.userData.uniforms[`${prefix}InkMode`].value = val;
            document.getElementById(`${prefix}BrightRow`).classList.toggle('hidden', val === 1);
            document.getElementById(`${prefix}ColorRow`).classList.toggle('hidden', val === 0);
        });
    });
}

export function initMaterialEditor(getMaterialCallback) {
    loadSavedMaterials();
    renderSwatches();
    setupPanelVisibility();

    const inputs = [
        ['globalOpacity', 'opacity', v => v / 100, false, true],
        ['baseColor', 'baseColor', v => new THREE.Color(v), true],
        ['colA', 'colorA', v => new THREE.Color(v), true],
        ['colB', 'colorB', v => new THREE.Color(v), true],
        ['split', 'splitY', v => v / 100, true], // UI is -50 to 50, uniform is -0.5 to 0.5
        ['tMode', 'tMode', v => parseInt(v), true],
        ['tInkCol', 'tInkColor', v => new THREE.Color(v), true],
        ['tSpace', 'tSpace', v => parseFloat(v), true],
        ['tThick', 'tThick', v => parseFloat(v), true],
        ['tBright', 'tBright', v => v / 100, true],
        ['tAlpha', 'tAlpha', v => v / 100, true],
        ['bMode', 'bMode', v => parseInt(v), true],
        ['bInkCol', 'bInkColor', v => new THREE.Color(v), true],
        ['bSpace', 'bSpace', v => parseFloat(v), true],
        ['bThick', 'bThick', v => parseFloat(v), true],
        ['bBright', 'bBright', v => v / 100, true],
        ['bAlpha', 'bAlpha', v => v / 100, true],
    ];

    inputs.forEach(([id, key, transform, isUniform, isMatProp]) => {
        document.getElementById(id)?.addEventListener('input', e => {
            const mat = getMaterialCallback();
            if (!mat) return;
            const value = transform(e.target.value);
            if (isUniform && mat.userData.uniforms[key]) {
                mat.userData.uniforms[key].value = value;
            } else if (isMatProp) {
                mat[key] = value;
            }
        });
    });

    document.getElementById('btn-save-mat').addEventListener('click', () => {
        const mat = getMaterialCallback();
        if (!mat) return;
        const existingId = mat.userData.savedId;
        const snapshot = serializeUniforms(mat.userData.uniforms);
        snapshot.id = existingId || `mat_${Date.now()}`;
        mat.userData.savedId = snapshot.id;
        const existingIndex = savedMaterials.findIndex(m => m.id === existingId);
        if (existingIndex > -1) {
            savedMaterials[existingIndex] = snapshot;
        } else {
            savedMaterials.push(snapshot);
        }
        persistSavedMaterials();
        renderSwatches();
    });

    document.getElementById('btn-new-mat').addEventListener('click', () => {
        const current = getActiveMaterial();
        if (!current) return;
        const mat = current.clone();
        mat.userData.uniforms = THREE.UniformsUtils.clone(current.userData.uniforms);
        delete mat.userData.savedId;
        setManagerActiveMaterial(mat);
        setActiveMaterial(mat);
    });
}

export function setActiveMaterial(material) {
    activeMaterial = material;
    updateUIFromMaterial(material);
    renderSwatches();
}