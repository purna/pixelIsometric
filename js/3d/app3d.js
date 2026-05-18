// Import managers and utilities
import { CameraManager } from './cameraManager.js';
import { SceneManager } from './sceneManagerBase.js';
import { stateManager as stateManagerInstance } from '../shared/state.js';
import { ViewportManager } from './viewportManager.js';
import { FloatingMenu } from './floatingMenu.js';
import config from '../shared/config.js';
import { initDOM } from '../shared/dom.js';
import { objectManager } from './objectManager.js';
import { layerManager } from '../shared/layerManager.js';
import { MaterialsManager } from './materialsManager.js';
import { textureManager } from './textureManager.js';
import { PixelPostProcessor } from './pixelPostProcessor.js';
import { MaterialBuilder } from '../shared/materialBuilder.js';

const THREE = window.THREE;
// Global variables
let scene, camera, renderer, controls;
let objects = [];
let selectedObject = null;
let cameraManager;
let sceneManager;
let stateManager, UI;
let gridHelper, axesHelper;
let viewportManager, floatingMenu;
let materialsManager;
let textureManagerInstance;
let pixelPostProcessor;
let materialBuilder;

// Variables for drag-and-drop
let isDragging = false;
let dragStartPosition = null;
let dragStartMousePosition = null;
let draggedObject = null;

// Variables for layer drag-and-drop
let isLayerDragging = false;
let draggedLayerItem = null;
let dragOverLayerItem = null;
let layerDragStartPosition = null;

// Initialize the scene
function init() {
    // Initialize state manager
    stateManager = stateManagerInstance;

    // Initialize DOM elements
    UI = initDOM();

    // Create scene
    scene = new THREE.Scene();

    // Initialize scene manager
    sceneManager = new SceneManager(scene);

    // Set up isometric camera
    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.OrthographicCamera(
        -config.camera.orthographicSize * aspect, config.camera.orthographicSize * aspect,
        config.camera.orthographicSize, -config.camera.orthographicSize,
        config.camera.near, config.camera.far
    );

    // Position camera for isometric view
    camera.position.set(
        config.camera.distance,
        config.camera.distance,
        config.camera.distance
    );
    camera.lookAt(0, 0, 0);

    // Create renderer
    renderer = new THREE.WebGLRenderer({
        antialias: config.rendering.antialias
    });
    renderer.setPixelRatio(config.rendering.pixelRatio);
    UI.sceneContainer.appendChild(renderer.domElement);

    // Initialize viewport manager (handles sizing, pan, zoom)
    viewportManager = new ViewportManager(renderer, camera, UI.sceneContainer);
    // Size the canvas to the container's current dimensions
    const containerWidth = UI.sceneContainer.clientWidth;
    const containerHeight = UI.sceneContainer.clientHeight;
    viewportManager.resize(containerWidth, containerHeight);

    // Add orbit controls (limited rotation)
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = config.camera.enableDamping;
    controls.dampingFactor = config.camera.dampingFactor;
    controls.screenSpacePanning = false;
    controls.minDistance = config.camera.minDistance;
    controls.maxDistance = config.camera.maxDistance;
    controls.enableRotate = false;

    // Initialize camera manager with initial angle from config
    cameraManager = new CameraManager(camera, controls, config.camera.initialAngle);
    cameraManager.init();

    // Initialize state with current camera angle
    stateManager.setCameraAngle(config.camera.initialAngle);

    // Add grid helper
    gridHelper = new THREE.GridHelper(
        config.scene.gridSize,
        config.scene.gridDivisions,
        config.scene.gridColor1,
        config.scene.gridColor2
    );
    scene.add(gridHelper);

    // Add axes helper
    axesHelper = new THREE.AxesHelper(config.scene.axesHelperSize);
    scene.add(axesHelper);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(
        config.scene.ambientLightColor,
        config.scene.ambientLightIntensity
    );
    scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(
        config.scene.directionalLightColor,
        config.scene.directionalLightIntensity
    );
    directionalLight.position.set(
        config.scene.directionalLightPosition.x,
        config.scene.directionalLightPosition.y,
        config.scene.directionalLightPosition.z
    );
    scene.add(directionalLight);

    // Initialize texture manager
    textureManagerInstance = textureManager;
    textureManager.init(config);

    // Initialize materials manager
    materialsManager = new MaterialsManager(this);

    // Initialize material builder for preview canvas
    materialBuilder = new MaterialBuilder();
    if (UI.materialBuilderCanvas) {
        materialBuilder.init(UI.materialBuilderCanvas);
    }

    // Initialize pixel post-processor
    pixelPostProcessor = new PixelPostProcessor(renderer, scene, camera);
    // Handle window resize via viewportManager
    window.addEventListener('resize', onWindowResize);

    // Set up UI event listeners
    setupUI();

    // Start animation loop
    animate();

    // Update camera position display
    cameraManager.updateCameraInfo();
}

// Handle window resize
function onWindowResize() {
    const width = UI.sceneContainer.clientWidth;
    const height = UI.sceneContainer.clientHeight;
    viewportManager.resize(width, height);
    if (pixelPostProcessor) {
        pixelPostProcessor.resize(width, height);
    }
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();

    // Get only visible objects for rendering
    const visibleObjects = layerManager.getVisibleObjects();

    // Hide all objects first
    objects.forEach(obj => {
        obj.visible = false;
    });

    // Show only visible objects
    visibleObjects.forEach(obj => {
        obj.visible = true;
    });

    // Update pixel post-processor time uniform and render
    if (pixelPostProcessor) {
        if (pixelPostProcessor.crtPass) {
            pixelPostProcessor.crtPass.uniforms.time.value += 0.016;
        }
        if (pixelPostProcessor.scanlinePass) {
            pixelPostProcessor.scanlinePass.uniforms.time.value += 0.016;
        }
        if (pixelPostProcessor.noisePass) {
            pixelPostProcessor.noisePass.uniforms.time.value += 0.016;
        }
        pixelPostProcessor.render();
    } else {
        renderer.render(scene, camera);
    }
}

