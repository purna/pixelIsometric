/**
 * DOM Management for Isometric 3D Editor
 * Centralized DOM element references and initialization
 */

// 1. Define UI object with initial null references
const UI = {
    // Main container elements
    container: null,
    sceneContainer: null,
    sidebar: null,
    infoDisplay: null,

    // Scene elements
    cameraPositionDisplay: null,
    backgroundColorPicker: null,
    gradientColor1Picker: null,
    gradientColor2Picker: null,
    backgroundImageUrlInput: null,
    themeSelector: null,
    brightnessAdjustSlider: null,
    brightnessValueDisplay: null,
    fogColorPicker: null,
    fogNearSlider: null,
    fogFarSlider: null,
    fogNearValueDisplay: null,
    fogFarValueDisplay: null,

    // Object creation buttons
    addCubeBtn: null,
    addSphereBtn: null,
    addCylinderBtn: null,
    addRampBtn: null,
    clearSceneBtn: null,

    // Object movement buttons
    moveUpBtn: null,
    moveDownBtn: null,
    moveLeftBtn: null,
    moveRightBtn: null,
    moveLeftDownBtn: null,
    moveRightUpBtn: null,

    // Camera control buttons
    resetCameraBtn: null,
    rotateCwBtn: null,
    rotateCcwBtn: null,

    // Scene control buttons
    applyGradientVerticalBtn: null,
    applyGradientHorizontalBtn: null,
    applyImageBackgroundBtn: null,
    applyThemeBtn: null,
    cycleThemesBtn: null,
    adjustBrightnessBtn: null,
    toggleGridBtn: null,
    toggleAxesBtn: null,
    applyFogBtn: null,
    removeFogBtn: null,
    resetBackgroundBtn: null,

    // Object selection
    objectSelectDropdown: null,

    // Object properties panel
    propertiesPanel: null,
    objectColorPicker: null,
    objectScaleXSlider: null,
    objectScaleYSlider: null,
    objectScaleZSlider: null,
    objectRotationYSlider: null,
    objectZindexSlider: null,
    objectScaleXValue: null,
    objectScaleYValue: null,
    objectScaleZValue: null,
    objectRotationYValue: null,
    objectZindexValue: null,

    // Layer management
    layersList: null,
    layerNameInput: null,
    addLayerBtn: null,
    currentLayerDropdown: null,

    // Panel toggle buttons
    panelToggleButtons: null,

    // Panel content areas
    panelContents: null,

    // All buttons for event delegation
    allButtons: null,

    // All inputs for event delegation
    allInputs: null
};

// 2. Define global context variables
let sceneCanvas, rendererCanvas;

// 3. Initialization function to be called after DOMContentLoaded
const initDOM = () => {
    // Main container elements
    UI.container = document.getElementById('container');
    UI.sceneContainer = document.getElementById('scene-container');
    UI.sidebar = document.getElementById('sidebar');
    UI.infoDisplay = document.getElementById('info');

    // Scene elements
    UI.cameraPositionDisplay = document.getElementById('camera-position');
    UI.backgroundColorPicker = document.getElementById('background-color');
    UI.gradientColor1Picker = document.getElementById('gradient-color1');
    UI.gradientColor2Picker = document.getElementById('gradient-color2');
    UI.backgroundImageUrlInput = document.getElementById('background-image-url');
    UI.themeSelector = document.getElementById('theme-selector');
    UI.brightnessAdjustSlider = document.getElementById('brightness-adjust');
    UI.brightnessValueDisplay = document.getElementById('brightness-value');
    UI.fogColorPicker = document.getElementById('fog-color');
    UI.fogNearSlider = document.getElementById('fog-near');
    UI.fogFarSlider = document.getElementById('fog-far');
    UI.fogNearValueDisplay = document.getElementById('fog-near-value');
    UI.fogFarValueDisplay = document.getElementById('fog-far-value');

    // Object creation buttons
    UI.addCubeBtn = document.getElementById('add-cube');
    UI.addSphereBtn = document.getElementById('add-sphere');
    UI.addCylinderBtn = document.getElementById('add-cylinder');
    UI.addRampBtn = document.getElementById('add-ramp');
    UI.clearSceneBtn = document.getElementById('clear-scene');

    // Object movement buttons
    UI.moveUpBtn = document.getElementById('move-up');
    UI.moveDownBtn = document.getElementById('move-down');
    UI.moveLeftBtn = document.getElementById('move-left');
    UI.moveRightBtn = document.getElementById('move-right');
    UI.moveLeftDownBtn = document.getElementById('move-left-down');
    UI.moveRightUpBtn = document.getElementById('move-right-up');

    // Camera control buttons
    UI.resetCameraBtn = document.getElementById('reset-camera');
    UI.rotateCwBtn = document.getElementById('rotate-cw');
    UI.rotateCcwBtn = document.getElementById('rotate-ccw');

    // Scene control buttons
    UI.applyGradientVerticalBtn = document.getElementById('apply-gradient-vertical');
    UI.applyGradientHorizontalBtn = document.getElementById('apply-gradient-horizontal');
    UI.applyImageBackgroundBtn = document.getElementById('apply-image-background');
    UI.applyThemeBtn = document.getElementById('apply-theme');
    UI.cycleThemesBtn = document.getElementById('cycle-themes');
    UI.adjustBrightnessBtn = document.getElementById('adjust-brightness');
    UI.toggleGridBtn = document.getElementById('toggle-grid');
    UI.toggleAxesBtn = document.getElementById('toggle-axes');
    UI.applyFogBtn = document.getElementById('apply-fog');
    UI.removeFogBtn = document.getElementById('remove-fog');
    UI.resetBackgroundBtn = document.getElementById('reset-background');

    // Object selection
    UI.objectSelectDropdown = document.getElementById('object-select');

    // Object properties panel
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

    // Layer management
    UI.layersList = document.getElementById('layers-list');
    UI.layerNameInput = document.getElementById('layer-name');
    UI.addLayerBtn = document.getElementById('add-layer');
    UI.currentLayerDropdown = document.getElementById('current-layer');

    // Panel toggle buttons and contents
    UI.panelToggleButtons = document.querySelectorAll('.toggle-btn');
    UI.panelContents = document.querySelectorAll('.panel-content');

    // All buttons and inputs for event delegation
    UI.allButtons = document.querySelectorAll('button');
    UI.allInputs = document.querySelectorAll('input');

    // Get canvas contexts
    if (UI.sceneContainer && UI.sceneContainer.firstChild) {
        sceneCanvas = UI.sceneContainer.firstChild;
    }

    console.log('DOM initialized successfully');
    return UI;
};

