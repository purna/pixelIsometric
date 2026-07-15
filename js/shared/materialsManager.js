/**
 * js/shared/materialsManager.js — shared material CRUD (no THREE.js deps).
 *
 * Exports the shared MaterialsManagerBase class.
 * - The 3D adapter (js/3d/materialsManager.js) extends this.
 * - The 2D system imports this directly.
 *
 * DATA STRUCTURE
 *  - Material: { id, name, color, opacity, metalness, roughness, textures: [Texture] }
 *  - Texture: { id, name, type: 'procedural', thumbnailData, ...dither_properties }
 */
class MaterialsManagerBase {
    constructor(app) {
        this.app = app;
        this.materials = [];
        this.selectedMaterial = null;
        this.container = document.getElementById('materials-content');
        this.materialsSectionContainer = document.getElementById('materials-section');
        this.init();
    }

    async init() {
        await this.loadDefaultMaterialsFromTileset();
        document.getElementById('create-material-btn')?.addEventListener('click', () => this.createNewMaterial());
        this.setupTextureBuilder();
    }

    setupTextureBuilder() {
        // This method will be used to wire up the texture builder panel
        // to add a texture to the currently selected material.
        document.getElementById('builder-save-texture')?.addEventListener('click', () => this.saveTextureFromBuilder());
        document.getElementById('builder-cancel')?.addEventListener('click', () => this.hideTextureBuilder());
    }

    // ── Material CRUD ────────────────────────────────────────────────────────
    createMaterial(name, color, opacity = 1.0) {
        const mat = { id: 'mat-' + Date.now() + Math.random(), name, color, opacity, metalness: 0.1, roughness: 0.6, textures: [], objectsUsing: [] };
        this.materials.push(mat);
        return mat;
    }

    getMaterial(id) { return this.materials.find(m => m.id === id || m.id === m.name === id); }
    getMaterialByName(name) { return this.materials.find(m => m.name === name); }

    selectMaterial(mat) {
        this.selectedMaterial = mat;
        this.render();
        this.showTextureBuilder(mat);
    }
    selectMaterialById(id) { const m = this.getMaterial(id); if (m) { this.selectMaterial(m); document.querySelector(`[data-material-id="${id}"]`)?.scrollIntoView(); } }

    deleteMaterial(mat) {
        if (mat.objectsUsing?.length && !confirm(`Deleting ${mat.name} removes it from ${mat.objectsUsing.length} objects. Continue?`)) return;
        const idx = this.materials.indexOf(mat);
        if (idx > -1) {
            mat.objectsUsing?.forEach(o => { if (o.userData.currentMaterialId === mat.id) delete o.userData.currentMaterialId; });
            this.materials.splice(idx, 1);
            if (this.selectedMaterial === mat) this.selectedMaterial = null;
            this.hideTextureBuilder();
            this.render();
        }
    }