// Raycaster for object picking
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Set up UI event listeners
function setupUI() {
    // Object creation buttons using UI elements
    UI.addCubeBtn.addEventListener('click', () => {
        addCube();
        stateManager.incrementObjectCount();
        stateManager.addToHistory({ action: 'add_object', type: 'cube' });
    });

    UI.addSphereBtn.addEventListener('click', () => {
        addSphere();
        stateManager.incrementObjectCount();
        stateManager.addToHistory({ action: 'add_object', type: 'sphere' });
    });

    UI.addCylinderBtn.addEventListener('click', () => {
        addCylinder();
        stateManager.incrementObjectCount();
        stateManager.addToHistory({ action: 'add_object', type: 'cylinder' });
    });

    UI.addRampBtn.addEventListener('click', () => {
        addRamp();
        stateManager.incrementObjectCount();
        stateManager.addToHistory({ action: 'add_object', type: 'ramp' });
    });

    UI.clearSceneBtn.addEventListener('click', () => {
        clearScene();
        stateManager.addToHistory({ action: 'clear_scene' });
    });

    // Camera controls
    UI.resetCameraBtn.addEventListener('click', () => {
        cameraManager.reset();
        stateManager.setCameraAngle(0);
        stateManager.addToHistory({ action: 'reset_camera' });
    });

    UI.rotateCwBtn.addEventListener('click', () => {
        cameraManager.rotateClockwise();
        stateManager.setCameraAngle(cameraManager.currentCameraAngle);
        stateManager.addToHistory({ action: 'rotate_camera', direction: 'cw' });
    });

    UI.rotateCcwBtn.addEventListener('click', () => {
        cameraManager.rotateCounterClockwise();
        stateManager.setCameraAngle(cameraManager.currentCameraAngle);
        stateManager.addToHistory({ action: 'rotate_camera', direction: 'ccw' });
    });

    // Background color
    UI.backgroundColorPicker.addEventListener('input', (e) => {
        sceneManager.setBackgroundColor(e.target.value);
    });

    // Object movement controls
    UI.moveUpBtn.addEventListener('click', () => {
        moveSelectedObject(0, 1, 0);
        stateManager.addToHistory({ action: 'move_object', direction: 'up' });
    });

    UI.moveDownBtn.addEventListener('click', () => {
        moveSelectedObject(0, -1, 0);
        stateManager.addToHistory({ action: 'move_object', direction: 'down' });
    });

    UI.moveLeftBtn.addEventListener('click', () => {
        moveSelectedObject(-1, 0, 0);
        stateManager.addToHistory({ action: 'move_object', direction: 'left' });
    });

    UI.moveRightBtn.addEventListener('click', () => {
        moveSelectedObject(1, 0, 0);
        stateManager.addToHistory({ action: 'move_object', direction: 'right' });
    });

    // Diagonal movement controls
    UI.moveLeftDownBtn.addEventListener('click', () => {
        moveSelectedObject(-1, -1, 0);
        stateManager.addToHistory({ action: 'move_object', direction: 'left-down' });
    });

    UI.moveRightUpBtn.addEventListener('click', () => {
        moveSelectedObject(1, 1, 0);
        stateManager.addToHistory({ action: 'move_object', direction: 'right-up' });
    });

    UI.objectSelectDropdown.addEventListener('change', (e) => {
        const objectId = parseInt(e.target.value);
        selectedObject = objects.find(obj => obj.userData.id === objectId) || null;
        stateManager.setSelectedObjectId(objectId);
        updatePropertiesPanel();
    });

    // Camera position updates
    controls.addEventListener('change', () => {
        cameraManager.updateCameraInfo();
        stateManager.setCameraPosition({
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z
        });
    });

    // Add mouse event listeners for drag-and-drop
    renderer.domElement.addEventListener('mousedown', onMouseDown, false);
    renderer.domElement.addEventListener('mousemove', onMouseMove, false);
    renderer.domElement.addEventListener('mouseup', onMouseUp, false);
    renderer.domElement.addEventListener('mouseleave', onMouseUp, false);

    // Set up properties panel event listeners
    setupPropertiesPanel();

    // Set up scene panel event listeners
    setupScenePanel();

    // Set up layer panel event listeners
    setupLayerPanel();

    // Set up layer drag-and-drop event listeners
    setupLayerDragDrop();

    // Set up panel toggle functionality
    setupPanelToggles();

    // Set up vertical tab system
    setupVerticalTabs();

    // Set up header action buttons
    setupHeaderActions();

    // Initialize floating menu
    floatingMenu = new FloatingMenu(viewportManager, onToolChange);
    floatingMenu.create();

    // Set up viewport interaction listeners
    setupViewportInteraction();

    // Initialize materials UI
    initMaterialsUI();
}

// Initialize materials UI
function initMaterialsUI() {
    // Initialize material selector dropdown
    if (!UI.materialSelectorBtn || !UI.materialDropdownList) return;

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

// ── MaterialBuilder UI wiring for 3D mode ───────────────────────────────────────
function _wireMaterialBuilderUI() {
    if (!materialBuilder) return;

    // Color A
    if (UI.builderColA) {
        UI.builderColA.addEventListener('input', (e) => {
            materialBuilder.setColors(e.target.value, materialBuilder.colorB);
            if (UI.builderSwA) UI.builderSwA.style.background = e.target.value;
        });
    }

    // Color B
    if (UI.builderColB) {
        UI.builderColB.addEventListener('input', (e) => {
            materialBuilder.setColors(materialBuilder.colorA, e.target.value);
            if (UI.builderSwB) UI.builderSwB.style.background = e.target.value;
        });
    }

    // Split
    if (UI.builderSplit) {
        UI.builderSplit.addEventListener('input', (e) => {
            const pct = parseInt(e.target.value) / 100;
            materialBuilder.setSplit(pct);
            if (UI.builderSplitV) UI.builderSplitV.textContent = e.target.value + '%';
        });
    }

    // Rotation
    if (UI.builderRot) {
        UI.builderRot.addEventListener('input', (e) => {
            materialBuilder.setRotation(parseInt(e.target.value));
            const vals = ['0°', '90°', '180°', '270°'];
            if (UI.builderRotV) UI.builderRotV.textContent = vals[parseInt(e.target.value)] || '0°';
        });
    }

    // Outline segment buttons
    if (UI.builderOutlineSeg) {
        UI.builderOutlineSeg.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                UI.builderOutlineSeg.querySelectorAll('button').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                materialBuilder.setOutline(e.target.dataset.v === 'on');
            }
        });
    }

    // Top dither controls
    if (UI.builderTDitherMode) {
        UI.builderTDitherMode.addEventListener('change', (e) => {
            materialBuilder.setTDither(e.target.value);
        });
    }
    if (UI.builderTDitherSpace) {
        UI.builderTDitherSpace.addEventListener('input', (e) => {
            materialBuilder.setTDitherSpace(parseInt(e.target.value));
            if (UI.builderTDitherSpaceV) UI.builderTDitherSpaceV.textContent = e.target.value;
        });
    }
    if (UI.builderTDitherThick) {
        UI.builderTDitherThick.addEventListener('input', (e) => {
            materialBuilder.setTDitherThick(parseInt(e.target.value));
            if (UI.builderTDitherThickV) UI.builderTDitherThickV.textContent = e.target.value;
        });
    }
    if (UI.builderTDitherBright) {
        UI.builderTDitherBright.addEventListener('input', (e) => {
            const val = parseInt(e.target.value) / 100;
            materialBuilder.setTDitherBright(val);
            if (UI.builderTDitherBrightV) UI.builderTDitherBrightV.textContent = e.target.value;
        });
    }
    if (UI.builderTDitherAlpha) {
        UI.builderTDitherAlpha.addEventListener('input', (e) => {
            const val = parseInt(e.target.value) / 100;
            materialBuilder.setTDitherAlpha(val);
            if (UI.builderTDitherAlphaV) UI.builderTDitherAlphaV.textContent = e.target.value;
        });
    }

    // Bottom dither controls
    if (UI.builderBDitherMode) {
        UI.builderBDitherMode.addEventListener('change', (e) => {
            materialBuilder.setBDither(e.target.value);
        });
    }
    if (UI.builderBDitherSpace) {
        UI.builderBDitherSpace.addEventListener('input', (e) => {
            materialBuilder.setBDitherSpace(parseInt(e.target.value));
            if (UI.builderBDitherSpaceV) UI.builderBDitherSpaceV.textContent = e.target.value;
        });
    }
    if (UI.builderBDitherThick) {
        UI.builderBDitherThick.addEventListener('input', (e) => {
            materialBuilder.setBDitherThick(parseInt(e.target.value));
            if (UI.builderBDitherThickV) UI.builderBDitherThickV.textContent = e.target.value;
        });
    }
    if (UI.builderBDitherBright) {
        UI.builderBDitherBright.addEventListener('input', (e) => {
            const val = parseInt(e.target.value) / 100;
            materialBuilder.setBDitherBright(val);
            if (UI.builderBDitherBrightV) UI.builderBDitherBrightV.textContent = e.target.value;
        });
    }
    if (UI.builderBDitherAlpha) {
        UI.builderBDitherAlpha.addEventListener('input', (e) => {
            const val = parseInt(e.target.value) / 100;
            materialBuilder.setBDitherAlpha(val);
            if (UI.builderBDitherAlphaV) UI.builderBDitherAlphaV.textContent = e.target.value;
        });
    }

    // Save Material button
    if (UI.builderSave) {
        UI.builderSave.addEventListener('click', () => {
            const material = materialBuilder.createMaterial();
            // Add to materials manager
            materialsManager.addTwoToneMaterial(material);
            populateMaterialsList();
            window.notifications?.success('Material saved!');
        });
    }

    // Download PNG button
    if (UI.builderDownload) {
        UI.builderDownload.addEventListener('click', () => {
            materialBuilder.downloadPNG('material.png');
        });
    }
}

