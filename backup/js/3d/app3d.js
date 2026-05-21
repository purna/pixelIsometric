function initMaterialsUI() {
    // Initialize material selector dropdown (layers panel)
    if (UI.materialSelectorBtn && UI.materialDropdownList) {
        // Toggle dropdown
        UI.materialSelectorBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            UI.materialDropdownList.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!UI.materialSelectorBtn.contains(e.target) && !UI.materialDropdownList.contains(e.target)) {
                UI.materialDropdownList.classList.remove('show');
            }
        });

        // Populate material list
        function populateMaterialsList() {
            UI.materialDropdownList.innerHTML = '';
            if (!materialsManager) return;

            materialsManager.materials.forEach(material => {
                const item = document.createElement('div');
                item.className = 'material-dropdown-item' + (material === materialsManager.selectedMaterial ? ' selected' : '');
                item.innerHTML = `
                    <span class="material-color-swatch" style="background-color: #${material.color.toString(16).padStart(6, '0')}"></span>
                    <span class="material-option-text">${material.name}</span>
                `;
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Apply material to selected object
                    if (selectedObject) {
                        materialsManager.applyMaterialToSelected(material);
                    } else {
                        materialsManager.applyMaterialToObject(objects[0], material);
                    }
                    UI.selectedMaterialText.textContent = material.name;
                    UI.materialDropdownList.classList.remove('show');
                    materialsManager.selectedMaterial = material;
                    populateMaterialsList();
                });
                UI.materialDropdownList.appendChild(item);
            });
        }

        // Initial population
        populateMaterialsList();

        // Re-populate when materials change
        const originalRender = materialsManager.render.bind(materialsManager);
        materialsManager.render = function() {
            originalRender();
            populateMaterialsList();
        };
    }

    // Initialize properties panel material selector
    if (UI.propMaterialBtn && UI.propMaterialDropdown) {
        // Toggle dropdown
        UI.propMaterialBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            UI.propMaterialDropdown.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!UI.propMaterialBtn.contains(e.target) && !UI.propMaterialDropdown.contains(e.target)) {
                UI.propMaterialDropdown.classList.remove('show');
            }
        });

        // Populate properties panel material list
        function populatePropMaterialsList() {
            UI.propMaterialDropdown.innerHTML = '';
            if (!materialsManager) return;

            materialsManager.materials.forEach(material => {
                const item = document.createElement('div');
                item.className = 'material-dropdown-item' + (material === materialsManager.selectedMaterial ? ' selected' : '');
                item.innerHTML = `
                    <span class="material-color-swatch" style="background-color: #${material.color.toString(16).padStart(6, '0')}"></span>
                    <span class="material-option-text">${material.name}</span>
                `;
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Apply material to selected object
                    if (selectedObject) {
                        materialsManager.applyMaterialToSelected(material);
                    }
                    UI.propMaterialText.textContent = material.name;
                    // Also update the current material name in the properties panel
                    if (UI.currentMaterialName) {
                        UI.currentMaterialName.textContent = material.name;
                    }
                    UI.propMaterialDropdown.classList.remove('show');
                    materialsManager.selectedMaterial = material;
                    populatePropMaterialsList();
                });
                UI.propMaterialDropdown.appendChild(item);
            });
        }

        // Initial population
        populatePropMaterialsList();

        // Re-populate when materials change - we'll override the render method below if not already overridden
        // If materialsManager.render was already overridden by the layers panel setup, we need to chain
        // Instead, we'll create a combined override later
    }

    // If we have both dropdowns, we need to override render to update both
    // If we have only one, the existing override (if any) is sufficient
    // We'll check if we've already overridden render (from layers panel) and if so, we'll chain
    // Otherwise, we'll set up a new override that updates both

    // Pixel effect controls
    const pixelEffectEnabled = document.getElementById('pixel-effect-enabled');
    const pixelEffectsControls = document.getElementById('pixel-effects-controls');
    const pixelSizeSlider = document.getElementById('pixel-size');
    const pixelSizeValue = document.getElementById('pixel-size-value');
    const pixelCRTEffect = document.getElementById('pixel-crt-effect');
    const pixelScanlinesEffect = document.getElementById('pixel-scanlines-effect');
    const pixelNoiseEffect = document.getElementById('pixel-noise-effect');

    if (pixelEffectEnabled && pixelEffectsControls) {
        pixelEffectEnabled.addEventListener('change', (e) => {
            if (pixelPostProcessor) {
                pixelPostProcessor.enabled = e.target.checked;
                pixelEffectsControls.style.display = e.target.checked ? 'block' : 'none';
            }
        });
    }

    if (pixelSizeSlider && pixelSizeValue && pixelPostProcessor) {
        pixelSizeSlider.addEventListener('input', (e) => {
            const size = parseInt(e.target.value);
            pixelSizeValue.textContent = size;
            pixelPostProcessor.setPixelSize(size);
        });
    }

    if (pixelCRTEffect && pixelPostProcessor) {
        pixelCRTEffect.addEventListener('change', (e) => {
            pixelPostProcessor.toggleEffect('crt', e.target.checked);
        });
    }

    if (pixelScanlinesEffect && pixelPostProcessor) {
        pixelScanlinesEffect.addEventListener('change', (e) => {
            pixelPostProcessor.toggleEffect('scanlines', e.target.checked);
        });
    }

    if (pixelNoiseEffect && pixelPostProcessor) {
        pixelNoiseEffect.addEventListener('change', (e) => {
            pixelPostProcessor.toggleEffect('noise', e.target.checked);
        });
    }

    // Material Builder UI wiring
    _wireMaterialBuilderUI();
}