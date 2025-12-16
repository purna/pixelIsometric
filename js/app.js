// Main application

let scene, camera, renderer, controls;
let objects = [];
let selectedObject = null;
let cameraManager;
let sceneManager;
let stateManager, UI;

// Import managers and utilities
import { layerManager } from './layerManager.js';
import { CameraManager } from './cameraManager.js';
import { SceneManager } from './sceneManager.js';
import { stateManager as stateManagerInstance } from './state.js';
import config from './config.js';
import { UI as UIElements, initDOM } from './dom.js';

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
    renderer.setSize(window.innerWidth - 350, window.innerHeight);
    renderer.setPixelRatio(config.rendering.pixelRatio);
    UI.sceneContainer.appendChild(renderer.domElement);

    // Add orbit controls (but we'll limit rotation to 90-degree steps)
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = config.camera.enableDamping;
    controls.dampingFactor = config.camera.dampingFactor;
    controls.screenSpacePanning = false;
    controls.minDistance = config.camera.minDistance;
    controls.maxDistance = config.camera.maxDistance;
    controls.enableRotate = false; // Disable free rotation

    // Initialize camera manager with initial angle from config
    cameraManager = new CameraManager(camera, controls, config.camera.initialAngle);
    cameraManager.init();

    // Initialize state with current camera angle
    stateManager.setCameraAngle(config.camera.initialAngle);

    // Add grid helper
    const gridHelper = new THREE.GridHelper(
        config.scene.gridSize,
        config.scene.gridDivisions,
        config.scene.gridColor1,
        config.scene.gridColor2
    );
    scene.add(gridHelper);

    // Add axes helper
    const axesHelper = new THREE.AxesHelper(config.scene.axesHelperSize);
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

    // Handle window resize
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
    const aspect = window.innerWidth / window.innerHeight;
    camera.left = -10 * aspect;
    camera.right = 10 * aspect;
    camera.top = 10;
    camera.bottom = -10;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth - 350, window.innerHeight);
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

    renderer.render(scene, camera);
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

    // Disable OrbitControls rotation to prevent interference
    controls.enableRotate = false;

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
function clearScene() {
    clearLayerScene();
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
    // Prevent OrbitControls from handling this event
    event.preventDefault();
    event.stopPropagation();

    // Calculate mouse position in normalized device coordinates (-1 to +1)
    // Need to adjust for sidebar width
    const canvasRect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - canvasRect.left) / canvasRect.width) * 2 - 1;
    mouse.y = -((event.clientY - canvasRect.top) / canvasRect.height) * 2 + 1;

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

    // Re-enable OrbitControls after drag
    controls.enabled = true;
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
    UI.applyImageBackgroundBtn.addEventListener('click', () => {
        const imageUrl = UI.backgroundImageUrlInput.value.trim();
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

    // Theme selection
    UI.applyThemeBtn.addEventListener('click', () => {
        const themeName = UI.themeSelector.value;
        sceneManager.applyBackgroundTheme(themeName);
    });

    UI.cycleThemesBtn.addEventListener('click', () => {
        sceneManager.cycleBackgroundThemes();
    });

    // Brightness adjustment
    UI.adjustBrightnessBtn.addEventListener('click', () => {
        const brightness = parseFloat(UI.brightnessAdjustSlider.value);
        sceneManager.adjustBackgroundBrightness(brightness);
        UI.brightnessValueDisplay.textContent = brightness.toFixed(1);
    });

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
    UI.brightnessAdjustSlider.addEventListener('input', (e) => {
        UI.brightnessValueDisplay.textContent = parseFloat(e.target.value).toFixed(1);
    });

    UI.fogNearSlider.addEventListener('input', (e) => {
        UI.fogNearValueDisplay.textContent = e.target.value;
    });

    UI.fogFarSlider.addEventListener('input', (e) => {
        UI.fogFarValueDisplay.textContent = e.target.value;
    });
}

// Set up properties panel event listeners
function setupPropertiesPanel() {
    // Color picker
    UI.objectColorPicker.addEventListener('input', (e) => {
        if (selectedObject) {
            selectedObject.material.color.set(e.target.value);
            stateManager.addToHistory({
                action: 'change_object_color',
                objectId: selectedObject.userData.id,
                color: e.target.value
            });
        }
    });

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

        // Update color picker
        const color = '#' + selectedObject.material.color.getHexString();
        UI.objectColorPicker.value = color;

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
    // The functionality is now handled in layerManager.updateLayersList()
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
    // Use the layerManager's updateLayersList method which includes up/down buttons
    layerManager.updateLayersList(UI, updateLayerDropdown);
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
}

// Start the application
init();