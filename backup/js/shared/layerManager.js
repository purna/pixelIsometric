/**
 * Layer Manager for 3D Editor
 * Manages layers, object organisation, and layer ordering.
 * Each layer renders as a collapsible group that natively shows the
 * objects that live inside it — no separate global scene-objects list.
 */

class LayerManager {
    constructor() {
        this.layers = [
            { id: 1, name: "Layer 1", visible: true, objects: [] }
        ];
        this.currentLayerId = 1;
        this.nextLayerId = 2;
    }

    // ── CRUD ─────────────────────────────────────────────────────────────

    addLayer(name = `Layer ${this.nextLayerId}`) {
        const newLayer = { id: this.nextLayerId, name, visible: true, objects: [] };
        this.layers.push(newLayer);
        this.currentLayerId = newLayer.id;
        this.nextLayerId++;
        return newLayer;
    }

    removeLayer(layerId) {
        if (this.layers.length <= 1) return false;
        const idx = this.layers.findIndex(l => l.id === layerId);
        if (idx === -1) return false;
        if (layerId === this.currentLayerId) {
            this.currentLayerId = this.layers.find(l => l.id !== layerId)?.id ?? 1;
        }
        this.layers.splice(idx, 1);
        return true;
    }

    renameLayer(layerId, newName) {
        const layer = this.layers.find(l => l.id === layerId);
        if (layer) { layer.name = newName; return true; }
        return false;
    }

    setCurrentLayer(layerId) {
        const layer = this.layers.find(l => l.id === parseInt(layerId));
        if (layer) { this.currentLayerId = layerId; return true; }
        return false;
    }

    // ── OBJECT MANAGEMENT ────────────────────────────────────────────────

    addObjectToCurrentLayer(object) {
        const current = this.getCurrentLayer();
        if (current) { current.objects.push(object); return true; }
        return false;
    }

    removeObjectFromLayer(object) {
        for (const layer of this.layers) {
            const idx = layer.objects.findIndex(
                o => o.userData?.id === object.userData?.id
            );
            if (idx !== -1) { layer.objects.splice(idx, 1); return true; }
        }
        return false;
    }

    moveObjectToLayer(object, targetLayerId) {
        this.removeObjectFromLayer(object);
        const target = this.layers.find(l => l.id === targetLayerId);
        if (target) { target.objects.push(object); return true; }
        return false;
    }

    // ── LAYER STATE ──────────────────────────────────────────────────────

    toggleLayerVisibility(layerId) {
        const layer = this.layers.find(l => l.id === layerId);
        if (layer) { layer.visible = !layer.visible; return layer.visible; }
        return null;
    }

    moveLayerUp(layerId) {
        const idx = this.layers.findIndex(l => l.id === layerId);
        if (idx <= 0) return false;
        [this.layers[idx - 1], this.layers[idx]] =
            [this.layers[idx], this.layers[idx - 1]];
        return true;
    }

    moveLayerDown(layerId) {
        const idx = this.layers.findIndex(l => l.id === layerId);
        if (idx >= this.layers.length - 1) return false;
        [this.layers[idx], this.layers[idx + 1]] =
            [this.layers[idx + 1], this.layers[idx]];
        return true;
    }

    // ── QUERIES ──────────────────────────────────────────────────────────

    getCurrentLayer() {
        return this.layers.find(l => l.id === this.currentLayerId);
    }

    getAllLayers() {
        return this.layers;
    }

    getAllObjects() {
        return this.layers.flatMap(l => l.objects);
    }

    getObjectsInLayer(layerId) {
        const layer = this.layers.find(l => l.id === layerId);
        return layer ? layer.objects : [];
    }

    getVisibleObjects() {
        return this.layers
            .filter(l => l.visible)
            .flatMap(l => l.objects);
    }

    // ── UI RENDERING ─────────────────────────────────────────────────────