/**
 * Set up vertical tab system for panels
 */
function setupVerticalTabs() {
    // Check if tab system elements exist
    if (!document.querySelector('.tab-rail')) {
        console.warn('Tab rail not found, skipping vertical tab setup');
        return;
    }

    // Get all tab buttons and panel sections
    const tabButtons = document.querySelectorAll('.tab-button');
    const panelSections = document.querySelectorAll('.panel-section');

    if (tabButtons.length === 0 || panelSections.length === 0) {
        console.warn('No tab buttons or panel sections found');
        return;
    }

    // Set up tab button click handlers
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));

            // Add active class to clicked button
            button.classList.add('active');

            // Hide all panels
            panelSections.forEach(panel => {
                panel.style.display = 'none';
            });

            // Show the selected panel
            const targetPanelId = button.dataset.panel;
            const targetPanel = document.getElementById(targetPanelId);
            if (targetPanel) {
                targetPanel.style.display = 'block';
            }
        });
    });

    // Set up panel toggle functionality
    const toggleButtons = document.querySelectorAll('.toggle-btn');
    toggleButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            try {
                // Find the closest panel section
                let panel = button.closest('.panel-section');
                if (!panel) {
                    // Fallback: find panel by going up to control-group
                    const controlGroup = button.closest('.control-group');
                    if (controlGroup && controlGroup.classList.contains('panel-section')) {
                        panel = controlGroup;
                    }
                }

                if (panel) {
                    const content = panel.querySelector('.panel-content');
                    if (content) {
                        const isVisible = content.style.display !== 'none';

                        if (isVisible) {
                            content.style.display = 'none';
                            button.classList.add('minimized');
                        } else {
                            content.style.display = 'block';
                            button.classList.remove('minimized');
                        }
                    }
                }
            } catch (error) {
                console.error('Error in panel toggle:', error);
            }
        });
    });

    // Initialize - show first panel, hide others
    try {
        panelSections.forEach((panel, index) => {
            if (index === 0) {
                panel.style.display = 'block';
            } else {
                panel.style.display = 'none';
            }
        });
    } catch (error) {
        console.error('Error initializing panel display:', error);
    }
}

// Add a cube to the scene
function addCube() {
    const cubeConfig = config.objectCreation.cube;
    const materialConfig = config.objects.materialProperties;

    const geometry = new THREE.BoxGeometry(
        cubeConfig.width,
        cubeConfig.height,
        cubeConfig.depth
    );

    const material = new THREE.MeshStandardMaterial({
        color: config.objects.defaultColor,
        roughness: materialConfig.roughness,
        metalness: materialConfig.metalness
    });

    const cube = new THREE.Mesh(geometry, material);

    // Assign unique ID using custom property
    cube.userData.id = Date.now();

    // Position randomly within configured area
    const positionRange = config.objects.defaultPositionRange;
    cube.position.set(
        (Math.random() - 0.5) * positionRange,
        Math.random() * 2,
        (Math.random() - 0.5) * positionRange
    );

    scene.add(cube);
    objects.push(cube);
    layerManager.addObjectToCurrentLayer(cube);
    cube.userData.name = `Cube ${Date.now()}`;
    cube.userData.zindex = 0;
    cube.renderOrder = 0;
    selectedObject = cube;
    updateObjectDropdown();
    updatePropertiesPanel();
    updateSceneObjectsList();
}

// Add a sphere to the scene
function addSphere() {
    const sphereConfig = config.objectCreation.sphere;
    const materialConfig = config.objects.materialProperties;

    const geometry = new THREE.SphereGeometry(
        sphereConfig.radius,
        sphereConfig.widthSegments,
        sphereConfig.heightSegments
    );

    const material = new THREE.MeshStandardMaterial({
        color: config.objects.defaultColor,
        roughness: materialConfig.roughness,
        metalness: materialConfig.metalness
    });

    const sphere = new THREE.Mesh(geometry, material);

    // Assign unique ID using custom property
    sphere.userData.id = Date.now();

    // Position randomly within configured area
    const positionRange = config.objects.defaultPositionRange;
    sphere.position.set(
        (Math.random() - 0.5) * positionRange,
        Math.random() * 2,
        (Math.random() - 0.5) * positionRange
    );

    scene.add(sphere);
    objects.push(sphere);
    layerManager.addObjectToCurrentLayer(sphere);
    sphere.userData.name = `Sphere ${Date.now()}`;
    sphere.userData.zindex = 0;
    sphere.renderOrder = 0;
    selectedObject = sphere;
    updateObjectDropdown();
    updatePropertiesPanel();
    updateSceneObjectsList();
}

