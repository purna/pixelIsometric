/**
 * DOM Management for Isometric 3D Editor
 */
function initDOM() {
    const UI = {};

    UI.container = document.getElementById('container');
    UI.sceneContainer = document.getElementById('scene-container');
    UI.sidebar = document.getElementById('sidebar');
    UI.infoDisplay = document.getElementById('info');

// Header action buttons
     UI.settingsBtn = document.getElementById('settings-btn');
     UI.saveBtn = document.getElementById('save-btn');
     UI.loadBtn = document.getElementById('load-btn');
     UI.mode2d3dBtn = document.getElementById('mode-2d-3d');

    // Settings modal elements
    UI.settingsModal = document.getElementById('settings-modal');
    UI.closeSettingsBtn = document.getElementById('close-settings-btn');
    UI.saveSettingsBtn = document.getElementById('save-settings-btn');
    UI.settingShowGrid = document.getElementById('setting-show-grid');
    UI.settingShowAxes = document.getElementById('setting-show-axes');
    UI.settingAutoSave = document.getElementById('setting-auto-save');
    UI.settingClearState = document.getElementById('setting-clear-state');
    UI.settingBgColor = document.getElementById('setting-bg-color'); // in modal
    UI.settingTheme = document.getElementById('setting-theme'); // in modal
    UI.settingBrightness = document.getElementById('setting-brightness'); // in modal
    UI.settingTerrainHeight = document.getElementById('setting-terrain-height'); // in modal
    UI.settingMaterialDownloadSize = document.getElementById('setting-material-download-size');
    UI.settingShowOutlines = document.getElementById('setting-show-outlines');
    UI.settingIncludeColliders = document.getElementById('setting-include-colliders');
    UI.settingColliderType = document.getElementById('setting-collider-type');

    // Scene elements
    UI.cameraPositionDisplay = document.getElementById('floating-camera-position');
    UI.backgroundColorPicker = document.getElementById('background-color');
    UI.gradientColor1Picker = document.getElementById('gradient-color1');
    UI.gradientColor2Picker = document.getElementById('gradient-color2');
    UI.themeSelector = document.getElementById('theme-selector');
    UI.brightnessAdjustSlider = document.getElementById('brightness-adjust');
    UI.brightnessValueDisplay = document.getElementById('brightness-value');
    UI.backgroundImageUrlInput = document.getElementById('background-image-url');
    UI.applyImageBackgroundBtn = document.getElementById('setting-apply-bg-image');
    UI.fogColorPicker = document.getElementById('fog-color');
    UI.fogNearSlider = document.getElementById('fog-near');
    UI.fogFarSlider = document.getElementById('fog-far');
    UI.fogNearValueDisplay = document.getElementById('fog-near-value');
    UI.fogFarValueDisplay = document.getElementById('fog-far-value');

     // Object creation buttons
     UI.addCubeBtn = document.getElementById('add-cube');
     UI.addRampBtn = document.getElementById('add-ramp');
     UI.addTerrainBtn = document.getElementById('add-terrain');
     UI.addWallBtn = document.getElementById('add-wall');
     UI.addBuildingBtn = document.getElementById('add-building');
     UI.addPathBtn = document.getElementById('add-path');
     UI.addRiverBtn = document.getElementById('add-river');
     UI.addTopBtn = document.getElementById('add-top');
     UI.addLeftBtn = document.getElementById('add-left');
     UI.addRightBtn = document.getElementById('add-right');
     UI.addLineBtn = document.getElementById('add-line');
     UI.clearSceneBtn = document.getElementById('clear-scene');

    // Paint buttons
    UI.paintGrassBtn = document.getElementById('paint-grass');
    UI.paintDirtBtn = document.getElementById('paint-dirt');
    UI.paintStoneBtn = document.getElementById('paint-stone');
    UI.paintWaterBtn = document.getElementById('paint-water');
    UI.paintSandBtn = document.getElementById('paint-sand');

    // Export buttons
    UI.exportObjBtn = document.getElementById('export-obj');
    UI.exportStlBtn = document.getElementById('export-stl');
    UI.exportUnityBtn = document.getElementById('export-unity');
    UI.includeCollidersCheckbox = document.getElementById('setting-include-colliders');
    UI.colliderTypeSelect = document.getElementById('collider-type');

    // Movement
    UI.moveUpBtn = document.getElementById('move-up');
    UI.moveDownBtn = document.getElementById('move-down');
    UI.moveLeftBtn = document.getElementById('move-left');
    UI.moveRightBtn = document.getElementById('move-right');
    UI.moveLeftDownBtn = document.getElementById('move-left-down');
    UI.moveRightUpBtn = document.getElementById('move-right-up');

    // Camera
    UI.resetCameraBtn = document.getElementById('floating-reset-camera');
    UI.rotateCwBtn = document.getElementById('floating-rotate-cw');
    UI.rotateCcwBtn = document.getElementById('floating-rotate-ccw');

    // Scene controls
    UI.applyGradientVerticalBtn = document.getElementById('apply-gradient-vertical');
    UI.applyGradientHorizontalBtn = document.getElementById('apply-gradient-horizontal');
    UI.applyThemeBtn = document.getElementById('setting-apply-theme');
    UI.cycleThemesBtn = document.getElementById('cycle-themes');
    UI.adjustBrightnessBtn = document.getElementById('adjust-brightness');
    UI.toggleGridBtn = document.getElementById('toggle-grid');
    UI.toggleAxesBtn = document.getElementById('toggle-axes');
    UI.applyFogBtn = document.getElementById('apply-fog');
    UI.removeFogBtn = document.getElementById('setting-remove-fog');
    UI.resetBackgroundBtn = document.getElementById('reset-background'); // This one is correct

    // Terrain height
    UI.terrainHeightSlider = document.getElementById('terrain-height');
    UI.terrainHeightValue = document.getElementById('terrain-height-value');

    // Object selection
    UI.objectSelectDropdown = document.getElementById('object-select');

    // Material selector (moved to properties panel)
    UI.materialSelectorBtn = document.getElementById('material-selector-btn');
    UI.materialDropdownList = document.getElementById('material-dropdown-list');
    UI.selectedMaterialText = document.querySelector('#material-selector-btn .selected-material-text');

    // Material Builder
    UI.materialBuilderCanvas = document.getElementById('material-builder-canvas');
    UI.builderColA = document.getElementById('colA');
    UI.builderColB = document.getElementById('colB');
    UI.builderSwA = document.getElementById('topColRow');
    UI.builderSwB = document.getElementById('botColRow');
    UI.builderSplit = document.getElementById('split');
    UI.builderSplitV = document.querySelector('#splitRow .value-display');
    UI.builderRot = document.getElementById('rot');
    UI.builderRotV = document.getElementById('rotV');
    UI.builderOutlineSeg = document.getElementById('outlineSeg');
    UI.builderTDitherMode    = document.getElementById('tMode');
    UI.builderTDitherInkMode = document.getElementById('tInkMode');
    UI.builderTDitherBright  = document.getElementById('tBright');
    UI.builderTDitherBrightRow = document.getElementById('tBrightRow');
    UI.builderTDitherInkCol  = document.getElementById('tInkCol');
    UI.builderTDitherInkColRow = document.getElementById('tColorRow');
    UI.builderTDitherSpace   = document.getElementById('tSpace');
    UI.builderTDitherThick   = document.getElementById('tThick');
    UI.builderTDitherAlpha   = document.getElementById('tAlpha');
    UI.builderTDitherSpaceV  = document.querySelector('#tSpace ~ .value-display');
    UI.builderTDitherThickV  = document.querySelector('#tThick ~ .value-display');
    UI.builderTDitherBrightV = document.querySelector('#tBright ~ .value-display');
    UI.builderTDitherAlphaV  = document.querySelector('#tAlpha ~ .value-display');
    UI.builderBDitherMode    = document.getElementById('bMode');
    UI.builderBDitherInkMode = document.getElementById('bInkMode');
    UI.builderBDitherBright  = document.getElementById('bBright');
    UI.builderBDitherBrightRow = document.getElementById('bBrightRow');
    UI.builderBDitherInkCol  = document.getElementById('bInkCol');
    UI.builderBDitherInkColRow = document.getElementById('bColorRow');
    UI.builderBDitherSpace   = document.getElementById('bSpace');
    UI.builderBDitherThick   = document.getElementById('bThick');
    UI.builderBDitherAlpha   = document.getElementById('bAlpha');
    UI.builderBDitherSpaceV  = document.querySelector('#bSpace ~ .value-display');
    UI.builderBDitherThickV  = document.querySelector('#bThick ~ .value-display');
    UI.builderBDitherBrightV = document.querySelector('#bBright ~ .value-display');
    UI.builderBDitherAlphaV  = document.querySelector('#bAlpha ~ .value-display');
    UI.builderSave = document.getElementById('builder-save-texture');
    UI.builderDownload = document.getElementById('builder-download');
    UI.builderTextureName = document.getElementById('texture-name-input');
    UI.builderMaterialMode = document.getElementById('adv-materialMode');
    UI.builderGlobalOpacityRow = document.getElementById('adv-globalOpacityRow');
    UI.builderBaseColRow = document.getElementById('adv-baseColRow');
    UI.builderTopColRow = document.getElementById('adv-topColRow');
    UI.builderBotColRow = document.getElementById('adv-botColRow');
    UI.builderSplitRow = document.getElementById('adv-splitRow');
    UI.builderBottomDitherSection = document.getElementById('adv-bottomDitherSection');

    // Properties
    UI.propertiesPanel = document.getElementById('properties-panel');
    UI.objectColorPicker = document.getElementById('object-color');
    UI.objectScaleXSlider = document.getElementById('object-scale-x');
    UI.objectScaleYSlider = document.getElementById('object-scale-y');
    UI.objectScaleZSlider = document.getElementById('object-scale-z');
    UI.objectRotationYSlider = document.getElementById('object-rotation-y');
    UI.objectZindexSlider = document.getElementById('object-zindex');
    UI.objectScaleXValue = document.getElementById('object-scale-x-value');
    UI.objectScaleYValue = document.getElementById('object-scale-y-value');
    UI.objectScaleZValue = document.getElementById('object-scale-z-value');
    UI.objectRotationYValue = document.getElementById('object-rotation-y-value');
    UI.objectZindexValue = document.getElementById('object-zindex-value');

    // Properties-panel material selector (per-object)
    UI.propMaterialBtn      = document.getElementById('prop-material-btn');
    UI.propMaterialDropdown = document.getElementById('prop-material-dropdown');
    UI.propMaterialText     = document.getElementById('prop-material-text');
    UI.currentMaterialName  = document.getElementById('current-material-name');

    // Scene objects list
    UI.sceneObjectsList = document.getElementById('scene-objects-list');

    // Layers
    UI.layersList = document.getElementById('layers-list');
    UI.layerNameInput = document.getElementById('layer-name');
    UI.addLayerBtn = document.getElementById('add-layer');
    UI.currentLayerDropdown = document.getElementById('current-layer');
    UI.toggleCollidersBtn = document.getElementById('toggle-colliders-btn');
    UI.ghostModeBtn = document.getElementById('ghost-mode-btn');

    // Tutorial settings
    UI.settingEnableTutorial = document.getElementById('setting-enable-tutorial');
    UI.settingStartTutorial = document.getElementById('setting-start-tutorial');

    console.log('DOM initialized successfully');
    return UI;
};

export { initDOM };
