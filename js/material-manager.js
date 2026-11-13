/**
 * material-manager.js
 *
 *
 * Manages material swatches / chips on the mat-chip-bar.
 * Each chip is an SVG with the shape icon in the shape's accent color.
 * Clicking a chip selects that shape (tool).
 *
 * Also manages the two-tone dither uniforms shared by cube-dither meshes.
 */

import { setActiveMaterial as setEditorActiveMaterial } from './material-editor.js';
let activeMaterial = null;
import * as THREE from 'three'; // This was missing
import { getShapeType, allShapeTypes } from './shape-registry.js';
import { createCubeMaterial } from './material-instance.js';

let activeToolId = null;
const prototypeMaterials = new Map();

function createPrototypeMaterials() {
    allShapeTypes().forEach(type => {
        if (type.id.startsWith('cube-')) {
            const material = createCubeMaterial();
            // You could set default values per type here if you want
            // For example:
            if (type.id === 'cube-water') {
                material.userData.uniforms.materialMode.value = 2;
                material.transparent = true;
                material.opacity = 0.6;
                material.roughness = 0.1;
            }
            prototypeMaterials.set(type.id, material);
        }
    });
}

createPrototypeMaterials();

/**
 * Returns the prototype material for a given shape type ID.
 * This is the material that the UI edits before an object is placed.
 * @param {string} typeId
 * @returns {THREE.Material | undefined}
 */
export function getPrototypeMaterial(typeId) {
    return prototypeMaterials.get(typeId);
}

export function getActiveMaterial() { return activeMaterial; }
export function setActiveMaterial(mat) { activeMaterial = mat; }

/**
 * Creates a new instance of a material for a given shape type,
 * by cloning the prototype material.
 * @param {string} typeId
 * @returns {THREE.Material | undefined}
 */
export function createMaterialInstance(typeId) {
    const prototype = getPrototypeMaterial(typeId);
    if (prototype) {
        activeMaterial = prototype;
        const newMaterial = prototype.clone();
        newMaterial.userData.uniforms = THREE.UniformsUtils.clone(prototype.userData.uniforms);
        return newMaterial;
    }
    // Fallback for non-custom-material shapes
    const type = getShapeType(typeId);
    return type?.createMesh?.().material;
}

export const materialManager = {
  activeTool: () => activeToolId,

  /** Build the mat-chip-bar at page-load */
  buildChips(matBar, onSelect) {
    if (!matBar) return;
    matBar.innerHTML = '';
    allShapeTypes().forEach((type) => {
      const chip = document.createElement('div');
      chip.className = 'mat-chip';
      chip.id = `mat-chip-${type.id}`;
      chip.style.setProperty('--chip-color', type.accentColor);
      const svg = (type.iconSVG || (() => ''))(type.accentColor || '#3ecfb2');
      chip.innerHTML = `
        <div class="mat-icon">${svg}</div>
        <div class="mat-label">${type.label}</div>`;
      chip.addEventListener('click', () => {
        materialManager.select(type.id);
        const prototypeMaterial = getPrototypeMaterial(type.id);
        if (prototypeMaterial) {
          activeMaterial = prototypeMaterial;
          setEditorActiveMaterial(prototypeMaterial);
          const sidebar = document.getElementById('sidebar');
          if (sidebar.classList.contains('closed')) {
            sidebar.classList.remove('closed');
          }
          document.getElementById('tab-btn-material')?.click();
        }
        onSelect?.(type.id);
      });
      matBar.appendChild(chip);
    });

    const sep = document.createElement('div');
    sep.style.cssText = 'width:1px;height:50px;background:#1a1a22;margin:0 6px;align-self:center;';
    matBar.appendChild(sep);

    const eraseChip = document.createElement('div');
    eraseChip.className = 'mat-chip';
    eraseChip.id = 'mat-chip-erase';
    eraseChip.style.setProperty('--chip-color', '#eb4b6e');
    eraseChip.innerHTML = `
      <div class="mat-icon">
        <svg viewBox="0 0 52 44" xmlns="http://www.w3.org/2000/svg">
          <polygon points="26,2 50,14 26,26 2,14"   fill="#eb4b6e" fill-opacity=".18"/>
          <polygon points="2,14 26,26 26,42 2,30"   fill="#eb4b6e" fill-opacity=".12"/>
          <polygon points="50,14 26,26 26,42 50,30" fill="#eb4b6e" fill-opacity=".08"/>
          <line x1="14" y1="10" x2="38" y2="34" stroke="#eb4b6e" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="38" y1="10" x2="14" y2="34" stroke="#eb4b6e" stroke-width="2.5" stroke-linecap="round"/>
          <polygon points="26,2 50,14 26,26 2,14"   fill="none" stroke="#eb4b6e" stroke-width="1.2" stroke-opacity=".5"/>
          <polygon points="2,14 26,26 26,42 2,30"   fill="none" stroke="#eb4b6e" stroke-width="1.2" stroke-opacity=".5"/>
          <polygon points="50,14 26,26 26,42 50,30" fill="none" stroke="#eb4b6e" stroke-width="1.2" stroke-opacity=".5"/>
        </svg>
      </div>
      <div class="mat-label">Erase</div>`;
    eraseChip.addEventListener('click', () => {
      materialManager.select('erase');
      onSelect?.('erase');
    });
    matBar.appendChild(eraseChip);
  },

  select(typeId, matBar) {
    activeToolId = typeId;
    document.querySelectorAll('.mat-chip').forEach(c => c.classList.remove('active'));
    const chip = document.getElementById(`mat-chip-${typeId}`);
    chip?.classList.add('active');
  },

  getActiveType() { return getShapeType(activeToolId); },
};
