/**
 * Layer Manager for 3D Editor
 *
 * Improvements over original:
 *  - refreshLayerObjects() no longer re-injects a `.layer-details` that already
 *    exists — previously it would double-render objects on every refresh.
 *  - Event listeners attached during refreshLayerObjects() are now cleaned up
 *    with AbortController so re-renders don't accumulate duplicate handlers.
 *  - _buildLayerElement() stores an AbortController per layer for the same reason.
 *  - renderLayersList() / refreshLayerObjects() are debounced to avoid back-to-back
 *    DOM rebuilds during bulk operations (e.g. clearing the scene).
 *  - setCurrentLayer() now accepts both number and string ids (parseInt coercion
 *    was inconsistently applied in the original).
 *  - moveLayerUp / moveLayerDown return false cleanly instead of undefined.
 *  - getObjectsInLayer() always returns an array (was returning undefined on miss).
 *  - _makeIconBtn() no longer re-queries the DOM — handler is already closure-bound.
 *  - Public API additions: getLayerById(), hasLayer(), getObjectLayer().
 */

class LayerManager {
    constructor() {
        this.layers        = [{ id: 1, name: 'Layer 1', visible: true, objects: [] }];
        this.currentLayerId = 1;
        this.nextLayerId   = 2;

        // AbortControllers keyed by layerId — used to clean up event listeners
        this._controllers  = new Map();

        // Debounce timers
        this._renderTimer  = null;
        this._refreshTimer = null;
        this._DEBOUNCE_MS  = 16; // one frame
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CRUD
    // ─────────────────────────────────────────────────────────────────────────

    addLayer(name) {
        name = name || `Layer ${this.nextLayerId}`;
        const newLayer = { id: this.nextLayerId, name, visible: true, objects: [] };
        this.layers.push(newLayer);
        this.currentLayerId = newLayer.id;
        this.nextLayerId++;
        return newLayer;
    }

    removeLayer(layerId) {
        layerId = Number(layerId);
        if (this.layers.length <= 1) return false;
        const idx = this.layers.findIndex(l => l.id === layerId);
        if (idx === -1) return false;
        if (layerId === this.currentLayerId) {
            this.currentLayerId = this.layers.find(l => l.id !== layerId)?.id ?? 1;
        }
        // Clean up any DOM listeners for this layer
        this._abort(layerId);
        this.layers.splice(idx, 1);
        return true;
    }

    renameLayer(layerId, newName) {
        layerId = Number(layerId);
        const layer = this.getLayerById(layerId);
        if (layer) { layer.name = newName; return true; }
        return false;
    }

    setCurrentLayer(layerId) {
        layerId = Number(layerId);
        const layer = this.getLayerById(layerId);
        if (layer) { this.currentLayerId = layerId; return true; }
        return false;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Object management
    // ─────────────────────────────────────────────────────────────────────────

    addObjectToCurrentLayer(object) {
        const current = this.getCurrentLayer();
        if (current) { current.objects.push(object); return true; }
        return false;
    }

    removeObjectFromLayer(object) {
        const id = object.userData?.id;
        for (const layer of this.layers) {
            const idx = layer.objects.findIndex(o => o.userData?.id === id);
            if (idx !== -1) { layer.objects.splice(idx, 1); return true; }
        }
        return false;
    }

    moveObjectToLayer(object, targetLayerId) {
        targetLayerId = Number(targetLayerId);
        this.removeObjectFromLayer(object);
        const target = this.getLayerById(targetLayerId);
        if (target) { target.objects.push(object); return true; }
        return false;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Layer state
    // ─────────────────────────────────────────────────────────────────────────

    toggleLayerVisibility(layerId) {
        layerId = Number(layerId);
        const layer = this.getLayerById(layerId);
        if (layer) { layer.visible = !layer.visible; return layer.visible; }
        return null;
    }

    moveLayerUp(layerId) {
        layerId = Number(layerId);
        const idx = this.layers.findIndex(l => l.id === layerId);
        if (idx <= 0) return false;
        [this.layers[idx - 1], this.layers[idx]] = [this.layers[idx], this.layers[idx - 1]];
        return true;
    }

    moveLayerDown(layerId) {
        layerId = Number(layerId);
        const idx = this.layers.findIndex(l => l.id === layerId);
        if (idx < 0 || idx >= this.layers.length - 1) return false;
        [this.layers[idx], this.layers[idx + 1]] = [this.layers[idx + 1], this.layers[idx]];
        return true;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Queries
    // ─────────────────────────────────────────────────────────────────────────

    getCurrentLayer()          { return this.getLayerById(this.currentLayerId); }
    getAllLayers()              { return this.layers; }
    getAllObjects()             { return this.layers.flatMap(l => l.objects); }
    getVisibleObjects()        { return this.layers.filter(l => l.visible).flatMap(l => l.objects); }

    getLayerById(id)           { return this.layers.find(l => l.id === Number(id)) ?? null; }
    hasLayer(id)               { return this.getLayerById(id) !== null; }

    getObjectsInLayer(layerId) {
        const layer = this.getLayerById(layerId);
        return layer ? layer.objects : [];
    }

    /** Return the layer that contains the given object, or null. */
    getObjectLayer(object) {
        const id = object.userData?.id;
        return this.layers.find(l => l.objects.some(o => o.userData?.id === id)) ?? null;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UI rendering — debounced public entry points
    // ─────────────────────────────────────────────────────────────────────────

    renderLayersList() {
        clearTimeout(this._renderTimer);
        this._renderTimer = setTimeout(() => this._renderLayersListNow(), this._DEBOUNCE_MS);
    }

    refreshLayerObjects() {
        clearTimeout(this._refreshTimer);
        this._refreshTimer = setTimeout(() => this._refreshLayerObjectsNow(), this._DEBOUNCE_MS);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UI rendering — immediate implementations
    // ─────────────────────────────────────────────────────────────────────────

    _renderLayersListNow() {
        const container = document.getElementById('layers-list');
        if (!container) return;

        // Abort all existing layer listeners before rebuilding
        this._controllers.forEach((ctrl) => ctrl.abort());
        this._controllers.clear();

        container.innerHTML = '';
        this.layers.forEach(layer => container.appendChild(this._buildLayerElement(layer)));

        // Sync the "current layer" dropdown
        const dd = document.getElementById('current-layer');
        if (dd) {
            dd.innerHTML = this.layers
                .map(l => `<option value="${l.id}"${l.id === this.currentLayerId ? ' selected' : ''}>${l.name}</option>`)
                .join('');
        }
    }

    _refreshLayerObjectsNow() {
        this.layers.forEach(layer => {
            const group = document.querySelector(`.layer-group[data-layer-id="${layer.id}"]`);
            if (!group) return;

            // Abort previous object-item listeners for this layer
            this._abort(layer.id);

            let details = group.querySelector('.layer-details');
            if (!details) {
                details = document.createElement('div');
                details.className = 'layer-details expanded';
                group.appendChild(details);
            }

            const freshHtml = this._getLayerObjectsHtml(layer);
            if (details.innerHTML !== freshHtml) details.innerHTML = freshHtml;

            this._attachObjectItemListeners(details, layer);
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DOM helpers
    // ─────────────────────────────────────────────────────────────────────────

    _getLayerObjectsHtml(layer) {
        if (!layer.objects?.length) {
            return '<div class="layer-objects-empty">No objects in this layer</div>';
        }

        const byType = {};
        layer.objects.forEach(obj => {
            const type = obj.userData.type || 'object';
            (byType[type] ??= []).push(obj);
        });

        return Object.keys(byType).sort().map(type => {
            const list = byType[type];
            const items = list.map(obj => `
                <div class="layer-object-item" data-object-id="${obj.userData.id}">
                    <span class="layer-object-name">${obj.userData.name || 'unnamed'}</span>
                    <span class="layer-object-position">(${obj.position.x.toFixed(0)}, ${obj.position.y.toFixed(0)}, ${obj.position.z.toFixed(0)})</span>
                </div>`).join('');
            return `
                <div class="layer-object-type-group">
                    <div class="layer-object-type-header">${type.toUpperCase()} (${list.length})</div>
                    <div class="layer-object-items">${items}</div>
                </div>`;
        }).join('');
    }

    _buildLayerElement(layer) {
        const ctrl = new AbortController();
        this._controllers.set(layer.id, ctrl);
        const { signal } = ctrl;

        const group = document.createElement('div');
        group.className   = 'layer-group';
        group.dataset.layerId = layer.id;
        if (layer.id === this.currentLayerId) group.classList.add('active');

        // ── Header ──────────────────────────────────────────────────────────
        const header = document.createElement('div');
        header.className = 'layer-group-header';

        const chevron = document.createElement('span');
        chevron.className = 'layer-chevron expanded';
        chevron.innerHTML = '<i class="fas fa-chevron-down"></i>';
        chevron.addEventListener('click', e => { e.stopPropagation(); this._toggleExpand(group); }, { signal });

        const visCheck      = document.createElement('input');
        visCheck.type       = 'checkbox';
        visCheck.className  = 'layer-vis-check';
        visCheck.checked    = layer.visible;
        visCheck.addEventListener('change', e => {
            e.stopPropagation();
            this.toggleLayerVisibility(layer.id);
        }, { signal });

        const nameInput    = document.createElement('input');
        nameInput.type     = 'text';
        nameInput.className = 'layer-name-input';
        nameInput.value    = layer.name;
        nameInput.addEventListener('change', () => {
            this.renameLayer(layer.id, nameInput.value);
            const dd = document.getElementById('current-layer');
            const opt = dd?.querySelector(`option[value="${layer.id}"]`);
            if (opt) opt.textContent = layer.name;
        }, { signal });

        const actions = document.createElement('div');
        actions.className = 'layer-group-actions';

        [
            ['fa-arrow-up',    'Move layer up',    () => { this.moveLayerUp(layer.id);   this.renderLayersList(); }],
            ['fa-arrow-down',  'Move layer down',  () => { this.moveLayerDown(layer.id); this.renderLayersList(); }],
            ['fa-trash',       'Delete layer',     () => { if (this.layers.length > 1) { this.removeLayer(layer.id); this.renderLayersList(); } }],
            ['fa-paint-roller','Apply material to all objects in this layer', () => {
                window.materialsManager?.applyMaterialToLayer(layer.id);
                this.refreshLayerObjects();
            }],
        ].forEach(([icon, title, handler]) => {
            actions.appendChild(this._makeIconBtn(icon, title, handler, signal));
        });

        header.addEventListener('click', () => {
            if (this.currentLayerId !== layer.id) {
                this.currentLayerId = layer.id;
                this.renderLayersList();
            }
        }, { signal });

        header.append(chevron, visCheck, nameInput, actions);
        group.appendChild(header);

        // ── Objects panel ────────────────────────────────────────────────────
        const details       = document.createElement('div');
        details.className   = 'layer-details expanded';
        details.innerHTML   = this._getLayerObjectsHtml(layer);
        this._attachObjectItemListeners(details, layer);
        group.appendChild(details);

        return group;
    }

    /**
     * Wire click handlers on every `.layer-object-item` inside `details`.
     * Uses the layer's AbortController so they're removed on the next refresh.
     */
    _attachObjectItemListeners(details, layer) {
        const ctrl   = this._controllers.get(layer.id);
        const signal = ctrl?.signal;

        const selIds = new Set((window.selectedObjects || []).map(o => o.userData?.id));

        layer.objects.forEach(obj => {
            const item = details.querySelector(`[data-object-id="${obj.userData.id}"]`);
            if (!item) return;
            item.classList.toggle('selected', selIds.has(obj.userData?.id));
            item.addEventListener('click', e => {
                if (e.ctrlKey || e.metaKey || e.shiftKey) {
                    const isSelected = window.selectedObjects?.includes(obj);
                    if (isSelected) {
                        window.restoreSelectionIndicator?.(obj);
                        window.selectedObjects = window.selectedObjects.filter(o => o !== obj);
                    } else {
                        window.applySelectionIndicator?.(obj);
                        window.selectedObjects = [...(window.selectedObjects || []), obj];
                    }
                    window.updatePropertiesPanel?.();
                    window.updateObjectDropdown?.();
                } else {
                    window.setSelectedObjects?.([obj]);
                }
                window.updateSceneObjectsList?.();
            }, { signal });
        });
    }

    _makeIconBtn(icon, title, handler, signal) {
        const btn     = document.createElement('button');
        btn.className = 'layer-icon-btn';
        btn.title     = title;
        btn.innerHTML = `<i class="fas ${icon}"></i>`;
        btn.addEventListener('click', e => { e.stopPropagation(); handler(); }, { signal });
        return btn;
    }

    _toggleExpand(group) {
        const details = group.querySelector('.layer-details');
        const chevron = group.querySelector('.layer-chevron');
        if (!details) return;
        details.classList.toggle('collapsed');
        details.classList.toggle('expanded');
        chevron.classList.toggle('expanded');
    }

    /** Abort and remove the AbortController for a given layerId. */
    _abort(layerId) {
        layerId = Number(layerId);
        const ctrl = this._controllers.get(layerId);
        if (ctrl) { ctrl.abort(); this._controllers.delete(layerId); }
        // Create a fresh one so the layer can re-attach listeners
        this._controllers.set(layerId, new AbortController());
    }
}

const layerManager = new LayerManager();
export { layerManager };
export { LayerManager };
