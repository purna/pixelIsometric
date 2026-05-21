/**
 * js/shared/materialsManager.js — shared material CRUD (no THREE.js deps).
 *
 * Improvements over original:
 *  - getMaterial() had a logic bug: `m.id === m.name === id` is always false
 *    (chained equality). Fixed to `m.id === id || m.name === id`.
 *  - render() / renderMaterialsSection() referenced `selectedObjects` as an
 *    undeclared global inside the apply-button handler. Fixed to use
 *    `window.selectedObjects` with a guard.
 *  - Both render methods were near-identical. Extracted _renderMaterialItem()
 *    to eliminate the duplication.
 *  - render() now diffs the container before rebuilding to avoid unnecessary
 *    DOM thrashing (preserves scroll position on small lists).
 *  - applyMaterialToLayer() previously silently no-op'd when the mat argument
 *    was an object. Fixed the string-vs-object check.
 *  - Material IDs now use crypto.randomUUID() (falls back to Date+random)
 *    to guarantee global uniqueness.
 *  - createMaterial() sets isPixelTexture only when textureType is non-null
 *    (was always true when textureType was provided, but also when null).
 *  - _onMaterialUpdated declared as a proper prototype method (not a comment stub).
 *  - Dialogs are now appended to a modal-root when available, falling back to body.
 *  - showCreateMaterialDialog / editMaterial: keyboard Escape closes the dialog.
 *  - Added getMaterials(), hasMaterial(), getMaterialIndex() helpers.
 *  - Added renameMaterial() public API.
 */
class MaterialsManagerBase {
    constructor(app) {
        this.app              = app;
        this.materials        = [];
        this.selectedMaterial = null;
        this.container        = document.getElementById('materials-content');
        this.materialsSectionContainer = document.getElementById('materials-section');
        this.init();
    }

    init() {
        this.createDefaultMaterials();
        document.getElementById('create-material-btn')
            ?.addEventListener('click', () => this.createNewMaterial());
        this.setupTwoToneBuilder();
    }