    /**
     * Build HTML for the object list inside a given layer.
     * Objects are grouped by type (same pattern as the old global list).
     */
    _getLayerObjectsHtml(layer) {
        if (!layer.objects?.length) {
            return `<div class="layer-objects-empty">No objects in this layer</div>`;
        }

        const byType = {};
        layer.objects.forEach(obj => {
            const type = obj.userData.type || 'object';
            (byType[type] ??= []).push(obj);
        });

        let html = '';
        Object.keys(byType).sort().forEach(type => {
            const list = byType[type];
            html += `<div class="layer-object-type-group">
                <div class="layer-object-type-header">${type.toUpperCase()} (${list.length})</div>
                <div class="layer-object-items">`;
            list.forEach(obj => {
                html += `<div class="layer-object-item" data-object-id="${obj.userData.id}">
                    <span class="layer-object-name">${obj.userData.name || 'unnamed'}</span>
                    <span class="layer-object-position">(${obj.position.x.toFixed(0)}, ${obj.position.y.toFixed(0)}, ${obj.position.z.toFixed(0)})</span>
                </div>`;
            });
            html += `</div></div>`;
        });
        return html;
    }

    /**
     * Append all layer groups into the #layers-list container.
     * Call this when layers are added / removed / renamed.
     */
    renderLayersList() {
        const container = document.getElementById('layers-list');
        if (!container) return;
        container.innerHTML = '';
        this.layers.forEach(layer => {
            container.appendChild(this._buildLayerElement(layer));
        });
    }

    /**
     * Re-draw the objects section inside each layer group after a change.
     * Call this when objects are added or moved between layers.
     */
    refreshLayerObjects() {
        this.layers.forEach(layer => {
            const group = document.querySelector(
                `.layer-group[data-layer-id="${layer.id}"]`
            );
            if (!group) return;

            // ── 1. Install a fresh objects panel ─────────────────────────
            if (!group.querySelector('.layer-details')) {
                const freshDetails = document.createElement('div');
                freshDetails.className = 'layer-details expanded';
                freshDetails.innerHTML = this._getLayerObjectsHtml(layer);
                group.appendChild(freshDetails);
            }

            // ── 2. Update HTML if contents changed ────────────────────────
            const details = group.querySelector('.layer-details');
            const freshHtml = this._getLayerObjectsHtml(layer);
            if (details && details.innerHTML !== freshHtml) {
                details.innerHTML = freshHtml;
            }

            // ── 3. Re-attach handlers + sync selection ───────────────────
            const selIds = new Set(
                (window.selectedObjects || []).map(o => o.userData?.id)
            );
            const freshDetails = group.querySelector('.layer-details');
            layer.objects.forEach(obj => {
                const item = freshDetails?.querySelector(
                    `[data-object-id="${obj.userData.id}"]`
                );
                if (item) {
                    item.classList.toggle('selected', selIds.has(obj.userData?.id));
                    item.addEventListener('click', (e) => {
                        const isSelected = window.selectedObjects?.includes(obj);
                        if (e.ctrlKey || e.metaKey || e.shiftKey) {
                            if (isSelected) {
                                window.restoreSelectionIndicator?.(obj);
                                window.selectedObjects =
                                    window.selectedObjects.filter(o => o !== obj);
                            } else {
                                window.applySelectionIndicator?.(obj);
                                window.selectedObjects = [
                                    ...window.selectedObjects,
                                    obj
                                ];
                            }
                            window.updatePropertiesPanel?.();
                            window.updateObjectDropdown?.();
                        } else {
                            window.setSelectedObjects([obj]);
                        }
                        window.updateSceneObjectsList();
                    });
                }
            });
        });
    }

    // ── INTERNAL: build a single layer DOM element ───────────────────────

