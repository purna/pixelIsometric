/**
 * Materials Manager - Procedural and Pixel-based Materials
 * Supports standard PBR materials + pixel-textured materials
 */
class MaterialsManager {
    constructor(app) {
        this.app = app;
        this.materials = [];
        this.selectedMaterial = null;
        this.container = document.getElementById('materials-content');
        this.materialsSectionContainer = document.getElementById('materials-section');
        this.init();
    }

    init() {
        // Create default materials
        this.createDefaultMaterials();
        
        // Set up create material button event listener
        const createBtn = document.getElementById('create-material-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.createNewMaterial());
        }
    }

    createDefaultMaterials() {
        // Create some default materials
        this.createMaterial('Plain Wood', 0x8B4513, 0.0, 0.7, 1.0, 'wood');
        this.createMaterial('Smooth Metal', 0xaaaaaa, 0.9, 0.1, 1.0, 'metal');
        this.createMaterial('Rough Plastic', 0xff5555, 0.0, 0.8, 1.0, 'plastic');
        this.createMaterial('Matte Stone', 0x808080, 0.2, 0.9, 1.0, 'stone');
        this.createMaterial('Gold', 0xffd700, 1.0, 0.15, 1.0, 'metal');
        this.createMaterial('Rusty Metal', 0x8b4513, 0.7, 0.6, 1.0, 'rust');

        // Pixel texture materials (using texture manager)
        this.createMaterial('Grass Pixel', 0x7CFC00, 0.9, 0.0, 1.0, 'grass');
        this.createMaterial('Dirt Pixel', 0x8B4513, 0.95, 0.0, 1.0, 'dirt');
        this.createMaterial('Brick Pixel', 0xD32F2F, 0.85, 0.1, 1.0, 'brick');
        this.createMaterial('Cobblestone', 0x78909C, 0.9, 0.1, 1.0, 'cobblestone');
        this.createMaterial('Sand Pixel', 0xFFD54F, 0.95, 0.0, 1.0, 'sand');
        this.createMaterial('Water Pixel', 0x2196F3, 0.1, 0.8, 0.7, 'water');

        this.render();
    }

    createMaterial(name, color, metalness, roughness, opacity = 1.0, textureType = null) {
        const material = {
            id: 'mat-' + Date.now() + Math.random(),
            name: name,
            color: color,
            metalness: metalness,
            roughness: roughness,
            opacity: opacity,
            textureType: textureType,
            objectsUsing: [], // Track which objects use this material
            isPixelTexture: textureType !== null
        };
        this.materials.push(material);
        return material;
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = '';

        // Render each material
        this.materials.forEach(material => {
            const materialEl = document.createElement('div');
            materialEl.className = 'material-item';
            materialEl.dataset.materialId = material.id;
            if (this.selectedMaterial === material) {
                materialEl.classList.add('selected');
            }

            materialEl.innerHTML = `
                <div class="material-preview" style="background-color: #${material.color.toString(16).padStart(6, '0')}" title="Used by: ${material.objectsUsing.length} objects"></div>
                <div class="material-info">
                    <input type="text" class="material-name" value="${material.name}" title="${material.isPixelTexture ? 'Pixel Texture' : 'PBR Material'}">
                    <div class="material-properties">
                        <span class="material-prop">M: ${material.metalness.toFixed(1)}</span>
                        <span class="material-prop">R: ${material.roughness.toFixed(1)}</span>
                        <span class="material-prop">O: ${material.opacity.toFixed(2)}</span>
                        ${material.textureType ? `<span class="material-prop">T: ${material.textureType}</span>` : ''}
                    </div>
                </div>
                <div class="material-actions">
                    <button class="btn apply-material-btn" title="Apply to Selected"><i class="fas fa-check"></i></button>
                    <button class="btn edit-material-btn" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="btn delete-material-btn" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            `;

            // Add event listeners
            materialEl.addEventListener('click', (e) => {
                if (e.target.classList.contains('material-name') ||
                    e.target.classList.contains('apply-material-btn') ||
                    e.target.classList.contains('edit-material-btn') ||
                    e.target.classList.contains('delete-material-btn')) {
                    return; // Let specific handlers handle these
                }
                this.selectMaterial(material);
            });

            // Material name editing
            const nameInput = materialEl.querySelector('.material-name');
            nameInput.addEventListener('change', (e) => {
                material.name = e.target.value;
            });
            nameInput.addEventListener('click', (e) => e.stopPropagation());

            // Apply material button
            materialEl.querySelector('.apply-material-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.applyMaterialToSelected(material);
            });

            // Edit material button
            materialEl.querySelector('.edit-material-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.editMaterial(material);
            });

            // Delete material button
            materialEl.querySelector('.delete-material-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteMaterial(material);
            });