// Add a cylinder to the scene
function addCylinder() {
    const cylinderConfig = config.objectCreation.cylinder;
    const materialConfig = config.objects.materialProperties;

    const geometry = new THREE.CylinderGeometry(
        cylinderConfig.radiusTop,
        cylinderConfig.radiusBottom,
        cylinderConfig.height,
        cylinderConfig.radialSegments
    );

    const material = new THREE.MeshStandardMaterial({
        color: config.objects.defaultColor,
        roughness: materialConfig.roughness,
        metalness: materialConfig.metalness
    });

    const cylinder = new THREE.Mesh(geometry, material);

    // Assign unique ID using custom property
    cylinder.userData.id = Date.now();

    // Position randomly within configured area
    const positionRange = config.objects.defaultPositionRange;
    cylinder.position.set(
        (Math.random() - 0.5) * positionRange,
        Math.random() * 2,
        (Math.random() - 0.5) * positionRange
    );

    scene.add(cylinder);
    objects.push(cylinder);
    layerManager.addObjectToCurrentLayer(cylinder);
    cylinder.userData.name = `Cylinder ${Date.now()}`;
    cylinder.userData.zindex = 0;
    cylinder.renderOrder = 0;
    selectedObject = cylinder;
    updateObjectDropdown();
    updatePropertiesPanel();
    updateSceneObjectsList();
}

// Add a ramp to the scene
function addRamp() {
    // Create custom ramp geometry with manually defined vertices
    const rampGeometry = createCustomRampGeometry();
    const material = new THREE.MeshStandardMaterial({
        color: Math.random() * 0xffffff,
        roughness: 0.7,
        metalness: 0.2
    });
    const ramp = new THREE.Mesh(rampGeometry, material);

    // Assign unique ID using custom property
    ramp.userData.id = Date.now();

    // Position randomly within a 5x5x5 area
    ramp.position.set(
        (Math.random() - 0.5) * 5,
        Math.random() * 2,
        (Math.random() - 0.5) * 5
    );

    scene.add(ramp);
    objects.push(ramp);
    layerManager.addObjectToCurrentLayer(ramp);
    ramp.userData.name = `Ramp ${Date.now()}`;
    ramp.userData.zindex = 0;
    ramp.renderOrder = 0;
    selectedObject = ramp;
    updateObjectDropdown();
    updatePropertiesPanel();
    updateSceneObjectsList();
}

// Create custom ramp geometry using Three.js Shape
function createCustomRampGeometry() {
    // Create a 2D shape for a true wedge ramp
    const shape = new THREE.Shape();

    // Start at bottom-left corner (-1, 0) to center on x-axis
    shape.moveTo(-1, 0);

    // Draw the wedge shape (triangle with flat bottom, centered)
    shape.lineTo(1, 0);      // Bottom-right corner (flat bottom, centered)
    shape.lineTo(-1, 0.5);   // Top-left corner (pointed top, centered)
    shape.lineTo(-1, 0);     // Back to start

    // Create extrude settings
    const extrudeSettings = {
        depth: 1,            // Extrude depth (1 unit)
        bevelEnabled: false, // No bevel for clean edges
        steps: 1             // Single step for extrusion
    };

    // Create the 3D geometry by extruding the shape
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

    // Position the geometry to align with grid
    // Keep centered on x-axis (from -1 to 1)
    // Keep y-axis at 0 to sit on ground
    // Keep z-axis starting at 0 (no translation)
    geometry.translate(0, 0, 0);

    return geometry;
}

// Clear the scene
function clearLayerScene() {
    // Remove all objects from all layers
    const allObjects = layerManager.getAllObjects();
    for (let i = allObjects.length - 1; i >= 0; i--) {
        scene.remove(allObjects[i]);
    }
    
    // Clear layer manager
    layerManager.getAllLayers().forEach(layer => {
        layer.objects = [];
    });
    
    objects = [];
    selectedObject = null;
    updateObjectDropdown();
    updatePropertiesPanel();
    updateSceneObjectsList();
}

// Update object selection dropdown
function updateObjectDropdown() {
    UI.objectSelectDropdown.innerHTML = '<option value="">None</option>';

    objects.forEach(obj => {
        const option = document.createElement('option');
        option.value = obj.userData.id;
        option.textContent = `${obj.userData.name || obj.geometry.type} (${obj.position.x.toFixed(1)}, ${obj.position.y.toFixed(1)}, ${obj.position.z.toFixed(1)})`;
        UI.objectSelectDropdown.appendChild(option);
    });

    // Select the current object if it exists
    if (selectedObject) {
        UI.objectSelectDropdown.value = selectedObject.userData.id;
    }
}


// Move selected object with grid snapping
function moveSelectedObject(dx, dy, dz) {
    if (selectedObject) {
        // Apply movement in the current camera's coordinate system
        const movement = new THREE.Vector3(dx, dy, dz);

        // For isometric view, we need to consider the camera orientation
        if (cameraManager.currentCameraAngle === 90 || cameraManager.currentCameraAngle === 270) {
            movement.x = -dx;
        }

        // Apply grid snapping (1 unit grid)
        const gridSize = 1;
        selectedObject.position.x = Math.round((selectedObject.position.x + movement.x) / gridSize) * gridSize;
        selectedObject.position.y = Math.round((selectedObject.position.y + movement.y) / gridSize) * gridSize;
        selectedObject.position.z = Math.round((selectedObject.position.z + movement.z) / gridSize) * gridSize;

        // Update the object dropdown to show new position
        updateObjectDropdown();
    }
}

// Mouse down event handler
function onMouseDown(event) {
    // Skip object picking if in 'move' tool mode
    if (floatingMenu && floatingMenu.getTool() === 'move') {
        return;
    }

    // Prevent OrbitControls from handling this event
    event.preventDefault();
    event.stopPropagation();

    // Get canvas bounding rect
    const rect = renderer.domElement.getBoundingClientRect();

    // Convert to viewportManager's internal coordinates (for fixed-resolution canvas)
    const scaleX = viewportManager.viewportWidth / rect.width;
    const scaleY = viewportManager.viewportHeight / rect.height;
    const internalX = (event.clientX - rect.left) * scaleX;
    const internalY = (event.clientY - rect.top) * scaleY;

    // Normalized Device Coordinates (-1 to +1)
    mouse.x = (internalX / viewportManager.viewportWidth) * 2 - 1;
    mouse.y = - (internalY / viewportManager.viewportHeight) * 2 + 1;

    // Update the raycaster with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Check for intersections with objects
    const intersects = raycaster.intersectObjects(objects);

    if (intersects.length > 0) {
        // Object was clicked
        const clickedObject = intersects[0].object;

        // Update selected object
        selectedObject = clickedObject;
        updateObjectDropdown();
        updatePropertiesPanel();

        // Start dragging
        isDragging = true;
        draggedObject = clickedObject;
        dragStartPosition = clickedObject.position.clone();
        dragStartMousePosition = new THREE.Vector2(event.clientX, event.clientY);

        // Temporarily disable OrbitControls during drag
        controls.enabled = false;
    }
}

