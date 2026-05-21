/**
 * js/shared/materialsManager.js — shared material CRUD (no THREE.js deps).
 *
 * Exports the shared MaterialsManagerBase class.
 * The 3D adapter (js/3d/materialsManager.js) extends this class and
 * overrides `applyMaterialToObject` to call _applyMaterialToMesh.
 * The 2D system imports this directly.
 *
 * MATERIAL TYPES
 *  Standard   { id, name, color:hexNumber, opacity, textureType, objectsUsing[] }
 *  Pixel      { isPixelTexture: true, textureType, objectsUsing[] }
 *  Two-tone   { type:'twotone', colorA, colorB, splitPct, tDitherTop/bDitherBottom,
 *                showOutline, imageData, thumbnailData, objectsUsing[] }
 */
class MaterialsManagerBase {
    constructor(app) {
        this.app                = app;
        this.materials          = [];
        this.selectedMaterial   = null;
        this.container          = document.getElementById('materials-content');
        this.materialsSectionContainer = document.getElementById('materials-section');
        this.init();
    }

    init() {
        this.createDefaultMaterials();
        document.getElementById('create-material-btn')?.addEventListener('click', () => this.createNewMaterial());
        this.setupTwoToneBuilder();
    }

    setupTwoToneBuilder() {
        document.getElementById('builder-colA')?.addEventListener('input', (e) => {
            document.getElementById('builder-swA').style.background = e.target.value;
        });
        document.getElementById('builder-colB')?.addEventListener('input', (e) => {
            document.getElementById('builder-swB').style.background = e.target.value;
        });
    }

    // ── Material CRUD ────────────────────────────────────────────────────────
    addTwoToneMaterial(material) { if (!material.objectsUsing) material.objectsUsing = []; this.materials.push(material); this.render(); }

    createMaterial(name, color, opacity = 1.0, textureType = null) {
        const mat = { id: 'mat-' + Date.now() + Math.random(), name, color, opacity, textureType, objectsUsing: [], isPixelTexture: textureType !== null };
        this.materials.push(mat);
        return mat;
    }

    getMaterial(id) { return this.materials.find(m => m.id === id || m.id === m.name === id); }
    getMaterialByName(name) { return this.materials.find(m => m.name === name); }

    selectMaterial(mat) { this.selectedMaterial = mat; this.render(); }
    selectMaterialById(id) { const m = this.getMaterial(id); if (m) { this.selectMaterial(m); document.querySelector(`[data-material-id="${id}"]`)?.scrollIntoView(); } }

    deleteMaterial(mat) {
        if (mat.objectsUsing?.length && !confirm(`Deleting ${mat.name} removes it from ${mat.objectsUsing.length} objects. Continue?`)) return;
        const idx = this.materials.indexOf(mat);
        if (idx > -1) {
            mat.objectsUsing?.forEach(o => { if (o.userData.currentMaterialId === mat.id) delete o.userData.currentMaterialId; });
            this.materials.splice(idx, 1);
            if (this.selectedMaterial === mat) this.selectedMaterial = null;
            this.render();
        }
    }

    createDefaultMaterials() {
        const defaults = [
            ['Plain Wood',      0x8B4513, 1.0, 'wood'],
            ['Smooth Metal',    0xaaaaaa, 1.0, 'metal'],
            ['Rough Plastic',   0xff5555, 1.0, 'plastic'],
            ['Matte Stone',     0x808080, 1.0, 'stone'],
            ['Gold',            0xffd700, 1.0, 'metal'],
            ['Grass Pixel',     0x7CFC00, 1.0, 'grass'],
            ['Dirt Pixel',      0x8B4513, 1.0, 'dirt'],
            ['Brick Pixel',     0xD32F2F, 1.0, 'brick'],
            ['Cobblestone',     0x78909C, 1.0, 'cobblestone'],
            ['Sand Pixel',      0xFFD54F, 1.0, 'sand'],
            ['Water Pixel',     0x2196F3, 0.7, 'water'],
        ];
        defaults.forEach(([n, c, o, t]) => this.createMaterial(n, c, o, t));
        this.render();
    }