    async loadDefaultMaterialsFromTileset() {
        try {
            const response = await fetch('assets/main_tileset.json');
            if (!response.ok) {
                console.error('Failed to load main_tileset.json. Status:', response.status);
                this.createFallbackDefaultMaterials();
                return;
            }
            const data = await response.json();
            const tiles = data.tile_definitions;

            for (const key in tiles) {
                const tile = tiles[key];
                if (tile.material) {
                    // Create a base material
                    const matName = tile.name.replace(/ Wall| Crest| Vein| Bone| Gate| Soil/g, '');
                    let material = this.getMaterialByName(matName);
                    if (!material) {
                        material = this.createMaterial(matName, parseInt(tile.material.baseColor.substring(1), 16));
                    }

                    // Create a texture from the tile definition
                    const m = tile.material;
                    const newTexture = {
                        id: `tex-tile-${key}-${Date.now()}`,
                        name: tile.name,
                        type: 'procedural',
                        colorA: m.baseColor, // Primary color
                        colorB: m.colorB, // Secondary color for split mode
                        splitPct: m.splitY, // Vertical split percentage (0-1)
                        tDitherMode: ['none', 'random', 'h', 'v', 'hv'][m.tMode] || 'none',
                        tInkMode: ['bright', 'color'][m.tInkMode] || 'bright',
                        tDitherSpace: m.tSpace,
                        tDitherThick: m.tThick,
                        tDitherBright: m.tBright,
                        tDitherAlpha: m.tAlpha,
                        bDitherMode: ['none', 'random', 'h', 'v', 'hv'][m.bMode] || 'none',
                        bInkMode: ['bright', 'color'][m.bInkMode] || 'bright',
                        bDitherSpace: m.bSpace,
                        bDitherThick: m.bThick,
                        bDitherBright: m.bBright,
                        bDitherAlpha: m.bAlpha,
                        showOutline: true,
                    };
                    this._generateProceduralTextureThumbnail(newTexture);
                    material.textures.push(newTexture);
                }
            }
        } catch (error) {
            console.error('Error loading or parsing main_tileset.json:', error);
            this.createFallbackDefaultMaterials();
        }
        this.render();
    }

    createFallbackDefaultMaterials() {
        // This can be your old createDefaultMaterials logic as a fallback.
        const defaults = [
            ['Plain Wood', 0x8B4513, 1.0, 'wood'],
            ['Smooth Metal', 0xaaaaaa, 1.0, 'metal'],
            ['Rough Plastic', 0xff5555, 1.0, 'plastic'],
        ];
        defaults.forEach(([n, c, o, t]) => this.createMaterial(n, c, o, t));
        console.log('Loaded fallback default materials.');
        this.render();
    }

    createNewMaterial() {
        const d = { name: 'New Material', color: 0xcccccc, opacity: 1.0 };
        this.showCreateMaterialDialog(d);
    }

    showCreateMaterialDialog(defaults) {
        const dialog = document.createElement('div');
        dialog.className = 'material-edit-dialog';
        dialog.innerHTML = `
            <div class="dialog-header">
                <h3>Create New Material</h3>
                <button class="close-dialog-btn">&times;</button>
            </div>
            <div class="dialog-content">
                <div class="property-group">
                    <label>Name:</label>
                    <input type="text" id="new-material-name" value="${defaults.name}">
                </div>
                <div class="property-group">
                    <label>Color:</label>
                    <input type="color" id="new-material-color" value="#${defaults.color.toString(16).padStart(6, '0')}">
                </div>
                <div class="property-group">
                    <label>Opacity: <span id="new-opacity-val">${defaults.opacity.toFixed(2)}</span></label>
                    <input type="range" id="new-material-opacity" min="0" max="1" step="0.01" value="${defaults.opacity}">
                </div>
            </div>
            <div class="dialog-actions">
                <button class="btn" id="cancel-create-mat">Cancel</button>
                <button class="btn primary" id="save-create-mat">Create</button>
            </div>
        `;
        dialog.querySelector('#new-material-opacity').addEventListener('input', e => {
            dialog.querySelector('#new-opacity-val').textContent = parseFloat(e.target.value).toFixed(2);
        });

        document.body.appendChild(dialog);
        dialog.querySelector('.close-dialog-btn').addEventListener('click', () => dialog.remove());
        dialog.querySelector('#cancel-create-mat').addEventListener('click', () => dialog.remove());
        dialog.querySelector('#save-create-mat').addEventListener('click', () => {
            let c = dialog.querySelector('#new-material-color').value;
            c = parseInt(c.substring(1), 16);
            this.createMaterial(
                dialog.querySelector('#new-material-name').value,
                c,
                parseFloat(dialog.querySelector('#new-material-opacity').value)
            );
            dialog.remove();
            this.render();
        });
    }