// Mouse move event handler
function onMouseMove(event) {
    if (isDragging && draggedObject) {
        // Prevent OrbitControls from handling this event
        event.preventDefault();
        event.stopPropagation();

        // Calculate mouse movement
        const currentMousePosition = new THREE.Vector2(event.clientX, event.clientY);
        const mouseDelta = new THREE.Vector2(
            currentMousePosition.x - dragStartMousePosition.x,
            currentMousePosition.y - dragStartMousePosition.y
        );

        // Calculate movement in 3D space based on camera orientation
        const movement = calculateDragMovement(mouseDelta);

        // Apply the movement to the object
        draggedObject.position.copy(dragStartPosition.clone().add(movement));

        // Update the object dropdown to show new position
        updateObjectDropdown();
    }
}

// Mouse up event handler
function onMouseUp(event) {
    if (isDragging) {
        // Prevent OrbitControls from handling this event
        event.preventDefault();
        event.stopPropagation();
    }

    isDragging = false;
    draggedObject = null;
    dragStartPosition = null;
    dragStartMousePosition = null;

    // Re-enable OrbitControls after drag if in move tool
    if (floatingMenu && floatingMenu.getTool() === 'move') {
        controls.enabled = true;
    }
}

// Calculate drag movement based on mouse delta and camera orientation
function calculateDragMovement(mouseDelta) {
    // Convert mouse movement to 3D movement based on camera angle
    const movement = new THREE.Vector3();

    // Adjust movement based on camera angle for isometric view
    switch (cameraManager.currentCameraAngle) {
        case 0: // Front-right view
            movement.x = mouseDelta.x * 0.02;
            movement.z = -mouseDelta.y * 0.02;
            break;
        case 90: // Front-left view
            movement.x = -mouseDelta.x * 0.02;
            movement.z = -mouseDelta.y * 0.02;
            break;
        case 180: // Back-left view
            movement.x = -mouseDelta.x * 0.02;
            movement.z = mouseDelta.y * 0.02;
            break;
        case 270: // Back-right view
            movement.x = mouseDelta.x * 0.02;
            movement.z = mouseDelta.y * 0.02;
            break;
    }

    // Apply grid snapping (1 unit grid)
    const gridSize = 1;
    movement.x = Math.round(movement.x / gridSize) * gridSize;
    movement.y = Math.round(movement.y / gridSize) * gridSize;
    movement.z = Math.round(movement.z / gridSize) * gridSize;

    return movement;
}

// Set up scene panel event listeners
function setupScenePanel() {
    // Gradient background controls
    UI.applyGradientVerticalBtn.addEventListener('click', () => {
        const color1 = UI.gradientColor1Picker.value;
        const color2 = UI.gradientColor2Picker.value;
        sceneManager.setGradientBackground(color1, color2, 'vertical');
    });

    UI.applyGradientHorizontalBtn.addEventListener('click', () => {
        const color1 = UI.gradientColor1Picker.value;
        const color2 = UI.gradientColor2Picker.value;
        sceneManager.setGradientBackground(color1, color2, 'horizontal');
    });

    // Background image
    if (UI.applyImageBackgroundBtn) {
        UI.applyImageBackgroundBtn.addEventListener('click', () => {
            const imageUrl = UI.backgroundImageUrlInput ? UI.backgroundImageUrlInput.value.trim() : '';
            if (imageUrl) {
                sceneManager.setImageBackground(imageUrl, (error) => {
                    if (error) {
                        alert('Failed to load background image: ' + error.message);
                    }
                });
            } else {
                alert('Please enter a valid image URL');
            }
        });
    }

    // Theme selection
    if (UI.applyThemeBtn) {
        UI.applyThemeBtn.addEventListener('click', () => {
            const themeName = UI.themeSelector ? UI.themeSelector.value : 'default';
            sceneManager.applyBackgroundTheme(themeName);
        });
    }

    if (UI.cycleThemesBtn) {
        UI.cycleThemesBtn.addEventListener('click', () => {
            sceneManager.cycleBackgroundThemes();
        });
    }

    // Brightness adjustment
    if (UI.adjustBrightnessBtn) {
        UI.adjustBrightnessBtn.addEventListener('click', () => {
            const brightness = UI.brightnessAdjustSlider ? parseFloat(UI.brightnessAdjustSlider.value) : 1.0;
            sceneManager.adjustBackgroundBrightness(brightness);
            if (UI.brightnessValueDisplay) UI.brightnessValueDisplay.textContent = brightness.toFixed(1);
        });
    }

    // Scene effects
    UI.toggleGridBtn.addEventListener('click', () => {
        const gridHelper = scene.children.find(child => child.type === 'GridHelper');
        const currentVisibility = gridHelper ? gridHelper.visible : false;
        sceneManager.toggleGridVisibility(!currentVisibility);
    });

    UI.toggleAxesBtn.addEventListener('click', () => {
        const axesHelper = scene.children.find(child => child.type === 'AxesHelper');
        const currentVisibility = axesHelper ? axesHelper.visible : false;
        sceneManager.toggleAxesVisibility(!currentVisibility);
    });

    // Fog controls
    UI.applyFogBtn.addEventListener('click', () => {
        const color = UI.fogColorPicker.value;
        const near = parseFloat(UI.fogNearSlider.value);
        const far = parseFloat(UI.fogFarSlider.value);
        sceneManager.updateFog(color, near, far);
        UI.fogNearValueDisplay.textContent = near;
        UI.fogFarValueDisplay.textContent = far;
    });

    UI.removeFogBtn.addEventListener('click', () => {
        sceneManager.removeFog();
    });

    // Reset background
    UI.resetBackgroundBtn.addEventListener('click', () => {
        sceneManager.resetBackgroundToSolidColor();
    });

    // Update slider values display
    if (UI.brightnessAdjustSlider) {
        UI.brightnessAdjustSlider.addEventListener('input', (e) => {
            if (UI.brightnessValueDisplay) UI.brightnessValueDisplay.textContent = parseFloat(e.target.value).toFixed(1);
        });
    }

    UI.fogNearSlider.addEventListener('input', (e) => {
        UI.fogNearValueDisplay.textContent = e.target.value;
    });

    UI.fogFarSlider.addEventListener('input', (e) => {
        UI.fogFarValueDisplay.textContent = e.target.value;
    });
}