            this.container.appendChild(materialEl);
        });
    }

    createNewMaterial() {
        // Use config defaults if available
        const defaults = {
            name: 'New Material',
            color: 0x00ff41,
            metalness: 0.2,
            roughness: 0.3,
            opacity: 1.0,
            textureType: null
        };

        // Show edit dialog with defaults
        this.showCreateMaterialDialog(defaults);
    }

    showCreateMaterialDialog(defaults) {
        // Create dialog
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
                    <label>Metalness: <span id="new-metalness-value">${defaults.metalness.toFixed(2)}</span></label>
                    <input type="range" id="new-material-metalness" min="0" max="1" step="0.01" value="${defaults.metalness}">
                </div>
                <div class="property-group">
                    <label>Roughness: <span id="new-roughness-value">${defaults.roughness.toFixed(2)}</span></label>
                    <input type="range" id="new-material-roughness" min="0" max="1" step="0.01" value="${defaults.roughness}">
                </div>
                <div class="property-group">
                    <label>Opacity: <span id="new-opacity-value">${defaults.opacity.toFixed(2)}</span></label>
                    <input type="range" id="new-material-opacity" min="0" max="1" step="0.01" value="${defaults.opacity}">
                </div>
                <div class="property-group">
                    <label>Texture Type:</label>
                    <select id="new-material-texture" class="material-dropdown-wrapper" style="width:100%">
                        <option value="">None (Standard PBR)</option>
                        <option value="grass">Grass</option>
                        <option value="dirt">Dirt</option>
                        <option value="stone">Stone</option>
                        <option value="wood">Wood</option>
                        <option value="brick">Brick</option>
                        <option value="sand">Sand</option>
                        <option value="water">Water</option>
                        <option value="cobblestone">Cobblestone</option>
                        <option value="roof">Roof</option>
                        <option value="snow">Snow</option>
                    </select>
                </div>
            </div>
            <div class="dialog-actions">
                <button class="btn" id="cancel-create-material">Cancel</button>
                <button class="btn primary" id="save-create-material">Create</button>
            </div>
        `;

        // Update value displays
        dialog.querySelector('#new-material-metalness').addEventListener('input', (e) => {
            dialog.querySelector('#new-metalness-value').textContent = parseFloat(e.target.value).toFixed(2);
        });
        dialog.querySelector('#new-material-roughness').addEventListener('input', (e) => {
            dialog.querySelector('#new-roughness-value').textContent = parseFloat(e.target.value).toFixed(2);
        });
        dialog.querySelector('#new-material-opacity').addEventListener('input', (e) => {
            dialog.querySelector('#new-opacity-value').textContent = parseFloat(e.target.value).toFixed(2);
        });

        document.body.appendChild(dialog);

        // Add event listeners
        dialog.querySelector('.close-dialog-btn').addEventListener('click', () => dialog.remove());
        dialog.querySelector('#cancel-create-material').addEventListener('click', () => dialog.remove());
        dialog.querySelector('#save-create-material').addEventListener('click', () => {
            // Save new material
            const nameInput = dialog.querySelector('#new-material-name');
            const colorInput = dialog.querySelector('#new-material-color');
            const metalnessInput = dialog.querySelector('#new-material-metalness');
            const roughnessInput = dialog.querySelector('#new-material-roughness');
            const opacityInput = dialog.querySelector('#new-material-opacity');
            const textureInput = dialog.querySelector('#new-material-texture');

            // Parse color
            let colorValue = colorInput.value;
            if (colorValue.startsWith('#')) {
                colorValue = parseInt(colorValue.substring(1), 16);
            }

            const textureType = textureInput.value || null;

            this.createMaterial(
                nameInput.value,
                colorValue,
                parseFloat(metalnessInput.value),
                parseFloat(roughnessInput.value),
                parseFloat(opacityInput.value),
                textureType
            );

            dialog.remove();
            this.render();
            if (this.app && this.app.notifications) {
                this.app.notifications.show('Material created successfully!', 'success');
            } else if (window.notifications) {
                window.notifications.show('Material created successfully!', 'success');
            }
        });
    }

    selectMaterial(material) {
        this.selectedMaterial = material;
        this.render();
    }

    applyMaterialToSelected(material) {
        if (!this.app) return;
        
        let selectedObj = this.app.selectedObject;
        if (!selectedObj && this.app.objects && this.app.objects.length > 0) {
            selectedObj = this.app.selectedObject;
        }
        
        if (!selectedObj) {
            if (this.app.notifications) {
                this.app.notifications.show('No object selected!', 'error');
            } else if (window.notifications) {
                window.notifications.show('No object selected!', 'error');
            }
            return;
        }

        const obj = selectedObj;
        let targetMesh = null;

        if (obj.isMesh) {
            targetMesh = obj;
        } else if (obj.isGroup) {
            // Apply to all meshes in group
            obj.traverse(c => {
                if (c.isMesh) {
                    this._applyMaterialToMesh(c, material);
                }
            });
            // Add to objects using this material
            if (!material.objectsUsing.includes(obj)) {
                material.objectsUsing.push(obj);
            }
            if (this.app.notifications) {
                this.app.notifications.show(`Applied material to ${obj.userData.name || obj.userData.type}`, 'success');
            } else if (window.notifications) {
                window.notifications.show(`Applied material to ${obj.userData.name || obj.userData.type}`, 'success');
            }
            return;
        }

        if (targetMesh && targetMesh.material) {
            this._applyMaterialToMesh(targetMesh, material);

            // Add to objects using this material
            if (!material.objectsUsing.includes(obj)) {
                material.objectsUsing.push(obj);
            }

            if (this.app.notifications) {
                this.app.notifications.show(`Applied material to ${obj.userData.name || obj.userData.type}`, 'success');
            } else if (window.notifications) {
                window.notifications.show(`Applied material to ${obj.userData.name || obj.userData.type}`, 'success');
            }
        }
    }

    _applyMaterialToMesh(mesh, material) {
        if (material.isPixelTexture && window.textureManager) {
            // Use pixel texture from texture manager
            const newMaterial = window.textureManager.getMaterial(material.textureType);
            if (newMaterial) {
                mesh.material = newMaterial;
                mesh.userData.materialType = material.textureType;
                mesh.userData.isPixelTexture = true;
            }
        } else {
            // Standard PBR material
            const newMaterial = new THREE.MeshStandardMaterial({
                color: material.color,
                metalness: material.metalness,
                roughness: material.roughness,
                transparent: material.opacity < 1.0,
                opacity: material.opacity
            });
            mesh.material = newMaterial;
            mesh.userData.isPixelTexture = false;
        }
    }

    editMaterial(material) {
        // Show edit dialog
        const dialog = document.createElement('div');
        dialog.className = 'material-edit-dialog';
        dialog.innerHTML = `
            <div class="dialog-header">
                <h3>Edit Material: ${material.name}</h3>
                <button class="close-dialog-btn">&times;</button>
            </div>
            <div class="dialog-content">
                <div class="property-group">
                    <label>Color:</label>
                    <input type="color" id="edit-material-color" value="#${material.color.toString(16).padStart(6, '0')}">
                </div>
                <div class="property-group">
                    <label>Metalness: <span id="edit-metalness-value">${material.metalness.toFixed(2)}</span></label>
                    <input type="range" id="edit-material-metalness" min="0" max="1" step="0.01" value="${material.metalness}">
                </div>
                <div class="property-group">
                    <label>Roughness: <span id="edit-roughness-value">${material.roughness.toFixed(2)}</span></label>
                    <input type="range" id="edit-material-roughness" min="0" max="1" step="0.01" value="${material.roughness}">
                </div>
                <div class="property-group">
                    <label>Opacity: <span id="edit-opacity-value">${material.opacity.toFixed(2)}</span></label>
                    <input type="range" id="edit-material-opacity" min="0" max="1" step="0.01" value="${material.opacity}">
                </div>
                <div class="property-group">
                    <label>Texture Type:</label>
                    <select id="edit-material-texture" class="material-dropdown-wrapper" style="width:100%">
                        <option value="" ${!material.textureType ? 'selected' : ''}>None (Standard PBR)</option>
                        <option value="grass" ${material.textureType === 'grass' ? 'selected' : ''}>Grass</option>
                        <option value="dirt" ${material.textureType === 'dirt' ? 'selected' : ''}>Dirt</option>
                        <option value="stone" ${material.textureType === 'stone' ? 'selected' : ''}>Stone</option>
                        <option value="wood" ${material.textureType === 'wood' ? 'selected' : ''}>Wood</option>
                        <option value="brick" ${material.textureType === 'brick' ? 'selected' : ''}>Brick</option>
                        <option value="sand" ${material.textureType === 'sand' ? 'selected' : ''}>Sand</option>
                        <option value="water" ${material.textureType === 'water' ? 'selected' : ''}>Water</option>
                        <option value="cobblestone" ${material.textureType === 'cobblestone' ? 'selected' : ''}>Cobblestone</option>
                        <option value="roof" ${material.textureType === 'roof' ? 'selected' : ''}>Roof</option>
                        <option value="snow" ${material.textureType === 'snow' ? 'selected' : ''}>Snow</option>
                    </select>
                </div>
            </div>
            <div class="dialog-actions">
                <button class="btn" id="cancel-edit-material">Cancel</button>
                <button class="btn primary" id="save-edit-material">Save</button>
            </div>
        `;

        // Update value displays
        dialog.querySelector('#edit-material-metalness').addEventListener('input', (e) => {
            dialog.querySelector('#edit-metalness-value').textContent = parseFloat(e.target.value).toFixed(2);
        });
        dialog.querySelector('#edit-material-roughness').addEventListener('input', (e) => {
            dialog.querySelector('#edit-roughness-value').textContent = parseFloat(e.target.value).toFixed(2);
        });
        dialog.querySelector('#edit-material-opacity').addEventListener('input', (e) => {
            dialog.querySelector('#edit-opacity-value').textContent = parseFloat(e.target.value).toFixed(2);
        });

        document.body.appendChild(dialog);

        // Add event listeners
        dialog.querySelector('.close-dialog-btn').addEventListener('click', () => dialog.remove());
        dialog.querySelector('#cancel-edit-material').addEventListener('click', () => dialog.remove());
        dialog.querySelector('#save-edit-material').addEventListener('click', () => {
            // Save changes
            const colorInput = dialog.querySelector('#edit-material-color');
            const metalnessInput = dialog.querySelector('#edit-material-metalness');
            const roughnessInput = dialog.querySelector('#edit-material-roughness');
            const opacityInput = dialog.querySelector('#edit-material-opacity');
            const textureInput = dialog.querySelector('#edit-material-texture');

            // Parse color
            let colorValue = colorInput.value;
            if (colorValue.startsWith('#')) {
                colorValue = parseInt(colorValue.substring(1), 16);
            }

            material.color = colorValue;
            material.metalness = parseFloat(metalnessInput.value);
            material.roughness = parseFloat(roughnessInput.value);
            material.opacity = parseFloat(opacityInput.value);
            material.textureType = textureInput.value || null;
            material.isPixelTexture = material.textureType !== null;

            // Update all objects using this material
            material.objectsUsing.forEach(obj => {
                if (obj.userData.type === 'figure' || obj.isGroup) {
                    obj.traverse(c => {
                        if (c.isMesh) {
                            this._applyMaterialToMesh(c, material);
                        }
                    });
                } else if (obj.isMesh && obj.material) {
                    this._applyMaterialToMesh(obj, material);
                }
            });

            dialog.remove();
            this.render();
            if (this.app && this.app.notifications) {
                this.app.notifications.show('Material updated successfully!', 'success');
            } else if (window.notifications) {
                window.notifications.show('Material updated successfully!', 'success');
            }
        });
    }

    deleteMaterial(material) {
        // Check if material is used by objects
        if (material.objectsUsing && material.objectsUsing.length > 0) {
            // Get object names for the warning
            const objectNames = material.objectsUsing.map(obj => obj.userData.name || obj.userData.type || 'unnamed').join(', ');
            const confirmDelete = confirm(`Warning: This material is currently used by ${material.objectsUsing.length} object(s):\n${objectNames}\n\nDeleting will remove the material from these objects. Continue?`);
            if (!confirmDelete) return;
        }

        const index = this.materials.indexOf(material);
        if (index > -1) {
            // Remove this material from all objects using it
            if (material.objectsUsing) {
                material.objectsUsing.forEach(obj => {
                    if (obj.userData.currentMaterialId === material.id) {
                        delete obj.userData.currentMaterialId;
                    }
                });
            }
            
            this.materials.splice(index, 1);
            if (this.selectedMaterial === material) {
                this.selectedMaterial = null;
            }
            this.render();
        }
    }

    // Apply material to object directly by ID or reference
    applyMaterialToObject(obj, materialOrId) {
        let material = materialOrId;
        if (typeof materialOrId === 'string') {
            material = this.materials.find(m => m.id === materialOrId);
        }
        if (!material || !obj) return;

        if (obj.isGroup) {
            obj.traverse(c => {
                if (c.isMesh) this._applyMaterialToMesh(c, material);
            });
        } else if (obj.isMesh) {
            this._applyMaterialToMesh(obj, material);
        }

        if (!material.objectsUsing.includes(obj)) {
            material.objectsUsing.push(obj);
        }
    }

    // Get material by ID
    getMaterial(id) {
        return this.materials.find(m => m.id === id);
    }

    // Get material by name
    getMaterialByName(name) {
        return this.materials.find(m => m.name === name);
    }

    // Render materials for the materials section (full view)
    renderMaterialsSection() {
        if (!this.materialsSectionContainer) return;

        const materialsContent = this.materialsSectionContainer.querySelector('.panel-content');
        if (!materialsContent) return;

        materialsContent.innerHTML = '';

        // Render each material with more details
        this.materials.forEach(material => {
            const materialEl = document.createElement('div');
            materialEl.className = 'material-item-full';
            materialEl.dataset.materialId = material.id;
            if (this.selectedMaterial === material) {
                materialEl.classList.add('selected');
            }

            materialEl.innerHTML = `
                <div class="material-preview-full" style="background-color: #${material.color.toString(16).padStart(6, '0')}" title="Used by: ${material.objectsUsing.length} objects"></div>
                <div class="material-info-full">
                    <input type="text" class="material-name-full" value="${material.name}">
                    <div class="material-properties-full">
                        <span>M: ${material.metalness.toFixed(2)}</span>
                        <span>R: ${material.roughness.toFixed(2)}</span>
                        <span>O: ${material.opacity.toFixed(2)}</span>
                        ${material.textureType ? `<span>T: ${material.textureType}</span>` : ''}
                    </div>
                </div>
                <div class="material-actions-full">
                    <button class="btn apply-material-btn" title="Apply to Selected"><i class="fas fa-check"></i></button>
                    <button class="btn edit-material-btn" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="btn delete-material-btn" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            `;

            // Add event listeners (same as render())
            materialEl.addEventListener('click', (e) => {
                if (e.target.classList.contains('material-name-full') ||
                    e.target.classList.contains('apply-material-btn') ||
                    e.target.classList.contains('edit-material-btn') ||
                    e.target.classList.contains('delete-material-btn')) {
                    return;
                }
                this.selectMaterial(material);
            });

            const nameInput = materialEl.querySelector('.material-name-full');
            nameInput.addEventListener('change', (e) => {
                material.name = e.target.value;
            });
            nameInput.addEventListener('click', (e) => e.stopPropagation());

            materialEl.querySelector('.apply-material-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.applyMaterialToSelected(material);
            });

            materialEl.querySelector('.edit-material-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.editMaterial(material);
            });

            materialEl.querySelector('.delete-material-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteMaterial(material);
            });

            materialsContent.appendChild(materialEl);
        });
    }
}

export { MaterialsManager };