    editMaterial(material) { // This now edits the simple material properties
        const dialog = document.createElement('div');
        const is2T = material.type === 'twotone'; // This was missing
        dialog.className = 'material-edit-dialog';
        const colH = material.color !== undefined
            ? `#${material.color.toString(16).padStart(6, '0')}`
            : (material.colorA || '#fff');

        dialog.innerHTML = `
            <div class="dialog-header">
                <h3>Edit: ${material.name}</h3>
                <button class="close-dialog-btn">&times;</button>
            </div>
            <div style="padding: 0 15px;"><canvas id="edit-material-preview-canvas" width="260" height="100" style="width:100%; height:100px; border-radius: 4px; background: #111;"></canvas></div>
            <div class="dialog-content">
                <div class="property-group"><label>Color:</label><input type="color" id="edit-mat-color" value="${colH}"></div>
                ${is2T ? this._getEditDialogTwoToneSection(material) : ''}
                <div class="property-group"><label>Opacity: <span id="edit-op-v">${(material.opacity ?? 1).toFixed(2)}</span></label>
                    <input type="range" id="edit-mat-opacity" min="0" max="1" step="0.01" value="${material.opacity ?? 1}"></div>
            </div>
            <div class="dialog-actions">
                <button class="btn" id="cancel-edit-mat">Cancel</button>
                <button class="btn primary" id="save-edit-mat">Save</button>
            </div>
        `;
        dialog.querySelector('#edit-mat-opacity').addEventListener('input', e => {
            dialog.querySelector('#edit-op-v').textContent = parseFloat(e.target.value).toFixed(2);
        });

        // editable values for two-tone sliders
        const spinnerMap = {
            'edit-tSpace': 'edit-tSpaceV', 'edit-tThick': 'edit-tThickV', 'edit-tBright': 'edit-tBrightV', 'edit-tAlpha': 'edit-tAlphaV',
            'edit-bSpace': 'edit-bSpaceV', 'edit-bThick': 'edit-bThickV', 'edit-bBright': 'edit-bBrightV', 'edit-bAlpha': 'edit-bAlphaV'
        };
        Object.entries(spinnerMap).forEach(([ctrl, val]) => {
            const el = dialog.querySelector(`#${ctrl}`); // el is the input
            const vEl = dialog.querySelector(`#${val}`);
            if (el) {
                el.addEventListener('input', e => { 
                    if (vEl) vEl.textContent = e.target.value; 
                    if (is2T) updatePreview();
                });
            }
        });

        // Live preview for two-tone
        const previewCanvas = dialog.querySelector('#edit-material-preview-canvas');
        const updatePreview = () => {
            if (!is2T || !previewCanvas) return;
            const tempMat = { ...material }; // Create a copy to modify
            // Read all current values from the dialog
            tempMat.colorA = dialog.querySelector('#edit-mat-color').value;
            tempMat.colorB = dialog.querySelector('#edit-material-colorB')?.value;
            tempMat.splitPct = parseFloat(dialog.querySelector('#edit-material-split')?.value);
            tempMat.tDitherMode = dialog.querySelector('#edit-tMode')?.value;
            tempMat.tDitherSpace = parseInt(dialog.querySelector('#edit-tSpace')?.value);
            tempMat.tDitherThick = parseInt(dialog.querySelector('#edit-tThick')?.value);
            tempMat.tDitherBright = parseFloat(dialog.querySelector('#edit-tBright')?.value) / 100;
            tempMat.tDitherAlpha = parseFloat(dialog.querySelector('#edit-tAlpha')?.value) / 100;
            tempMat.bDitherMode = dialog.querySelector('#edit-bMode')?.value;
            tempMat.bDitherSpace = parseInt(dialog.querySelector('#edit-bSpace')?.value);
            tempMat.bDitherThick = parseInt(dialog.querySelector('#edit-bThick')?.value);
            tempMat.bDitherBright = parseFloat(dialog.querySelector('#edit-bBright')?.value) / 100;
            tempMat.bDitherAlpha = parseFloat(dialog.querySelector('#edit-bAlpha')?.value) / 100;
            
            this._generateProceduralTextureThumbnail(tempMat, 260, previewCanvas);
        };

        dialog.querySelectorAll('input, select').forEach(el => el.addEventListener('input', updatePreview));
        updatePreview(); // Initial render

        document.body.appendChild(dialog);
        dialog.querySelector('.close-dialog-btn').addEventListener('click', () => dialog.remove());
        dialog.querySelector('#cancel-edit-mat').addEventListener('click', () => dialog.remove());
        dialog.querySelector('#save-edit-mat').addEventListener('click', () => {
            let c = dialog.querySelector('#edit-mat-color').value;
            c = parseInt(c.substring(1), 16);
            material.color = c;
            material.opacity = parseFloat(dialog.querySelector('#edit-mat-opacity').value);

            this._onMaterialUpdated && this._onMaterialUpdated(material);
            dialog.remove();
            this.render();
        });
    }

