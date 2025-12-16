/**
 * Layer Manager for 3D Editor
 * Manages layers, object organization, and layer ordering
 */

class LayerManager {
    constructor() {
        // Initialize with a default layer
        this.layers = [
            { id: 1, name: "Layer 1", visible: true, objects: [] }
        ];
        this.currentLayerId = 1;
        this.nextLayerId = 2;
    }

    // Add a new layer
    addLayer(name = `Layer ${this.nextLayerId}`) {
        const newLayer = {
            id: this.nextLayerId,
            name: name,
            visible: true,
            objects: []
        };
        this.layers.push(newLayer);
        this.currentLayerId = newLayer.id;
        this.nextLayerId++;
        return newLayer;
    }

    // Remove a layer by ID
    removeLayer(layerId) {
        if (this.layers.length <= 1) {
            console.warn("Cannot remove the last layer");
            return false;
        }

        const layerIndex = this.layers.findIndex(layer => layer.id === layerId);
        if (layerIndex === -1) return false;

        // Move objects to another layer if this is the current layer
        if (layerId === this.currentLayerId) {
            const fallbackLayer = this.layers.find(layer => layer.id !== layerId);
            if (fallbackLayer) {
                this.currentLayerId = fallbackLayer.id;
            }
        }

        this.layers.splice(layerIndex, 1);
        return true;
    }

    // Rename a layer
    renameLayer(layerId, newName) {
        const layer = this.layers.find(layer => layer.id === layerId);
        if (layer) {
            layer.name = newName;
            return true;
        }
        return false;
    }

    // Set current layer
    setCurrentLayer(layerId) {
        const layer = this.layers.find(layer => layer.id === layerId);
        if (layer) {
            this.currentLayerId = layerId;
            return true;
        }
        return false;
    }

    // Get current layer
    getCurrentLayer() {
        return this.layers.find(layer => layer.id === this.currentLayerId);
    }

    // Get all layers
    getAllLayers() {
        return this.layers;
    }

    // Add object to current layer
    addObjectToCurrentLayer(object) {
        const currentLayer = this.getCurrentLayer();
        if (currentLayer) {
            currentLayer.objects.push(object);
            return true;
        }
        return false;
    }

    // Remove object from its layer
    removeObjectFromLayer(object) {
        for (const layer of this.layers) {
            const objectIndex = layer.objects.findIndex(obj => obj.userData.id === object.userData.id);
            if (objectIndex !== -1) {
                layer.objects.splice(objectIndex, 1);
                return true;
            }
        }
        return false;
    }

    // Move object to a different layer
    moveObjectToLayer(object, targetLayerId) {
        // Remove from current layer first
        this.removeObjectFromLayer(object);

        // Add to target layer
        const targetLayer = this.layers.find(layer => layer.id === targetLayerId);
        if (targetLayer) {
            targetLayer.objects.push(object);
            return true;
        }
        return false;
    }

    // Reorder layers
    reorderLayers(newOrder) {
        // Validate that newOrder contains all layer IDs
        const currentLayerIds = this.layers.map(layer => layer.id);
        const newOrderIds = newOrder.map(id => parseInt(id));

        if (JSON.stringify(currentLayerIds.sort()) !== JSON.stringify(newOrderIds.sort())) {
            console.warn("Invalid layer reordering - missing or extra layers");
            return false;
        }

        // Reorder the layers array
        this.layers = newOrderIds.map(layerId =>
            this.layers.find(layer => layer.id === layerId)
        );

        return true;
    }

    /**
     * Move layer up in the order
     * @param {number} layerId - Layer ID to move
     * @returns {boolean} True if layer was moved, false if already at top
     */
    moveLayerUp(layerId) {
        const layers = this.layers;
        const currentIndex = layers.findIndex(layer => layer.id === layerId);

        if (currentIndex > 0) {
            // Swap with previous layer
            const temp = layers[currentIndex - 1];
            layers[currentIndex - 1] = layers[currentIndex];
            layers[currentIndex] = temp;
            return true;
        }
        return false;
    }

    /**
     * Move layer down in the order
     * @param {number} layerId - Layer ID to move
     * @returns {boolean} True if layer was moved, false if already at bottom
     */
    moveLayerDown(layerId) {
        const layers = this.layers;
        const currentIndex = layers.findIndex(layer => layer.id === layerId);

        if (currentIndex < layers.length - 1) {
            // Swap with next layer
            const temp = layers[currentIndex + 1];
            layers[currentIndex + 1] = layers[currentIndex];
            layers[currentIndex] = temp;
            return true;
        }
        return false;
    }