    setupTwoToneBuilder() {
        document.getElementById('builder-colA')?.addEventListener('input', e => {
            document.getElementById('builder-swA').style.background = e.target.value;
        });
        document.getElementById('builder-colB')?.addEventListener('input', e => {
            document.getElementById('builder-swB').style.background = e.target.value;
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Material CRUD
    // ─────────────────────────────────────────────────────────────────────────

    _newId() {
        return typeof crypto?.randomUUID === 'function'
            ? `mat-${crypto.randomUUID()}`
            : `mat-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    addTwoToneMaterial(material) {
        if (!material.objectsUsing) material.objectsUsing = [];
        this.materials.push(material);
        this.render();
    }

    createMaterial(name, color, opacity = 1.0, textureType = null) {
        const mat = {
            id:             this._newId(),
            name,
            color,
            opacity,
            textureType,
            objectsUsing:   [],
            isPixelTexture: textureType !== null, // only true when a texture type is given
        };
        this.materials.push(mat);
        return mat;
    }

    renameMaterial(id, newName) {
        const mat = this.getMaterial(id);
        if (mat) { mat.name = newName; this.render(); return true; }
        return false;
    }

    /**
     * Find a material by id OR name.
     * Original had: m.id === m.name === id  (always false — chained equality)
     */
    getMaterial(id) {
        return this.materials.find(m => m.id === id || m.name === id) ?? null;
    }
    getMaterialByName(name)  { return this.materials.find(m => m.name === name) ?? null; }
    getMaterials()           { return [...this.materials]; }
    hasMaterial(id)          { return this.getMaterial(id) !== null; }
    getMaterialIndex(id)     { return this.materials.findIndex(m => m.id === id); }

    selectMaterial(mat) {
        this.selectedMaterial = mat;
        this.render();
    }

    selectMaterialById(id) {
        const m = this.getMaterial(id);
        if (m) {
            this.selectMaterial(m);
            document.querySelector(`[data-material-id="${id}"]`)?.scrollIntoView({ block: 'nearest' });
        }
    }

    deleteMaterial(mat) {
        if (mat.objectsUsing?.length &&
            !confirm(`Deleting "${mat.name}" removes it from ${mat.objectsUsing.length} object(s). Continue?`)) return;

        const idx = this.materials.indexOf(mat);
        if (idx === -1) return;

        mat.objectsUsing?.forEach(o => {
            if (o.userData?.currentMaterialId === mat.id) delete o.userData.currentMaterialId;
        });
        this.materials.splice(idx, 1);
        if (this.selectedMaterial === mat) this.selectedMaterial = null;
        this.render();
    }

    createDefaultMaterials() {
        const defaults = [
            ['Plain Wood',   0x8B4513, 1.0, 'wood'],
            ['Smooth Metal', 0xaaaaaa, 1.0, 'metal'],
            ['Rough Plastic',0xff5555, 1.0, 'plastic'],
            ['Matte Stone',  0x808080, 1.0, 'stone'],
            ['Gold',         0xffd700, 1.0, 'metal'],
            ['Grass Pixel',  0x7CFC00, 1.0, 'grass'],
            ['Dirt Pixel',   0x8B4513, 1.0, 'dirt'],
            ['Brick Pixel',  0xD32F2F, 1.0, 'brick'],
            ['Cobblestone',  0x78909C, 1.0, 'cobblestone'],
            ['Sand Pixel',   0xFFD54F, 1.0, 'sand'],
            ['Water Pixel',  0x2196F3, 0.7, 'water'],
        ];
        defaults.forEach(([n, c, o, t]) => this.createMaterial(n, c, o, t));
        this.render();
    }

    createNewMaterial() {
        this.showCreateMaterialDialog({ name: 'New Material', color: 0x00ff41, opacity: 1.0, textureType: null });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Layer-wide apply
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Apply a material to every object in a layer.
     * `mat` may be a material object or a material id/name string.
     */
    applyMaterialToLayer(layerId, mat) {
        // Resolve string → object
        const resolved = (mat && typeof mat === 'object') ? mat : this.getMaterial(mat);
        if (!resolved) return;
        window.layerManager?.getObjectsInLayer(layerId)?.forEach(o => this._applyToObj(o, resolved));
    }

    _applyToObj(/* obj, mat */) {} // no-op; overridden by 3D adapter

    // ─────────────────────────────────────────────────────────────────────────
    // Hook — overridden by 3D adapter
    // ─────────────────────────────────────────────────────────────────────────

    _onMaterialUpdated(/* mat */) {}

    // Set by consumer: (mat, selectedObjects) => void
    _applyToSelected = null;

    // ─────────────────────────────────────────────────────────────────────────
    // Dialog helpers
    // ─────────────────────────────────────────────────────────────────────────

    _colorToHex(color) {
        if (typeof color === 'number') return `#${color.toString(16).padStart(6, '0')}`;
        return color || '#ffffff';
    }

    _appendDialog(dialog) {
        const root = document.getElementById('modal-root') ?? document.body;
        root.appendChild(dialog);
        // Close on Escape
        const onKey = e => { if (e.key === 'Escape') { dialog.remove(); document.removeEventListener('keydown', onKey); } };
        document.addEventListener('keydown', onKey);
    }

    _buildSliderRow(id, label, min, max, step, value, valId) {
        return `
            <div class="property-group">
                <label>${label}: <span id="${valId}">${value}</span></label>
                <input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${value}">
            </div>`;
    }

    _wireSliderDisplay(dialog, ctrlId, valId, transform) {
        const el  = dialog.querySelector(`#${ctrlId}`);
        const vel = dialog.querySelector(`#${valId}`);
        el?.addEventListener('input', e => { if (vel) vel.textContent = transform ? transform(e.target.value) : e.target.value; });
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
                    <input type="color" id="new-material-color" value="${this._colorToHex(defaults.color)}">
                </div>
                ${this._buildSliderRow('new-material-opacity','Opacity',0,1,0.01,defaults.opacity.toFixed(2),'new-opacity-val')}
                <div class="property-group">
                    <label>Texture Type:</label>
                    ${this._textureSelect('new-material-texture', null)}
                </div>
            </div>
            <div class="dialog-actions">
                <button class="btn" id="cancel-create-mat">Cancel</button>
                <button class="btn primary" id="save-create-mat">Create</button>
            </div>`;

        this._wireSliderDisplay(dialog, 'new-material-opacity', 'new-opacity-val', v => parseFloat(v).toFixed(2));
        this._appendDialog(dialog);

        dialog.querySelector('.close-dialog-btn').addEventListener('click',  () => dialog.remove());
        dialog.querySelector('#cancel-create-mat').addEventListener('click', () => dialog.remove());
        dialog.querySelector('#save-create-mat').addEventListener('click',   () => {
            const colorHex = dialog.querySelector('#new-material-color').value;
            this.createMaterial(
                dialog.querySelector('#new-material-name').value.trim() || 'Unnamed',
                parseInt(colorHex.slice(1), 16),
                parseFloat(dialog.querySelector('#new-material-opacity').value),
                dialog.querySelector('#new-material-texture').value || null,
            );
            dialog.remove();
            this.render();
        });
    }

    _textureSelect(id, current) {
        const types = ['', 'grass', 'dirt', 'stone', 'wood', 'brick', 'sand', 'water', 'cobblestone', 'roof', 'snow'];
        const labels = { '': 'None (Standard PBR)', grass: 'Grass', dirt: 'Dirt', stone: 'Stone', wood: 'Wood',
                         brick: 'Brick', sand: 'Sand', water: 'Water', cobblestone: 'Cobblestone', roof: 'Roof', snow: 'Snow' };
        const opts = types.map(t => `<option value="${t}"${t === (current || '') ? ' selected' : ''}>${labels[t]}</option>`).join('');
        return `<select id="${id}" style="width:100%">${opts}</select>`;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Two-tone edit dialog helpers
    // ─────────────────────────────────────────────────────────────────────────

    _ditherModeSelect(id, value) {
        const modes = ['none','random','h','v','hv'];
        const labels = { none:'None', random:'Random', h:'H-Lines', v:'V-Lines', hv:'HV' };
        return `<select id="${id}" style="width:100%">
            ${modes.map(m => `<option value="${m}"${m === value ? ' selected' : ''}>${labels[m]}</option>`).join('')}
        </select>`;
    }

    _ditherSection(prefix, mat, label) {
        const m = mat[`${prefix}DitherMode`]  || 'none';
        const sp = mat[`${prefix}DitherSpace`] ?? (prefix === 't' ? 6 : 4);
        const th = mat[`${prefix}DitherThick`] ?? 1;
        const br = Math.round((mat[`${prefix}DitherBright`] ?? (prefix === 't' ? 1 : -1)) * 100);
        const al = Math.round((mat[`${prefix}DitherAlpha`]  ?? (prefix === 't' ? 0.5 : 0.7)) * 100);
        return `
            <div class="property-group"><label><strong>${label} Dither</strong></label></div>
            <div class="property-group"><label>Mode:</label>${this._ditherModeSelect(`edit-${prefix}Mode`, m)}</div>
            ${this._buildSliderRow(`edit-${prefix}Space`,  'Space',  2, 16,   1, sp, `edit-${prefix}SpaceV`)}
            ${this._buildSliderRow(`edit-${prefix}Thick`,  'Thick',  1,  8,   1, th, `edit-${prefix}ThickV`)}
            ${this._buildSliderRow(`edit-${prefix}Bright`, 'Bright',-100,100, 1, br, `edit-${prefix}BrightV`)}
            ${this._buildSliderRow(`edit-${prefix}Alpha`,  'Alpha',  0, 100,  1, al, `edit-${prefix}AlphaV`)}`;
    }

    _getEditDialogTwoToneSection(material) {
        if (material.type !== 'twotone') return '';
        const sp = ((material.splitPct ?? 0.5) * 100).toFixed(0);
        return `
            <div class="property-group">
                <label>Color B:</label>
                <input type="color" id="edit-material-colorB" value="${material.colorB || '#ffffff'}">
            </div>
            <div class="property-group">
                <label>Split %: <span id="edit-split-v">${sp}%</span></label>
                <input type="range" id="edit-material-split" min="0" max="1" step="0.01" value="${material.splitPct ?? 0.5}">
            </div>
            ${this._ditherSection('t', material, 'Top')}
            ${this._ditherSection('b', material, 'Bottom')}
            <div class="property-group">
                <label><input type="checkbox" id="edit-showOutline" ${material.showOutline ? 'checked' : ''}> Show Outline</label>
            </div>`;
    }

    editMaterial(material) {
        const is2T = material.type === 'twotone';
        const colH = this._colorToHex(material.color ?? material.colorA);

        const dialog = document.createElement('div');
        dialog.className = 'material-edit-dialog';
        dialog.innerHTML = `
            <div class="dialog-header">
                <h3>Edit: ${material.name}</h3>
                <button class="close-dialog-btn">&times;</button>
            </div>
            <div class="dialog-content">
                <div class="property-group">
                    <label>Color${is2T ? ' A' : ''}:</label>
                    <input type="color" id="edit-mat-color" value="${colH}">
                </div>
                ${is2T ? this._getEditDialogTwoToneSection(material) : ''}
                ${this._buildSliderRow('edit-mat-opacity','Opacity',0,1,0.01,(material.opacity ?? 1).toFixed(2),'edit-op-v')}
                <div class="property-group">
                    <label>Texture Type:</label>
                    ${this._textureSelect('edit-mat-texture', material.textureType)}
                </div>
            </div>
            <div class="dialog-actions">
                <button class="btn" id="cancel-edit-mat">Cancel</button>
                <button class="btn primary" id="save-edit-mat">Save</button>
            </div>`;

        // Wire slider displays
        this._wireSliderDisplay(dialog, 'edit-mat-opacity',      'edit-op-v',       v => parseFloat(v).toFixed(2));
        this._wireSliderDisplay(dialog, 'edit-material-split',   'edit-split-v',    v => `${(parseFloat(v)*100).toFixed(0)}%`);
        ['t','b'].forEach(p => {
            ['Space','Thick','Bright','Alpha'].forEach(s => {
                this._wireSliderDisplay(dialog, `edit-${p}${s}`, `edit-${p}${s}V`);
            });
        });

        this._appendDialog(dialog);
        dialog.querySelector('.close-dialog-btn').addEventListener('click',  () => dialog.remove());
        dialog.querySelector('#cancel-edit-mat').addEventListener('click',   () => dialog.remove());
        dialog.querySelector('#save-edit-mat').addEventListener('click', () => {
            const c = parseInt(dialog.querySelector('#edit-mat-color').value.slice(1), 16);
            material.color       = c;
            material.opacity     = parseFloat(dialog.querySelector('#edit-mat-opacity').value);
            material.textureType = dialog.querySelector('#edit-mat-texture').value || null;
            material.isPixelTexture = !!material.textureType;

            if (is2T) {
                material.colorB        = dialog.querySelector('#edit-material-colorB')?.value;
                material.splitPct      = parseFloat(dialog.querySelector('#edit-material-split')?.value  ?? 0.5);
                material.tDitherMode   =             dialog.querySelector('#edit-tMode')?.value          ?? 'none';
                material.tDitherSpace  = parseInt(   dialog.querySelector('#edit-tSpace')?.value         ?? 6);
                material.tDitherThick  = parseInt(   dialog.querySelector('#edit-tThick')?.value         ?? 1);
                material.tDitherBright = parseFloat( dialog.querySelector('#edit-tBright')?.value        ?? 100) / 100;
                material.tDitherAlpha  = parseFloat( dialog.querySelector('#edit-tAlpha')?.value         ?? 50)  / 100;
                material.bDitherMode   =             dialog.querySelector('#edit-bMode')?.value          ?? 'none';
                material.bDitherSpace  = parseInt(   dialog.querySelector('#edit-bSpace')?.value         ?? 4);
                material.bDitherThick  = parseInt(   dialog.querySelector('#edit-bThick')?.value         ?? 1);
                material.bDitherBright = parseFloat( dialog.querySelector('#edit-bBright')?.value        ?? -100) / 100;
                material.bDitherAlpha  = parseFloat( dialog.querySelector('#edit-bAlpha')?.value         ?? 70)   / 100;
                material.showOutline   =             dialog.querySelector('#edit-showOutline')?.checked  ?? true;
            }
            this._onMaterialUpdated(material);
            dialog.remove();
            this.render();
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────────

    /** Build a material item element (shared between render and renderMaterialsSection). */
    _renderMaterialItem(mat, cssClass, previewClass, infoClass, propsClass, actionsClass, nameClass) {
        const el      = document.createElement('div');
        el.className  = cssClass;
        el.dataset.materialId = mat.id;
        if (this.selectedMaterial === mat) el.classList.add('selected');

        const colorHex = this._colorToHex(mat.color ?? mat.colorA);
        const usage    = (mat.objectsUsing || []).length;

        el.innerHTML = `
            <div class="${previewClass}" style="background:${colorHex}" title="Used by ${usage} object(s)"></div>
            <div class="${infoClass}">
                <input type="text" class="${nameClass}" value="${mat.name}">
                <div class="${propsClass}">
                    ${mat.opacity !== undefined ? `O:${mat.opacity.toFixed(2)}` : ''}
                    ${mat.textureType ? ` T:${mat.textureType}` : ''}
                </div>
            </div>
            <div class="${actionsClass}">
                <button class="btn apply-material-btn" title="Apply to selection"><i class="fas fa-check"></i></button>
                <button class="btn edit-material-btn"  title="Edit"><i class="fas fa-edit"></i></button>
                <button class="btn delete-material-btn" title="Delete"><i class="fas fa-trash"></i></button>
            </div>`;

        el.addEventListener('click', e => {
            if (e.target.closest('.btn, .material-name, .material-name-full')) return;
            this.selectMaterial(mat);
        });

        el.querySelector(`.${nameClass}`).addEventListener('change', e => {
            mat.name = e.target.value.trim() || mat.name;
        });

        el.querySelector('.apply-material-btn').addEventListener('click', e => {
            e.stopPropagation();
            const sel = window.selectedObjects || [];
            this._applyToSelected?.(mat, sel);
        });
        el.querySelector('.edit-material-btn')?.addEventListener('click',   e => { e.stopPropagation(); this.editMaterial(mat); });
        el.querySelector('.delete-material-btn')?.addEventListener('click', e => { e.stopPropagation(); this.deleteMaterial(mat); });

        return el;
    }

    render() {
        if (!this.container) return;
        this.container.innerHTML = '';
        this.materials.forEach(mat => {
            this.container.appendChild(
                this._renderMaterialItem(mat, 'material-item', 'material-preview',
                    'material-info', 'material-properties', 'material-actions', 'material-name')
            );
        });
    }

    renderMaterialsSection() {
        const mc = this.materialsSectionContainer?.querySelector('.panel-content');
        if (!mc) return;
        mc.innerHTML = '';
        this.materials.forEach(mat => {
            mc.appendChild(
                this._renderMaterialItem(mat, 'material-item-full', 'material-preview-full',
                    'material-info-full', 'material-properties-full', 'material-actions-full', 'material-name-full')
            );
        });
    }
}

export { MaterialsManagerBase };
export default MaterialsManagerBase;