    // ── Texture Builder ──────────────────────────────────────────────────────
    showTextureBuilder(material) {
        const container = document.getElementById('texture-builder-container');
        const header = document.getElementById('texture-builder-header');
        if (!container || !header) return;
        header.textContent = `Add Texture to "${material.name}"`;
        container.style.display = 'block';
    }

    hideTextureBuilder() {
        const container = document.getElementById('texture-builder-container');
        if (container) container.style.display = 'none';
    }

    saveTextureFromBuilder() {
        if (!this.selectedMaterial) {
            alert("Please select a material first!");
            return;
        }

        const name = document.getElementById('texture-name-input').value || `Texture ${Date.now()}`;
        const newTexture = {
            id: `tex-${Date.now()}`,
            name: name,
            type: 'procedural',
            colorA: document.getElementById('baseColor').value,
            colorB: document.getElementById('colB').value,
            splitPct: (parseFloat(document.getElementById('split').value) + 50) / 100,
            tDitherMode: document.getElementById('tMode').value,
            tDitherSpace: parseInt(document.getElementById('tSpace').value),
            tDitherThick: parseFloat(document.getElementById('tThick').value),
            tDitherBright: parseFloat(document.getElementById('tBright').value) / 100,
            tDitherAlpha: parseFloat(document.getElementById('tAlpha').value) / 100,
            tInkMode: document.getElementById('tInkMode').value,
            bDitherMode: document.getElementById('bMode').value,
            bDitherSpace: parseInt(document.getElementById('bSpace').value),
            bDitherThick: parseFloat(document.getElementById('bThick').value),
            bDitherBright: parseFloat(document.getElementById('bBright').value) / 100,
            bDitherAlpha: parseFloat(document.getElementById('bAlpha').value) / 100,
            bInkMode: document.getElementById('bInkMode').value,
            showOutline: true,
        };

        this._generateProceduralTextureThumbnail(newTexture);
        this.selectedMaterial.textures.push(newTexture);
        this.render();
    }

    _onMaterialUpdated(mat) { /* hook — overridden by 3D adapter */ }