// Set up properties panel event listeners
function setupPropertiesPanel() {
    // Scale sliders (X, Y, Z)
    UI.objectScaleXSlider.addEventListener('input', (e) => {
        if (selectedObject) {
            const scale = parseInt(e.target.value);
            selectedObject.scale.x = scale;
            UI.objectScaleXValue.textContent = scale;
            stateManager.addToHistory({
                action: 'scale_object',
                objectId: selectedObject.userData.id,
                axis: 'x',
                scale: scale
            });
        }
    });

    UI.objectScaleYSlider.addEventListener('input', (e) => {
        if (selectedObject) {
            const scale = parseInt(e.target.value);
            selectedObject.scale.y = scale;
            UI.objectScaleYValue.textContent = scale;
            stateManager.addToHistory({
                action: 'scale_object',
                objectId: selectedObject.userData.id,
                axis: 'y',
                scale: scale
            });
        }
    });

    UI.objectScaleZSlider.addEventListener('input', (e) => {
        if (selectedObject) {
            const scale = parseInt(e.target.value);
            selectedObject.scale.z = scale;
            UI.objectScaleZValue.textContent = scale;
            stateManager.addToHistory({
                action: 'scale_object',
                objectId: selectedObject.userData.id,
                axis: 'z',
                scale: scale
            });
        }
    });

    // Rotation slider (Y-axis only with 90-degree steps)
    UI.objectRotationYSlider.addEventListener('input', (e) => {
        if (selectedObject) {
            const rotation = THREE.MathUtils.degToRad(parseInt(e.target.value));
            selectedObject.rotation.y = rotation;
            UI.objectRotationYValue.textContent = e.target.value + '°';
            stateManager.addToHistory({
                action: 'rotate_object',
                objectId: selectedObject.userData.id,
                rotation: parseInt(e.target.value)
            });
        }
    });

    // Z-index slider (render order)
    UI.objectZindexSlider.addEventListener('input', (e) => {
        if (selectedObject) {
            const zindex = parseInt(e.target.value);
            selectedObject.userData.zindex = zindex;
            UI.objectZindexValue.textContent = zindex;

            // Update render order by changing object's renderOrder property
            selectedObject.renderOrder = zindex;

            // Need to update all objects to ensure proper rendering order
            objects.forEach(obj => {
                obj.renderOrder = obj.userData.zindex || 0;
            });

            // Force scene to update render order by sorting children
            // We need to remove and re-add objects to ensure proper rendering order
            const sortedObjects = [...objects].sort((a, b) => {
                return (a.userData.zindex || 0) - (b.userData.zindex || 0);
            });

            // Remove all objects from scene first
            objects.forEach(obj => {
                scene.remove(obj);
            });

            // Add them back in sorted order
            sortedObjects.forEach(obj => {
                scene.add(obj);
            });

            stateManager.addToHistory({
                action: 'change_zindex',
                objectId: selectedObject.userData.id,
                zindex: zindex
            });
        }
    });
}

// Update properties panel with selected object's properties
function updatePropertiesPanel() {
    if (selectedObject) {
        // Show properties panel
        UI.propertiesPanel.style.display = 'block';

        // Update current material name from materialsManager
        if (UI.currentMaterialName && materialsManager) {
            let matName = '—';
            // Walk the object's mesh tree (some objects have leaf meshes with the real material)
            const leafMesh = (() => {
                if (selectedObject.isMesh) return selectedObject;
                for (const c of selectedObject.children) { if (c.isMesh) return c; }
                return selectedObject;
            })();
            if (leafMesh?.userData?.isPixelTexture && leafMesh.userData.materialType) {
                const tmEntry = window.textureManager?.[leafMesh.userData.materialType];
                matName = tmEntry?.name ?? leafMesh.userData.materialType;
            } else if (materialsManager.getMaterial(selectedObject.userData.currentMaterialId)) {
                matName = materialsManager.getMaterial(selectedObject.userData.currentMaterialId).name;
            }
            UI.currentMaterialName.textContent = matName;
        }

        // Update scale sliders (X, Y, Z)
        UI.objectScaleXSlider.value = Math.round(selectedObject.scale.x);
        UI.objectScaleXValue.textContent = Math.round(selectedObject.scale.x);

        UI.objectScaleYSlider.value = Math.round(selectedObject.scale.y);
        UI.objectScaleYValue.textContent = Math.round(selectedObject.scale.y);

        UI.objectScaleZSlider.value = Math.round(selectedObject.scale.z);
        UI.objectScaleZValue.textContent = Math.round(selectedObject.scale.z);

        // Update rotation slider (Y-axis only)
        const rotationY = THREE.MathUtils.radToDeg(selectedObject.rotation.y);
        // Round to nearest 90-degree increment
        const roundedRotationY = Math.round(rotationY / 90) * 90;
        UI.objectRotationYSlider.value = roundedRotationY;
        UI.objectRotationYValue.textContent = roundedRotationY + '°';

        // Update z-index slider
        const zindex = selectedObject.userData.zindex || 0;
        UI.objectZindexSlider.value = zindex;
        UI.objectZindexValue.textContent = zindex;
    } else {
        // Hide properties panel if no object is selected
        UI.propertiesPanel.style.display = 'none';
        UI.currentMaterialName.textContent = '—';
    }
}

// Set up layer panel event listeners
function setupLayerPanel() {
    // Add layer button
    UI.addLayerBtn.addEventListener('click', () => {
        const layerName = UI.layerNameInput.value || `Layer ${layerManager.nextLayerId}`;
        const newLayer = layerManager.addLayer(layerName);
        updateLayerDropdown();
        updateLayersList();
        UI.layerNameInput.value = '';
        stateManager.incrementLayerCount();
        stateManager.addToHistory({ action: 'add_layer', layerName: layerName });
    });

    // Current layer dropdown
    UI.currentLayerDropdown.addEventListener('change', (e) => {
        const layerId = parseInt(e.target.value);
        layerManager.setCurrentLayer(layerId);
        stateManager.setCurrentLayerId(layerId);
        stateManager.addToHistory({ action: 'change_layer', layerId: layerId });
    });

    // Initialize layer UI
    updateLayerDropdown();
    updateLayersList();
}

// Layer drag-and-drop system has been removed and replaced with up/down buttons
function setupLayerDragDrop() {
    // This function is now empty as we've switched to up/down buttons
    // The functionality is now handled in layerManager._buildLayerElement()
}

// Set up panel toggle functionality
function setupPanelToggles() {
    // Get all toggle buttons
    const toggleButtons = document.querySelectorAll('.toggle-btn');

    toggleButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            try {
                // Find the panel content
                let panelContent;
                const panelHeader = button.closest('.panel-header');
                if (panelHeader) {
                    panelContent = panelHeader.nextElementSibling;
                    if (panelContent && !panelContent.classList.contains('panel-content')) {
                        panelContent = panelHeader.parentElement.querySelector('.panel-content');
                    }
                } else {
                    // Fallback: find panel content in the same control group
                    const controlGroup = button.closest('.control-group');
                    if (controlGroup) {
                        panelContent = controlGroup.querySelector('.panel-content');
                    }
                }

                if (panelContent) {
                    const isVisible = panelContent.style.display !== 'none';
                    panelContent.style.display = isVisible ? 'none' : 'flex';
                    button.classList.toggle('minimized', !isVisible);
                }
            } catch (error) {
                console.error('Error in panel toggle setup:', error);
            }
        });
    });
}

// Update layer dropdown
function updateLayerDropdown() {
    UI.currentLayerDropdown.innerHTML = '';

    const layers = layerManager.getAllLayers();
    layers.forEach(layer => {
        const option = document.createElement('option');
        option.value = layer.id;
        option.textContent = layer.name;
        if (layer.id === layerManager.currentLayerId) {
            option.selected = true;
        }
        UI.currentLayerDropdown.appendChild(option);
    });
}