// 4. Utility functions for DOM manipulation

/**
 * Get DOM element by ID with error handling
 * @param {string} id - Element ID
 * @returns {HTMLElement|null} DOM element or null if not found
 */
const getElement = (id) => {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`Element with ID "${id}" not found`);
    }
    return element;
};

/**
 * Create DOM element with attributes
 * @param {string} tag - HTML tag name
 * @param {Object} attributes - Element attributes
 * @param {string} content - Inner content
 * @returns {HTMLElement} Created element
 */
const createElement = (tag, attributes = {}, content = '') => {
    const element = document.createElement(tag);

    // Set attributes
    for (const [key, value] of Object.entries(attributes)) {
        element.setAttribute(key, value);
    }

    // Set content
    if (content) {
        element.innerHTML = content;
    }

    return element;
};

/**
 * Toggle element visibility
 * @param {HTMLElement} element - DOM element
 * @param {boolean} visible - Visibility state
 */
const toggleElementVisibility = (element, visible) => {
    if (element) {
        element.style.display = visible ? '' : 'none';
    }
};

/**
 * Update text content of an element
 * @param {HTMLElement} element - DOM element
 * @param {string} text - Text content
 */
const updateTextContent = (element, text) => {
    if (element) {
        element.textContent = text;
    }
};

/**
 * Update input value
 * @param {HTMLInputElement} input - Input element
 * @param {string|number} value - Value to set
 */
const updateInputValue = (input, value) => {
    if (input) {
        input.value = value;
    }
};

/**
 * Get input value
 * @param {HTMLInputElement} input - Input element
 * @returns {string|number|null} Input value or null if element not found
 */
const getInputValue = (input) => {
    return input ? input.value : null;
};

/**
 * Add event listener with error handling
 * @param {HTMLElement} element - DOM element
 * @param {string} event - Event name
 * @param {Function} callback - Callback function
 */
const addEventListener = (element, event, callback) => {
    if (element) {
        element.addEventListener(event, callback);
    } else {
        console.warn(`Cannot add event listener: element not found`);
    }
};

/**
 * Remove event listener
 * @param {HTMLElement} element - DOM element
 * @param {string} event - Event name
 * @param {Function} callback - Callback function
 */
const removeEventListener = (element, event, callback) => {
    if (element) {
        element.removeEventListener(event, callback);
    }
};

/**
 * Clear element children
 * @param {HTMLElement} element - DOM element
 */
const clearElement = (element) => {
    if (element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }
};

/**
 * Add class to element
 * @param {HTMLElement} element - DOM element
 * @param {string} className - Class name to add
 */
const addClass = (element, className) => {
    if (element) {
        element.classList.add(className);
    }
};

/**
 * Remove class from element
 * @param {HTMLElement} element - DOM element
 * @param {string} className - Class name to remove
 */
const removeClass = (element, className) => {
    if (element) {
        element.classList.remove(className);
    }
};

/**
 * Toggle class on element
 * @param {HTMLElement} element - DOM element
 * @param {string} className - Class name to toggle
 */
const toggleClass = (element, className) => {
    if (element) {
        element.classList.toggle(className);
    }
};

// 5. Export the DOM management functions
export {
    UI,
    initDOM,
    getElement,
    createElement,
    toggleElementVisibility,
    updateTextContent,
    updateInputValue,
    getInputValue,
    addEventListener,
    removeEventListener,
    clearElement,
    addClass,
    removeClass,
    toggleClass
};