    _generateProceduralTextureThumbnail(texture, size = 64, targetCanvas = null) {
        const canvas = targetCanvas || document.createElement('canvas');
        canvas.width = size;
        canvas.height = targetCanvas ? canvas.height : size; // Use existing height if targetCanvas is provided
        const ctx = canvas.getContext('2d');
        if (!ctx) return; // Return if no context

        // Base color
        ctx.fillStyle = texture.colorA;
        ctx.fillRect(0, 0, size, size);

        // Split color
        const splitY = size * texture.splitPct;
        ctx.fillStyle = texture.colorB || '#000000';
        ctx.fillRect(0, splitY, size, size - splitY);

        // Dithering logic (simplified for thumbnail)
        const drawDither = (isTop) => {
            const mode = isTop ? texture.tDitherMode : texture.bDitherMode;
            if (mode === 'none') return;

            const space = isTop ? texture.tDitherSpace : texture.bDitherSpace;
            const thick = isTop ? texture.tDitherThick : texture.bDitherThick;
            const alpha = isTop ? texture.tDitherAlpha : texture.bDitherAlpha;
            const bright = isTop ? texture.tDitherBright : texture.bDitherBright;

            ctx.lineWidth = thick;
            ctx.globalAlpha = alpha;

            // Determine ink color
            let inkColor = bright > 0 ? 'rgba(255,255,255,1)' : 'rgba(0,0,0,1)';
            // A more sophisticated color calculation could be added here if needed

            ctx.strokeStyle = inkColor;
            ctx.beginPath();

            const startY = isTop ? 0 : splitY;
            const endY = isTop ? splitY : size;

            for (let i = 0; i < size; i += space) {
                if (mode === 'h' || mode === 'hv') {
                    ctx.moveTo(0, startY + i);
                    ctx.lineTo(size, startY + i);
                }
                if (mode === 'v' || mode === 'hv') {
                    ctx.moveTo(i, startY);
                    ctx.lineTo(i, endY);
                }
            }
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        };

        drawDither(true); // Top dither
        drawDither(false); // Bottom dither
        if (!targetCanvas) {
            texture.thumbnailData = canvas.toDataURL();
        }
    }

    _getEditDialogTwoToneSection(material) {
        if (material.type !== 'twotone') return '';
        return `
            <div class="property-group"><label>Color B:</label><input type="color" id="edit-material-colorB" value="${material.colorB || '#ffffff'}"></div>
            <div class="property-group"><label>Split %: <span id="edit-split-v">${((material.splitPct || .5) * 100).toFixed(0)}%</span></label>
                <input type="range" id="edit-material-split" min="0" max="1" step="0.01" value="${material.splitPct || .5}"></div>

            <div class="property-group"><label><strong>Top Dither</strong></label></div>
            <div class="property-group">
              <label>Mode:</label>
              <select id="edit-tMode" style="width:100%">
                <option value="none"  ${(material.tDitherMode || 'none') === 'none' ? 'selected' : ''}>None</option>
                <option value="random" ${material.tDitherMode === 'random' ? 'selected' : ''}>Random</option>
                <option value="h"      ${material.tDitherMode === 'h' ? 'selected' : ''}>H-Lines</option>
                <option value="v"      ${material.tDitherMode === 'v' ? 'selected' : ''}>V-Lines</option>
                <option value="hv"     ${material.tDitherMode === 'hv' ? 'selected' : ''}>HV</option>
              </select>
            </div>
            <div class="property-group"><label>Space</label><input type="range" id="edit-tSpace" min="2" max="16" value="${material.tDitherSpace || 6}"     style="flex:1"><span id="edit-tSpaceV">${material.tDitherSpace || 6}</span></div>
            <div class="property-group"><label>Thick</label><input type="range" id="edit-tThick" min="1" max="8"   value="${material.tDitherThick || 1}"     style="flex:1"><span id="edit-tThickV">${material.tDitherThick || 1}</span></div>
            <div class="property-group"><label>Bright</label><input type="range" id="edit-tBright" min="-100" max="100" value="${Math.round((material.tDitherBright || 1) * 100)}" style="flex:1"><span id="edit-tBrightV">${Math.round((material.tDitherBright || 1) * 100)}</span></div>
            <div class="property-group"><label>Alpha</label><input type="range" id="edit-tAlpha" min="0" max="100" value="${Math.round((material.tDitherAlpha || .5) * 100)}" style="flex:1"><span id="edit-tAlphaV">${Math.round((material.tDitherAlpha || .5) * 100)}</span></div>

            <div class="property-group"><label><strong>Bottom Dither</strong></label></div>
            <div class="property-group">
              <label>Mode:</label>
              <select id="edit-bMode" style="width:100%">
                <option value="none"  ${(material.bDitherMode || 'none') === 'none' ? 'selected' : ''}>None</option>
              </select>
            </div>
        `;
    }