    _buildLayerElement(layer) {
        const group = document.createElement('div');
        group.className = 'layer-group';
        group.dataset.layerId = layer.id;
        if (layer.id === this.currentLayerId) group.classList.add('active');

        // ── Header row ─────────────────────────────────────────────────
        const header = document.createElement('div');
        header.className = 'layer-group-header';

        const chevron = document.createElement('span');
        chevron.className = 'layer-chevron expanded';
        chevron.innerHTML = '<i class="fas fa-chevron-down"></i>';
        chevron.addEventListener('click', e => { e.stopPropagation(); this._toggleExpand(group); });

        const visCheck = document.createElement('input');
        visCheck.type = 'checkbox';
        visCheck.className = 'layer-vis-check';
        visCheck.checked = layer.visible;
        visCheck.addEventListener('change', e => {
            e.stopPropagation();
            this.toggleLayerVisibility(layer.id);
        });

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'layer-name-input';
        nameInput.value = layer.name;
        nameInput.addEventListener('change', () => {
            this.renameLayer(layer.id, nameInput.value);
            const dd = document.getElementById('current-layer');
            if (dd) { const o = dd.querySelector(`option[value="${layer.id}"]`); if (o) o.textContent = layer.name; }
        });

        const actions = document.createElement('div');
        actions.className = 'layer-group-actions';
        ["fa-arrow-up", "fa-arrow-down", "fa-trash"].forEach((icon, i) => {
            const titles = ["Move layer up", "Move layer down", "Delete layer"];
            const clicks = [() => this.moveLayerUp(layer.id), () => this.moveLayerDown(layer.id), () => {
                if (this.layers.length > 1) { this.removeLayer(layer.id); this.renderLayersList(); }
            }];
            const btn = this._makeIconBtn(icon, titles[i], clicks[i]);
            actions.appendChild(btn);
        });

        // Paint-roller: apply the currently selected material to every object
        // in this layer
        const paintBtn = this._makeIconBtn(
            'fa-paint-roller',
            'Apply material to all objects in this layer',
            () => {
                window.materialsManager?.applyMaterialToLayer(layer.id);
                this.refreshLayerObjects();
            }
        );
        paintBtn.classList.add('paint-layer-btn');
        actions.appendChild(paintBtn);

        // Clicking the header selects this layer as active
        header.addEventListener('click', () => {
            if (this.currentLayerId !== layer.id) {
                this.currentLayerId = layer.id;
                this.renderLayersList();
            }
        });

        header.append(chevron, visCheck, nameInput, actions);
        group.appendChild(header);

        // ── Objects panel ──────────────────────────────────────────────
        const details = document.createElement('div');
        details.className = 'layer-details expanded';
        details.innerHTML = this._getLayerObjectsHtml(layer);

        layer.objects.forEach(obj => {
            const item = details.querySelector(`[data-object-id="${obj.userData.id}"]`);
            if (item) {
                item.addEventListener('click', (e) => {
                    const isSelected = window.selectedObjects?.includes(obj);
                    if (e.ctrlKey || e.metaKey || e.shiftKey) {
                        // Toggle individual object in/out of multi-selection
                        if (isSelected) {
                            window.restoreSelectionIndicator?.(obj);
                            window.selectedObjects =
                                window.selectedObjects.filter(o => o !== obj);
                        } else {
                            window.applySelectionIndicator?.(obj);
                            window.selectedObjects = [...window.selectedObjects, obj];
                        }
                        window.updatePropertiesPanel?.();
                        window.updateObjectDropdown?.();
                    } else {
                        window.setSelectedObjects([obj]);
                    }
                    window.updateSceneObjectsList();
                });
            }
        });

        group.appendChild(details);
        return group;
    }

    _makeIconBtn(icon, title, handler) {
        const btn = document.createElement('button');
        btn.className = 'layer-icon-btn';
        btn.title = title;
        btn.innerHTML = `<i class="fas ${icon}"></i>`;
        btn.addEventListener('click', e => { e.stopPropagation(); handler(); });
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
}

const layerManager = new LayerManager();
window.layerManager = layerManager;
export { layerManager };
export { LayerManager };