// Update layers list with reordering controls
function updateLayersList() {
    layerManager.renderLayersList();
}

// Update scene objects list grouped by type
function updateSceneObjectsList() {
    if (!UI.sceneObjectsList) return;
    
    // Group objects by type
    const objectsByType = {};
    objects.forEach(obj => {
        const type = obj.userData.type || 'unknown';
        if (!objectsByType[type]) {
            objectsByType[type] = [];
        }
        objectsByType[type].push(obj);
    });
    
    // Build HTML
    let html = '';
    const typeNames = Object.keys(objectsByType).sort();
    
    typeNames.forEach(type => {
        const objects = objectsByType[type];
        html += `<div class="object-type-group">`;
        html += `<div class="object-type-header">${type.toUpperCase()} (${objects.length})</div>`;
        html += `<div class="object-type-items">`;
        
        objects.forEach(obj => {
            const isSelected = obj === selectedObject;
            html += `<div class="object-list-item ${isSelected ? 'selected' : ''}" data-object-id="${obj.userData.id}">`;
            html += `<span class="object-name">${obj.userData.name || 'Unnamed'}</span>`;
            html += `<span class="object-position">(${obj.position.x.toFixed(0)}, ${obj.position.y.toFixed(0)}, ${obj.position.z.toFixed(0)})</span>`;
            html += `</div>`;
        });
        
        html += `</div></div>`;
    });
    
    UI.sceneObjectsList.innerHTML = html || '<div class="empty-state">No objects in scene</div>';
    
    // Add click handlers to object list items
    document.querySelectorAll('.object-list-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const objectId = parseInt(item.dataset.objectId);
            const obj = objects.find(o => o.userData.id === objectId);
            if (obj) {
                selectedObject = obj;
                updateObjectDropdown();
                updatePropertiesPanel();
                updateSceneObjectsList(); // Refresh to show selection
            }
        });
    });
}

// Set up header action buttons (settings, save, load)
function setupHeaderActions() {
    // Settings button - open settings modal
    UI.settingsBtn.addEventListener('click', () => {
        openSettingsModal();
    });

    // Save button - save current state
    UI.saveBtn.addEventListener('click', () => {
        saveProject();
    });

    // Load button - load saved state
    UI.loadBtn.addEventListener('click', () => {
        loadProject();
    });

    // 2D/3D mode toggle button
    if (UI.mode2d3dBtn) {
        UI.mode2d3dBtn.addEventListener('click', () => {
            toggle2d3d();
        });
    }

    // Settings modal close button
    if (UI.closeSettingsBtn) {
        UI.closeSettingsBtn.addEventListener('click', () => {
            closeSettingsModal();
        });
    }

    // Close modal when clicking overlay
    if (UI.settingsModal) {
        UI.settingsModal.addEventListener('click', (e) => {
            if (e.target === UI.settingsModal) {
                closeSettingsModal();
            }
        });
    }

    // Settings tab switching
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            // Update active tab
            document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Show corresponding content
            const tabId = tab.dataset.tab;
            document.querySelectorAll('.settings-tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.querySelector(`[data-tab-content="${tabId}"]`).classList.add('active');
        });
    });

    // Save settings button
    if (UI.saveSettingsBtn) {
        UI.saveSettingsBtn.addEventListener('click', () => {
            applySettings();
            closeSettingsModal();
            window.notifications.success('Settings saved successfully!');
        });
    }

    // Clear saved data button
    if (UI.settingClearState) {
        UI.settingClearState.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all saved data? This cannot be undone.')) {
                stateManager.clearState();
                window.notifications.success('All saved data cleared.');
                closeSettingsModal();
            }
        });
    }

    // Brightness slider value display
    const brightnessSlider = UI.settingBrightness;
    if (brightnessSlider) {
        brightnessSlider.addEventListener('input', (e) => {
            e.target.nextElementSibling.textContent = e.target.value;
        });
    }

    // Terrain height slider value display
    const terrainHeightSlider = UI.settingTerrainHeight;
    if (terrainHeightSlider) {
        terrainHeightSlider.addEventListener('input', (e) => {
            e.target.nextElementSibling.textContent = e.target.value;
        });
    }
}

// Set up viewport interaction listeners (panning, zooming)
function setupViewportInteraction() {
    const container = UI.sceneContainer;
    if (!container) return;

    // Pan with left mouse when in 'move' tool mode - capture phase to intercept before renderer
    container.addEventListener('mousedown', (e) => {
        if (floatingMenu && floatingMenu.getTool() === 'move' && e.button === 0) {
            e.preventDefault();
            e.stopPropagation();
            viewportManager.startPan(e.clientX, e.clientY);
            // Listen on window for move/up to handle drag outside container
            window.addEventListener('mousemove', onPanMove);
            window.addEventListener('mouseup', onPanUp);
        }
    }, { capture: true });

    // Zoom with mouse wheel on container
    container.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        viewportManager.zoomBy(zoomFactor);
    }, { passive: false });
}

// Pan move handler (attached to window during pan)
function onPanMove(e) {
    viewportManager.updatePan(e.clientX, e.clientY);
}

// Pan end handler
function onPanUp() {
    viewportManager.stopPan();
    window.removeEventListener('mousemove', onPanMove);
    window.removeEventListener('mouseup', onPanUp);
}

// Floating menu tool change callback
function onToolChange(tool) {
    // Update scene container class for CSS styling
    if (UI.sceneContainer) {
        UI.sceneContainer.classList.remove('viewport-select', 'viewport-cursor', 'viewport-move');
        UI.sceneContainer.classList.add('viewport-' + tool);
    }

    // Configure OrbitControls for the current tool
    if (controls) {
        if (tool === 'move') {
            controls.enabled = true;
            controls.enableRotate = true;
            controls.enableZoom = false;
            controls.enablePan = false;
        } else {
            controls.enabled = false;
            controls.enableRotate = false;
        }
    }

    console.log('Active tool:', tool);
}

// Open settings modal and populate with current values
function openSettingsModal() {
    if (!UI.settingsModal) return;

    // Populate settings from current state
    populateSettingsFromState();

    // Show modal
    UI.settingsModal.classList.add('open');
}

// Close settings modal
function closeSettingsModal() {
    if (UI.settingsModal) {
        UI.settingsModal.classList.remove('open');
    }
}

