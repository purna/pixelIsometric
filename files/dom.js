/**
 * DOM Management for Isometric 3D Editor
 *
 * Improvements over original:
 *  - Element lookups are now wrapped in a helper that warns (not silently returns
 *    undefined) when an expected element is missing. Helps catch HTML/JS drift early.
 *  - Elements are grouped into logical namespaces on the returned UI object,
 *    making call-sites more readable: UI.header.saveBtn, UI.properties.colorPicker, etc.
 *  - The flat UI object is still fully populated for backward compatibility.
 */

function initDOM() {
    /**
     * Wraps getElementById and logs a warning when an element is missing.
     * Returns null (same as the native API) so callers can optional-chain safely.
     */
    function el(id) {
        const node = document.getElementById(id);
        if (!node) console.warn(`[initDOM] Missing element: #${id}`);
        return node;
    }

    /**
     * querySelector wrapper with the same guard.
     */
    function qs(selector) {
        const node = document.querySelector(selector);
        if (!node) console.warn(`[initDOM] Missing element: "${selector}"`);
        return node;
    }

    const UI = {};

    // ── Root containers ───────────────────────────────────────────────────────
    UI.container       = el('container');
    UI.sceneContainer  = el('scene-container');
    UI.sidebar         = el('sidebar');
    UI.infoDisplay     = el('info');

    // ── Header action buttons ─────────────────────────────────────────────────
    UI.settingsBtn     = el('settings-btn');
    UI.saveBtn         = el('save-btn');
    UI.loadBtn         = el('load-btn');
    UI.mode2d3dBtn     = el('mode-2d-3d');

    // ── Settings modal ────────────────────────────────────────────────────────
    UI.settingsModal              = el('settings-modal');
    UI.closeSettingsBtn           = el('close-settings-btn');
    UI.saveSettingsBtn            = el('save-settings-btn');
    UI.settingShowGrid            = el('setting-show-grid');
    UI.settingShowAxes            = el('setting-show-axes');
    UI.settingAutoSave            = el('setting-auto-save');
    UI.settingClearState          = el('setting-clear-state');
    UI.settingBgColor             = el('setting-bg-color');
    UI.settingTheme               = el('setting-theme');
    UI.settingBrightness          = el('setting-brightness');
    UI.settingTerrainHeight       = el('setting-terrain-height');
    UI.settingMaterialDownloadSize = el('setting-material-download-size');
    UI.settingShowOutlines        = el('setting-show-outlines');
    UI.settingIncludeColliders    = el('setting-include-colliders');
    UI.settingColliderType        = el('setting-collider-type');
    UI.settingEnableTutorial      = el('setting-enable-tutorial');
    UI.settingStartTutorial       = el('setting-start-tutorial');

    // ── Scene / background controls ───────────────────────────────────────────
    UI.cameraPositionDisplay      = el('camera-position');
    UI.backgroundColorPicker      = el('background-color');
    UI.gradientColor1Picker       = el('gradient-color1');
    UI.gradientColor2Picker       = el('gradient-color2');
    UI.themeSelector              = el('theme-selector');
    UI.brightnessAdjustSlider     = el('brightness-adjust');
    UI.brightnessValueDisplay     = el('brightness-value');
    UI.backgroundImageUrlInput    = el('background-image-url');
    UI.applyImageBackgroundBtn    = el('apply-image-background');
    UI.fogColorPicker             = el('fog-color');
    UI.fogNearSlider              = el('fog-near');
    UI.fogFarSlider               = el('fog-far');
    UI.fogNearValueDisplay        = el('fog-near-value');
    UI.fogFarValueDisplay         = el('fog-far-value');

    // ── Object creation buttons ───────────────────────────────────────────────
    UI.addCubeBtn      = el('add-cube');
    UI.addSphereBtn    = el('add-sphere');
    UI.addCylinderBtn  = el('add-cylinder');
    UI.addRampBtn      = el('add-ramp');
    UI.addTerrainBtn   = el('add-terrain');
    UI.addWallBtn      = el('add-wall');
    UI.addBuildingBtn  = el('add-building');
    UI.addPathBtn      = el('add-path');
    UI.addRiverBtn     = el('add-river');
    UI.addTopBtn       = el('add-top');
    UI.addLeftBtn      = el('add-left');
    UI.addRightBtn     = el('add-right');
    UI.addLineBtn      = el('add-line');
    UI.clearSceneBtn   = el('clear-scene');

    // ── Paint buttons ─────────────────────────────────────────────────────────
    UI.paintGrassBtn   = el('paint-grass');
    UI.paintDirtBtn    = el('paint-dirt');
    UI.paintStoneBtn   = el('paint-stone');
    UI.paintWaterBtn   = el('paint-water');
    UI.paintSandBtn    = el('paint-sand');

    // ── Export buttons ────────────────────────────────────────────────────────
    UI.exportObjBtn           = el('export-obj');
    UI.exportStlBtn           = el('export-stl');
    UI.exportUnityBtn         = el('export-unity');
    UI.includeCollidersCheckbox = el('include-colliders');
    UI.colliderTypeSelect     = el('collider-type');

    // ── Floating movement panel ───────────────────────────────────────────────
    UI.floatingMoveLeftBtn      = el('floating-move-left');
    UI.floatingMoveUpBtn        = el('floating-move-up');
    UI.floatingMoveRightUpBtn   = el('floating-move-right-up');
    UI.floatingMoveLeftDownBtn  = el('floating-move-left-down');
    UI.floatingMoveDownBtn      = el('floating-move-down');
    UI.floatingMoveRightBtn     = el('floating-move-right');

    // ── Camera ────────────────────────────────────────────────────────────────
    UI.resetCameraBtn  = el('reset-camera');
    UI.rotateCwBtn     = el('rotate-cw');
    UI.rotateCcwBtn    = el('rotate-ccw');

    // ── Scene controls ────────────────────────────────────────────────────────
    UI.applyGradientVerticalBtn   = el('apply-gradient-vertical');
    UI.applyGradientHorizontalBtn = el('apply-gradient-horizontal');
    UI.applyThemeBtn              = el('apply-theme');
    UI.cycleThemesBtn             = el('cycle-themes');
    UI.adjustBrightnessBtn        = el('adjust-brightness');
    UI.toggleGridBtn              = el('toggle-grid');
    UI.toggleAxesBtn              = el('toggle-axes');
    UI.applyFogBtn                = el('apply-fog');
    UI.removeFogBtn               = el('remove-fog');
    UI.resetBackgroundBtn         = el('reset-background');

    // ── Terrain height ────────────────────────────────────────────────────────
    UI.terrainHeightSlider = el('terrain-height');
    UI.terrainHeightValue  = el('terrain-height-value');

    // ── Object selection ──────────────────────────────────────────────────────
    UI.objectSelectDropdown = el('object-select');

    // ── Material selector (sidebar) ───────────────────────────────────────────
    UI.materialSelectorBtn   = el('material-selector-btn');
    UI.materialDropdownList  = el('material-dropdown-list');
    UI.selectedMaterialText  = qs('#material-selector-btn .selected-material-text');

    // ── Material Builder ──────────────────────────────────────────────────────
    UI.materialBuilderCanvas   = el('material-builder-canvas');
    UI.builderColA             = el('builder-colA');
    UI.builderColB             = el('builder-colB');
    UI.builderSwA              = el('builder-swA');
    UI.builderSwB              = el('builder-swB');
    UI.builderSplit            = el('builder-split');
    UI.builderSplitV           = el('builder-splitV');
    UI.builderRot              = el('builder-rot');
    UI.builderRotV             = el('builder-rotV');
    UI.builderOutlineSeg       = el('builder-outlineSeg');
    UI.builderTDitherMode      = el('builder-tDitherMode');
    UI.builderTDitherSpace     = el('builder-tDitherSpace');
    UI.builderTDitherThick     = el('builder-tDitherThick');
    UI.builderTDitherBright    = el('builder-tDitherBright');
    UI.builderTDitherAlpha     = el('builder-tDitherAlpha');
    UI.builderTDitherSpaceV    = el('builder-tDitherSpaceV');
    UI.builderTDitherThickV    = el('builder-tDitherThickV');
    UI.builderTDitherBrightV   = el('builder-tDitherBrightV');
    UI.builderTDitherAlphaV    = el('builder-tDitherAlphaV');
    UI.builderBDitherMode      = el('builder-bDitherMode');
    UI.builderBDitherSpace     = el('builder-bDitherSpace');
    UI.builderBDitherThick     = el('builder-bDitherThick');
    UI.builderBDitherBright    = el('builder-bDitherBright');
    UI.builderBDitherAlpha     = el('builder-bDitherAlpha');
    UI.builderBDitherSpaceV    = el('builder-bDitherSpaceV');
    UI.builderBDitherThickV    = el('builder-bDitherThickV');
    UI.builderBDitherBrightV   = el('builder-bDitherBrightV');
    UI.builderBDitherAlphaV    = el('builder-bDitherAlphaV');
    UI.builderSave             = el('builder-save');
    UI.builderDownload         = el('builder-download');

    // ── Properties panel ──────────────────────────────────────────────────────
    UI.propertiesPanel        = el('properties-panel');
    UI.objectColorPicker      = el('object-color');
    UI.objectScaleXSlider     = el('object-scale-x');
    UI.objectScaleYSlider     = el('object-scale-y');
    UI.objectScaleZSlider     = el('object-scale-z');
    UI.objectRotationYSlider  = el('object-rotation-y');
    UI.objectZindexSlider     = el('object-zindex');
    UI.objectScaleXValue      = el('object-scale-x-value');
    UI.objectScaleYValue      = el('object-scale-y-value');
    UI.objectScaleZValue      = el('object-scale-z-value');
    UI.objectRotationYValue   = el('object-rotation-y-value');
    UI.objectZindexValue      = el('object-zindex-value');

    // ── Properties-panel material selector ───────────────────────────────────
    UI.propMaterialBtn      = el('prop-material-btn');
    UI.propMaterialDropdown = el('prop-material-dropdown');
    UI.propMaterialText     = el('prop-material-text');
    UI.currentMaterialName  = el('current-material-name');

    // ── Scene objects list ────────────────────────────────────────────────────
    UI.sceneObjectsList = el('scene-objects-list');

    // ── Layers ───────────────────────────────────────────────────────────────
    UI.layersList           = el('layers-list');
    UI.layerNameInput       = el('layer-name');
    UI.addLayerBtn          = el('add-layer');
    UI.currentLayerDropdown = el('current-layer');
    UI.toggleCollidersBtn   = el('toggle-colliders-btn');
    UI.ghostModeBtn         = el('ghost-mode-btn');

    // ── Logical namespaces (convenience aliases — all point to the same nodes) ─
    UI.header = {
        settingsBtn: UI.settingsBtn,
        saveBtn:     UI.saveBtn,
        loadBtn:     UI.loadBtn,
        mode2d3dBtn: UI.mode2d3dBtn,
    };

    UI.properties = {
        panel:           UI.propertiesPanel,
        colorPicker:     UI.objectColorPicker,
        scaleX:          UI.objectScaleXSlider,
        scaleY:          UI.objectScaleYSlider,
        scaleZ:          UI.objectScaleZSlider,
        rotationY:       UI.objectRotationYSlider,
        zIndex:          UI.objectZindexSlider,
        scaleXValue:     UI.objectScaleXValue,
        scaleYValue:     UI.objectScaleYValue,
        scaleZValue:     UI.objectScaleZValue,
        rotationYValue:  UI.objectRotationYValue,
        zIndexValue:     UI.objectZindexValue,
        materialBtn:     UI.propMaterialBtn,
        materialDropdown:UI.propMaterialDropdown,
        materialText:    UI.propMaterialText,
        materialName:    UI.currentMaterialName,
    };

    UI.scene = {
        cameraPosition:      UI.cameraPositionDisplay,
        backgroundColor:     UI.backgroundColorPicker,
        gradientColor1:      UI.gradientColor1Picker,
        gradientColor2:      UI.gradientColor2Picker,
        themeSelector:       UI.themeSelector,
        brightnessSlider:    UI.brightnessAdjustSlider,
        brightnessValue:     UI.brightnessValueDisplay,
        bgImageUrl:          UI.backgroundImageUrlInput,
        applyImageBg:        UI.applyImageBackgroundBtn,
        fogColor:            UI.fogColorPicker,
        fogNear:             UI.fogNearSlider,
        fogFar:              UI.fogFarSlider,
        fogNearValue:        UI.fogNearValueDisplay,
        fogFarValue:         UI.fogFarValueDisplay,
        terrainHeight:       UI.terrainHeightSlider,
        terrainHeightValue:  UI.terrainHeightValue,
        resetCamera:         UI.resetCameraBtn,
        rotateCw:            UI.rotateCwBtn,
        rotateCcw:           UI.rotateCcwBtn,
        toggleGrid:          UI.toggleGridBtn,
        toggleAxes:          UI.toggleAxesBtn,
    };

    console.log('[initDOM] DOM initialized successfully');
    return UI;
}

export { initDOM };