    // ── Render ──────────────────────────────────────────────────────────────
    render() {
        if (!this.container) return;
        this.container.innerHTML = '';
        this.materials.forEach(mat => {
            const el = document.createElement('div'); el.className = 'material-item-full';
            el.dataset.materialId = mat.id;
            if (this.selectedMaterial === mat) el.classList.add('selected');
            const cv = `#${mat.color.toString(16).padStart(6, '0')}`;
            const usageCnt = (mat.objectsUsing || []).length;

            // Generate texture previews
            let texturesHTML = '<div class="material-texture-list">';
            const selectedObj = this._getSelectedObjects()?.[0];
            const activeTextureId = selectedObj?.userData?.currentTextureId;

            mat.textures.forEach(tex => {
                const isActive = mat.id === selectedObj?.userData?.currentMaterialId && tex.id === activeTextureId;
                texturesHTML += `
                    <div class="texture-item ${isActive ? 'active' : ''}" data-texture-id="${tex.id}" title="Apply texture: ${tex.name}">
                        <div class="texture-preview" style="background-image: url(${tex.thumbnailData});"></div>
                        <div class="texture-name">${tex.name}</div>
                    </div>
                `;
            });
            texturesHTML += '</div>';

            el.innerHTML = `
                <div class="material-preview-full" style="background:${cv}" title="Base Color. Used by: ${usageCnt} objects"></div>
                <div class="material-info-full">
                    <input type="text" class="material-name-full" value="${mat.name}">
                    <div class="material-properties-full">
                        O: ${mat.opacity.toFixed(2)} | M: ${mat.metalness.toFixed(2)} | R: ${mat.roughness.toFixed(2)}
                    </div>
                    ${texturesHTML}
                </div>
                <div class="material-actions-full">
                    <button class="btn edit-material-btn"><i class="fas fa-edit"></i></button>
                    <button class="btn delete-material-btn"><i class="fas fa-trash"></i></button>
                </div>`;
            el.addEventListener('click', e => {
                if (e.target.closest('.btn, .material-name-full')) return;
                this.selectMaterial(mat);
            });
            el.querySelector('.edit-material-btn')?.addEventListener('click', e => { e.stopPropagation(); this.editMaterial(mat); });
            el.querySelector('.delete-material-btn')?.addEventListener('click', e => { e.stopPropagation(); this.deleteMaterial(mat); });

            // Add click handlers for applying individual textures
            el.querySelectorAll('.texture-item').forEach(texItem => {
                texItem.addEventListener('click', e => {
                    e.stopPropagation();
                    const textureId = texItem.dataset.textureId;
                    this._applyToSelected && this._applyToSelected(mat, this._getSelectedObjects(), textureId);
                });
            });
            this.container.appendChild(el);
        });
    }

    applyMaterialToLayer(layerId, mat) {
        const m = typeof mat === 'string' ? this.getMaterial(mat) : mat; if (!m) return;
        window.layerManager?.getObjectsInLayer(layerId)?.forEach(o => this._applyToObj(o, m));
    }

    _applyToObj(obj, mat) { } // base no-op; 3D adapter overrides

    _getSelectedObjects() {
        const selObj = (typeof this._selectedObjectsGetter === 'function') ? this._selectedObjectsGetter() : [];
        return selObj;
    }

    applyMaterialToSelected(mat) {
        if (!mat) return;
        this._applyToSelected?.(mat, this._getSelectedObjects?.());
    }

    applyMaterialToObject(obj, mat) {
        if (!mat || !obj) return;
        this._applyToObj?.(obj, mat);
    }

    setSelectedObjectsGetter(fn) { this._selectedObjectsGetter = fn; }
}

export { MaterialsManagerBase };
export default MaterialsManagerBase;