    createNewMaterial() {
        const d = { name: 'New Material', color: 0x00ff41, opacity: 1.0, textureType: null };
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
                    <input type="color" id="new-material-color" value="#${defaults.color.toString(16).padStart(6,'0')}">
                </div>
                <div class="property-group">
                    <label>Opacity: <span id="new-opacity-val">${defaults.opacity.toFixed(2)}</span></label>
                    <input type="range" id="new-material-opacity" min="0" max="1" step="0.01" value="${defaults.opacity}">
                </div>
                <div class="property-group">
                    <label>Texture Type:</label>
                    <select id="new-material-texture" style="width:100%">
                        <option value="">None (Standard PBR)</option>
                        <option value="grass">Grass</option><option value="dirt">Dirt</option>
                        <option value="stone">Stone</option><option value="wood">Wood</option>
                        <option value="brick">Brick</option><option value="sand">Sand</option>
                        <option value="water">Water</option><option value="cobblestone">Cobblestone</option>
                        <option value="roof">Roof</option><option value="snow">Snow</option>
                    </select>
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
                parseFloat(dialog.querySelector('#new-material-opacity').value),
                dialog.querySelector('#new-material-texture').value || null
            );
            dialog.remove();
            this.render();
        });
    }

    // ── Two-tone edit dialog ─────────────────────────────────────────────────
    _getEditDialogTwoToneSection(material) {
        if (material.type !== 'twotone') return '';
        return `
            <div class="property-group"><label>Color B:</label><input type="color" id="edit-material-colorB" value="${material.colorB||'#ffffff'}"></div>
            <div class="property-group"><label>Split %: <span id="edit-split-v">${((material.splitPct||.5)*100).toFixed(0)}%</span></label>
                <input type="range" id="edit-material-split" min="0" max="1" step="0.01" value="${material.splitPct||.5}"></div>

            <div class="property-group"><label><strong>Top Dither</strong></label></div>
            <div class="property-group">
              <label>Mode:</label>
              <select id="edit-tMode" style="width:100%">
                <option value="none"  ${(material.tDitherMode||'none')==='none'  ?'selected':''}>None</option>
                <option value="random" ${material.tDitherMode==='random'         ?'selected':''}>Random</option>
                <option value="h"      ${material.tDitherMode==='h'              ?'selected':''}>H-Lines</option>
                <option value="v"      ${material.tDitherMode==='v'              ?'selected':''}>V-Lines</option>
                <option value="hv"     ${material.tDitherMode==='hv'             ?'selected':''}>HV</option>
              </select>
            </div>
            <div class="property-group"><label>Space</label><input type="range" id="edit-tSpace" min="2" max="16" value="${material.tDitherSpace||6}"     style="flex:1"><span id="edit-tSpaceV">${material.tDitherSpace||6}</span></div>
            <div class="property-group"><label>Thick</label><input type="range" id="edit-tThick" min="1" max="8"   value="${material.tDitherThick||1}"     style="flex:1"><span id="edit-tThickV">${material.tDitherThick||1}</span></div>
            <div class="property-group"><label>Bright</label><input type="range" id="edit-tBright" min="-100" max="100" value="${Math.round((material.tDitherBright||1)*100)}" style="flex:1"><span id="edit-tBrightV">${Math.round((material.tDitherBright||1)*100)}</span></div>
            <div class="property-group"><label>Alpha</label><input type="range" id="edit-tAlpha" min="0" max="100" value="${Math.round((material.tDitherAlpha||.5)*100)}" style="flex:1"><span id="edit-tAlphaV">${Math.round((material.tDitherAlpha||.5)*100)}</span></div>

            <div class="property-group"><label><strong>Bottom Dither</strong></label></div>
            <div class="property-group">
              <label>Mode:</label>
              <select id="edit-bMode" style="width:100%">
                <option value="none"  ${(material.bDitherMode||'none')==='none'  ?'selected':''}>None</option>
                <option value="random" ${material.bDitherMode==='random'         ?'selected':''}>Random</option>
                <option value="h"      ${material.bDitherMode==='h'              ?'selected':''}>H-Lines</option>
                <option value="v"      ${material.bDitherMode==='v'              ?'selected':''}>V-Lines</option>
                <option value="hv"     ${material.bDitherMode==='hv'             ?'selected':''}>HV</option>
              </select>
            </div>
            <div class="property-group"><label>Space</label><input type="range" id="edit-bSpace" min="2" max="16" value="${material.bDitherSpace||4}"     style="flex:1"><span id="edit-bSpaceV">${material.bDitherSpace||4}</span></div>
            <div class="property-group"><label>Thick</label><input type="range" id="edit-bThick" min="1" max="8"   value="${material.bDitherThick||1}"     style="flex:1"><span id="edit-bThickV">${material.bDitherThick||1}</span></div>
            <div class="property-group"><label>Bright</label><input type="range" id="edit-bBright" min="-100" max="100" value="${Math.round((material.bDitherBright||-1)*100)}" style="flex:1"><span id="edit-bBrightV">${Math.round((material.bDitherBright||-1)*100)}</span></div>
            <div class="property-group"><label>Alpha</label><input type="range" id="edit-bAlpha" min="0" max="100" value="${Math.round((material.bDitherAlpha||.7)*100)}" style="flex:1"><span id="edit-bAlphaV">${Math.round((material.bDitherAlpha||.7)*100)}</span></div>

            <div class="property-group"><label><input type="checkbox" id="edit-showOutline" ${material.showOutline?'checked':''}> Show Outline</label></div>
        `;
    }

    editMaterial(material) {
        const dialog = document.createElement('div');
        dialog.className = 'material-edit-dialog';
        const is2T = material.type === 'twotone';
        const colH = material.color !== undefined
            ? `#${material.color.toString(16).padStart(6,'0')}`
            : (material.colorA || '#fff');

        dialog.innerHTML = `
            <div class="dialog-header">
                <h3>Edit: ${material.name}</h3>
                <button class="close-dialog-btn">&times;</button>
            </div>
            <div class="dialog-content">
                <div class="property-group"><label>Color:</label><input type="color" id="edit-mat-color" value="${colH}"></div>
                ${is2T ? this._getEditDialogTwoToneSection(material) : ''}
                <div class="property-group"><label>Opacity: <span id="edit-op-v">${(material.opacity??1).toFixed(2)}</span></label>
                    <input type="range" id="edit-mat-opacity" min="0" max="1" step="0.01" value="${material.opacity??1}"></div>
                <div class="property-group">
                  <label>Texture Type:</label>
                  <select id="edit-mat-texture" style="width:100%">
                    <option value="" ${!material.textureType?'selected':''}>None</option>
                    <option value="grass" ${material.textureType==='grass'?'selected':''}>Grass</option>
                    <option value="dirt" ${material.textureType==='dirt'?'selected':''}>Dirt</option>
                    <option value="stone" ${material.textureType==='stone'?'selected':''}>Stone</option>
                    <option value="wood" ${material.textureType==='wood'?'selected':''}>Wood</option>
                    <option value="brick" ${material.textureType==='brick'?'selected':''}>Brick</option>
                    <option value="sand" ${material.textureType==='sand'?'selected':''}>Sand</option>
                    <option value="water" ${material.textureType==='water'?'selected':''}>Water</option>
                    <option value="cobblestone" ${material.textureType==='cobblestone'?'selected':''}>Cobblestone</option>
                    <option value="roof" ${material.textureType==='roof'?'selected':''}>Roof</option>
                    <option value="snow" ${material.textureType==='snow'?'selected':''}>Snow</option>
                  </select>
                </div>
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
        const spinnerMap = { 'edit-tSpace': 'edit-tSpaceV', 'edit-tThick': 'edit-tThickV', 'edit-tBright': 'edit-tBrightV', 'edit-tAlpha': 'edit-tAlphaV',
                             'edit-bSpace': 'edit-bSpaceV', 'edit-bThick': 'edit-bThickV', 'edit-bBright': 'edit-bBrightV', 'edit-bAlpha': 'edit-bAlphaV' };
        Object.entries(spinnerMap).forEach(([ctrl, val]) => {
            const el = dialog.querySelector(`#${ctrl}`);
            const vEl= dialog.querySelector(`#${val}`);
            el?.addEventListener('input', e => { vEl && (vEl.textContent = e.target.value); });
        });

        document.body.appendChild(dialog);
        dialog.querySelector('.close-dialog-btn').addEventListener('click', () => dialog.remove());
        dialog.querySelector('#cancel-edit-mat').addEventListener('click', () => dialog.remove());
        dialog.querySelector('#save-edit-mat').addEventListener('click', () => {
            let c = dialog.querySelector('#edit-mat-color').value;
            c = parseInt(c.substring(1), 16);
            material.color = c;
            material.opacity = parseFloat(dialog.querySelector('#edit-mat-opacity').value);
            material.textureType = dialog.querySelector('#edit-mat-texture').value || null;
            material.isPixelTexture = !!material.textureType;

            if (is2T) {
                material.colorB       = dialog.querySelector('#edit-material-colorB')?.value;
                material.splitPct     = parseFloat(dialog.querySelector('#edit-material-split')?.value ?? 0.5);
                material.tDitherMode  =  dialog.querySelector('#edit-tMode')?.value     ?? 'none';
                material.tDitherSpace = parseInt(dialog.querySelector('#edit-tSpace')?.value  ?? 6);
                material.tDitherThick = parseInt(dialog.querySelector('#edit-tThick')?.value  ?? 1);
                material.tDitherBright= parseFloat(dialog.querySelector('#edit-tBright')?.value ?? 100) / 100;
                material.tDitherAlpha = parseFloat(dialog.querySelector('#edit-tAlpha')?.value  ?? 50) / 100;
                material.bDitherMode  =  dialog.querySelector('#edit-bMode')?.value     ?? 'none';
                material.bDitherSpace = parseInt(dialog.querySelector('#edit-bSpace')?.value  ?? 4);
                material.bDitherThick = parseInt(dialog.querySelector('#edit-bThick')?.value  ?? 1);
                material.bDitherBright= parseFloat(dialog.querySelector('#edit-bBright')?.value?? -100) / 100;
                material.bDitherAlpha = parseFloat(dialog.querySelector('#edit-bAlpha')?.value  ?? 70) / 100;
                material.showOutline  = dialog.querySelector('#edit-showOutline')?.checked ?? true;
            }
            this._onMaterialUpdated && this._onMaterialUpdated(material);
            dialog.remove();
            this.render();
        });
    }

    _onMaterialUpdated(mat) { /* hook — overridden by 3D adapter */ }

    _getSelectedObjects() { return this._selectedObjectsGetter ? this._selectedObjectsGetter() : []; }

    setSelectedObjectsGetter(fn) { this._selectedObjectsGetter = fn; }

    // ── Render ──────────────────────────────────────────────────────────────
    render() {
        if (!this.container) return;
        this.container.innerHTML = '';
        this.materials.forEach(mat => {
            const el = document.createElement('div');
            el.className = 'material-item';
            el.dataset.materialId = mat.id;
            if (this.selectedMaterial === mat) el.classList.add('selected');
            const cv = mat.color !== undefined
                ? `#${mat.color.toString(16).padStart(6,'0')}`
                : (mat.colorA || '#fff');
            const usageCnt = (mat.objectsUsing || []).length;
            el.innerHTML = `
                <div class="material-preview" style="background:${cv}" title="Used by: ${usageCnt} objects"></div>
                <div class="material-info">
                    <input type="text" class="material-name" value="${mat.name}">
                    <div class="material-properties">${mat.opacity!==undefined?`O:${mat.opacity.toFixed(2)}`:''}${mat.textureType?` T:${mat.textureType}`:''}</div>
                </div>
                <div class="material-actions">
                    <button class="btn apply-material-btn" title="Apply"><i class="fas fa-check"></i></button>
                    <button class="btn edit-material-btn" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="btn delete-material-btn" title="Delete"><i class="fas fa-trash"></i></button>
                </div>`;
            el.addEventListener('click', e => {
                if (e.target.closest('.btn, .material-name')) return;
                this.selectMaterial(mat);
            });
            el.querySelector('.apply-material-btn').addEventListener('click', e => {
                e.stopPropagation(); this._applyToSelected && this._applyToSelected(mat, this._getSelectedObjects()); });
            el.querySelector('.edit-material-btn')?.addEventListener('click', e => { e.stopPropagation(); this.editMaterial(mat); });
            el.querySelector('.delete-material-btn')?.addEventListener('click', e => { e.stopPropagation(); this.deleteMaterial(mat); });
            this.container.appendChild(el);
        });
    }

    renderMaterialsSection() {
        const mc = this.materialsSectionContainer?.querySelector('.panel-content');
        if (!mc) return;
        mc.innerHTML = '';
        this.materials.forEach(mat => {
            const el = document.createElement('div'); el.className = 'material-item-full';
            el.dataset.materialId = mat.id;
            if (this.selectedMaterial === mat) el.classList.add('selected');
            const cv = mat.color !== undefined ? `#${mat.color.toString(16).padStart(6,'0')}` : (mat.colorA || '#fff');
            const usageCnt = (mat.objectsUsing || []).length;
            el.innerHTML = `
                <div class="material-preview-full" style="background:${cv}" title="Used by: ${usageCnt}"></div>
                <div class="material-info-full">
                    <input type="text" class="material-name-full" value="${mat.name}">
                    <div class="material-properties-full">${mat.opacity!==undefined?`O:${mat.opacity.toFixed(2)}`:''}${mat.textureType?`T:${mat.textureType}`:''}</div>
                </div>
                <div class="material-actions-full">
                    <button class="btn apply-material-btn"><i class="fas fa-check"></i></button>
                    <button class="btn edit-material-btn"><i class="fas fa-edit"></i></button>
                    <button class="btn delete-material-btn"><i class="fas fa-trash"></i></button>
                </div>`;
            el.addEventListener('click', e => {
                if (e.target.closest('.btn, .material-name-full')) return;
                this.selectMaterial(mat);
            });
            el.querySelector('.apply-material-btn').addEventListener('click', e => {
                e.stopPropagation(); this._applyToSelected && this._applyToSelected(mat, this._getSelectedObjects()); });
            el.querySelector('.edit-material-btn')?.addEventListener('click', e => { e.stopPropagation(); this.editMaterial(mat); });
            el.querySelector('.delete-material-btn')?.addEventListener('click', e => { e.stopPropagation(); this.deleteMaterial(mat); });
            mc.appendChild(el);
        });
    }

    applyMaterialToLayer(layerId, mat) {
        const m = typeof mat === 'string' ? this.getMaterial(mat) : mat; if (!m) return;
        window.layerManager?.getObjectsInLayer(layerId)?.forEach(o => this._applyToObj(o, m));
    }

    _applyToObj(obj, mat) {} // base no-op; 3D adapter overrides

    // hook for 2D/3D consumers
    _applyToSelected = null; // set by consumer to (mat, selectedObjectsArray) => void
}

export { MaterialsManagerBase };
export default MaterialsManagerBase;