// Populate modal settings from current application state
function populateSettingsFromState() {
    // General tab
    if (UI.settingShowGrid) {
        UI.settingShowGrid.checked = stateManager.getStateProperty('scene.gridVisible') !== false;
    }
    if (UI.settingShowAxes) {
        UI.settingShowAxes.checked = stateManager.getStateProperty('scene.axesVisible') !== false;
    }
    if (UI.settingAutoSave) {
        UI.settingAutoSave.checked = stateManager.getStateProperty('preferences.autoSave') === true;
    }

    // Scene tab
    if (UI.settingBgColor) {
        UI.settingBgColor.value = stateManager.getStateProperty('scene.backgroundColor') || '#808080';
    }
    if (UI.settingTheme) {
        UI.settingTheme.value = stateManager.getStateProperty('preferences.theme') || 'default';
    }
    if (UI.settingBrightness) {
        const brightness = stateManager.getStateProperty('preferences.brightness') || 1.0;
        UI.settingBrightness.value = brightness;
        UI.settingBrightness.nextElementSibling.textContent = brightness.toFixed(1);
    }
    if (UI.settingTerrainHeight) {
        const height = stateManager.getStateProperty('tools.terrainHeight') || 0.25;
        UI.settingTerrainHeight.value = height;
        UI.settingTerrainHeight.nextElementSibling.textContent = height.toFixed(2);
    }

    // Export tab
    if (UI.settingIncludeColliders) {
        UI.settingIncludeColliders.checked = true; // Default
    }
    if (UI.settingColliderType) {
        UI.settingColliderType.value = 'box'; // Default
    }
}

// Apply settings from modal to application state
function applySettings() {
    // General settings
    if (UI.settingShowGrid) {
        stateManager.setStateProperty('scene.gridVisible', UI.settingShowGrid.checked);
        // Apply immediately
        if (gridHelper) gridHelper.visible = UI.settingShowGrid.checked;
    }
    if (UI.settingShowAxes) {
        stateManager.setStateProperty('scene.axesVisible', UI.settingShowAxes.checked);
        // Apply immediately
        if (axesHelper) axesHelper.visible = UI.settingShowAxes.checked;
    }
    if (UI.settingAutoSave) {
        stateManager.setStateProperty('preferences.autoSave', UI.settingAutoSave.checked);
    }

    // Scene settings
    if (UI.settingBgColor) {
        const color = UI.settingBgColor.value;
        stateManager.setBackgroundColor(color);
        sceneManager.setBackgroundColor(color);
        // Update scene panel color picker
        if (UI.backgroundColorPicker) UI.backgroundColorPicker.value = color;
    }
    if (UI.settingTheme) {
        stateManager.setStateProperty('preferences.theme', UI.settingTheme.value);
        // Apply theme would be handled by theme system if implemented
    }
    if (UI.settingBrightness) {
        const brightness = parseFloat(UI.settingBrightness.value);
        stateManager.setStateProperty('preferences.brightness', brightness);
        // Apply brightness if implemented
    }
    if (UI.settingTerrainHeight) {
        const height = parseFloat(UI.settingTerrainHeight.value);
        stateManager.setTerrainHeight(height);
        // Update scene panel slider
        if (UI.terrainHeightSlider) UI.terrainHeightSlider.value = height;
        if (UI.terrainHeightValue) UI.terrainHeightValue.textContent = height.toFixed(2);
    }

    // Export settings (stored but not actively used until export)
    // These would be read during export operations

    // Save state to persist settings
    stateManager.saveState();
}

// Apply grid and axes visibility from settings
function applyGridAxesVisibility() {
    const showGrid = stateManager.getStateProperty('scene.gridVisible') !== false;
    const showAxes = stateManager.getStateProperty('scene.axesVisible') !== false;

    // Apply to global helpers
    if (gridHelper) gridHelper.visible = showGrid;
    if (axesHelper) axesHelper.visible = showAxes;
}

// Save current project state
function saveProject() {
    try {
        stateManager.saveState();
        // Update last save time
        const now = new Date().toISOString();
        stateManager.setStateProperty('session.lastSaveTime', now);
        window.notifications.success('Project saved successfully!');
    } catch (error) {
        console.error('Save failed:', error);
        window.notifications.error('Failed to save project');
    }
}

// Load saved project state
function loadProject() {
    try {
        const savedState = stateManager.loadState();
        if (!savedState) {
            window.notifications.warning('No saved project found');
            return;
        }

        stateManager.updateState(savedState);
        window.notifications.success('Project loaded successfully!');

        // Refresh UI to reflect loaded state
        refreshUIFromState();
    } catch (error) {
        console.error('Load failed:', error);
        window.notifications.error('Failed to load project');
    }
}

// Refresh UI elements to match loaded state
function refreshUIFromState() {
    // Update camera
    const cameraPos = stateManager.getStateProperty('scene.cameraPosition');
    if (cameraPos) {
        camera.position.set(cameraPos.x, cameraPos.y, cameraPos.z);
    }

    // Update background color (directly without adding history)
    const bgColor = stateManager.getStateProperty('scene.backgroundColor');
    if (bgColor) {
        scene.background = new THREE.Color(bgColor);
        sceneManager.currentBackgroundColor = bgColor;
        if (UI.backgroundColorPicker) {
            UI.backgroundColorPicker.value = bgColor;
        }
    }

    // Update grid/axes visibility
    applyGridAxesVisibility();

    // Update other UI controls as needed...
}

// Start the application
init();

// 2D/3D Mode Toggle System
let currentMode = '3d';
let app2dInstance = null;

async function toggle2d3d() {
    if (currentMode === '3d') {
        await switchTo2d();
    } else {
        await switchTo3d();
    }
}

async function switchTo2d() {
    const app2d = await import('../2d/app2d.js');
    const container = document.getElementById('scene-container');
    
    container.innerHTML = '<canvas id="c-cube"></canvas><canvas id="c-col"></canvas>';
    container.style.position = 'relative';
    
    const canvases = container.querySelectorAll('canvas');
    canvases.forEach(c => {
        c.style.position = 'absolute';
        c.style.top = '0';
        c.style.left = '0';
        c.style.width = '100%';
        c.style.height = '100%';
    });
    canvases[0].style.zIndex = '1';
    canvases[1].style.zIndex = '2';
    canvases[1].style.pointerEvents = 'none';
    
    // Re-wire the existing floating menu to point at the 2D scene container
    // instead of the 3D viewportManager (which is being torn down).
    // Zoom action handlers become no-ops in 2D (the renderer redraw loop owns
    // canvas state; there is no camera to zoom).  onToolChange already guards
    // against missing controls, so it is safe to leave unchanged.
    if (floatingMenu) {
        floatingMenu.setCursorContainer(container);
        floatingMenu.setZoomHandlers(null, null, null);
    }
    
    setTimeout(() => {
        app2dInstance = app2d.init(container);
        if (renderer) {
            renderer.dispose();
            renderer = null;
        }
    }, 0);
    
    currentMode = '2d';
    if (UI.mode2d3dBtn) {
        UI.mode2d3dBtn.innerHTML = '<i class="fas fa-cube"></i> 2D Mode';
        UI.mode2d3dBtn.title = '2D Mode Active';
    }
}

async function switchTo3d() {
    const container = document.getElementById('scene-container');
    container.innerHTML = '';
    
    // Full page reload to fully reset the 3D scene
    window.location.reload();
    // NOTE: Everything below this line is unreachable after reload; the page
    // re-initialises from scratch (init() → setupUI() → floatingMenu.create()).
}

// Export toggle function for UI button
window.toggle2d3d = toggle2d3d;