    // Toggle layer visibility
    toggleLayerVisibility(layerId) {
        const layer = this.layers.find(layer => layer.id === layerId);
        if (layer) {
            layer.visible = !layer.visible;
            return layer.visible;
        }
        return null;
    }

    // Get all objects in all layers (for rendering)
    getAllObjects() {
        return this.layers.flatMap(layer => layer.objects);
    }

    // Get objects in a specific layer
    getObjectsInLayer(layerId) {
        const layer = this.layers.find(layer => layer.id === layerId);
        return layer ? layer.objects : [];
    }

    // Get visible objects only
    getVisibleObjects() {
        return this.layers
            .filter(layer => layer.visible)
            .flatMap(layer => layer.objects);
    }

    // UI Update Methods

    /**
     * Update layer dropdown in UI
     * @param {Object} UI - UI elements object
     */
    updateLayerDropdown(UI) {
        UI.currentLayerDropdown.innerHTML = '';

        this.layers.forEach(layer => {
            const option = document.createElement('option');
            option.value = layer.id;
            option.textContent = layer.name;
            if (layer.id === this.currentLayerId) {
                option.selected = true;
            }
            UI.currentLayerDropdown.appendChild(option);
        });
    }

    /**
     * Update layers list with reordering controls
     * @param {Object} UI - UI elements object
     * @param {Function} updateLayerDropdown - Function to update layer dropdown
     */
    updateLayersList(UI, updateLayerDropdown) {
        UI.layersList.innerHTML = '';

        this.layers.forEach((layer, index) => {
            const layerItem = document.createElement('div');
            layerItem.className = 'layer-item';
            layerItem.dataset.layerId = layer.id;
            // Removed draggable = true - now using up/down buttons

            const visibilityToggle = document.createElement('input');
            visibilityToggle.type = 'checkbox';
            visibilityToggle.checked = layer.visible;
            visibilityToggle.addEventListener('change', () => {
                this.toggleLayerVisibility(layer.id);
                this.updateLayersList(UI, updateLayerDropdown);
            });

            const layerNameInput = document.createElement('input');
            layerNameInput.type = 'text';
            layerNameInput.value = layer.name;
            layerNameInput.addEventListener('change', () => {
                this.renameLayer(layer.id, layerNameInput.value);
                updateLayerDropdown(UI);
            });

            const deleteButton = document.createElement('button');
            deleteButton.className = 'icon-button';
            deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
            deleteButton.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.layers.length > 1) {
                    this.removeLayer(layer.id);
                    updateLayerDropdown(UI);
                    this.updateLayersList(UI, updateLayerDropdown);
                } else {
                    alert("Cannot delete the last layer");
                }
            });

            // Add up/down buttons for layer reordering
            const moveUpButton = document.createElement('button');
            moveUpButton.className = 'icon-button';
            moveUpButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
            moveUpButton.title = 'Move layer up';
            moveUpButton.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.moveLayerUp(layer.id)) {
                    this.updateLayersList(UI, updateLayerDropdown);
                    stateManager.addToHistory({
                        action: 'move_layer_up',
                        layerId: layer.id,
                        layerName: layer.name
                    });
                }
            });

            const moveDownButton = document.createElement('button');
            moveDownButton.className = 'icon-button';
            moveDownButton.innerHTML = '<i class="fas fa-arrow-down"></i>';
            moveDownButton.title = 'Move layer down';
            moveDownButton.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.moveLayerDown(layer.id)) {
                    this.updateLayersList(UI, updateLayerDropdown);
                    stateManager.addToHistory({
                        action: 'move_layer_down',
                        layerId: layer.id,
                        layerName: layer.name
                    });
                }
            });

            // Style the layer item with proper button layout
            layerNameInput.style.flex = '1';
            layerNameInput.style.minWidth = '100px';

            layerItem.appendChild(visibilityToggle);
            layerItem.appendChild(layerNameInput);
            layerItem.appendChild(moveUpButton);
            layerItem.appendChild(moveDownButton);
            layerItem.appendChild(deleteButton);

            UI.layersList.appendChild(layerItem);
        });
    }
}

// Export singleton instance
const layerManager = new LayerManager();
export { layerManager };