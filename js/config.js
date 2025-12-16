/**
 * Configuration file for Isometric 3D Editor
 * Contains default settings for the application
 */

// Default configuration object
const config = {
    // Camera settings
    camera: {
        initialAngle: 0,                // Initial camera angle (0, 90, 180, 270)
        distance: 20,                   // Distance from origin
        fov: 75,                        // Field of view for perspective camera (not used in orthographic)
        near: 0.1,                     // Near clipping plane
        far: 1000,                     // Far clipping plane
        orthographicSize: 20,          // Size for orthographic camera
        enableDamping: true,           // Enable damping for smooth camera movement
        dampingFactor: 0.05,           // Damping factor
        minDistance: 5,                // Minimum zoom distance
        maxDistance: 50                // Maximum zoom distance
    },

    // Scene settings
    scene: {
        backgroundColor: 0x808080,      // Default background color (50% grey)
        gridSize: 20,                  // Grid size
        gridDivisions: 20,             // Number of grid divisions
        gridColor1: 0x333333,          // Primary grid color
        gridColor2: 0x333333,          // Secondary grid color
        axesHelperSize: 5,             // Size of axes helper
        ambientLightColor: 0x404040,   // Ambient light color
        ambientLightIntensity: 0.5,    // Ambient light intensity
        directionalLightColor: 0xffffff, // Directional light color
        directionalLightIntensity: 0.8, // Directional light intensity
        directionalLightPosition: {    // Directional light position
            x: 10,
            y: 20,
            z: 10
        }
    },

    // Object settings
    objects: {
        defaultColor: 0xffffff,        // Default object color (white)
        defaultScale: 1,              // Default object scale
        defaultPositionRange: 5,      // Range for random positioning (-5 to 5)
        gridSnapSize: 1,              // Grid snapping size
        maxZIndex: 100,               // Maximum z-index value
        materialProperties: {
            roughness: 0.7,           // Default material roughness
            metalness: 0.2            // Default material metalness
        }
    },

    // Object creation settings
    objectCreation: {
        cube: {
            width: 1,
            height: 1,
            depth: 1
        },
        sphere: {
            radius: 0.5,
            widthSegments: 16,
            heightSegments: 16
        },
        cylinder: {
            radiusTop: 0.5,
            radiusBottom: 0.5,
            height: 1,
            radialSegments: 16
        },
        ramp: {
            width: 2,
            height: 0.5,
            depth: 1
        }
    },

    // Layer settings
    layers: {
        defaultLayerName: "Layer",     // Default layer name prefix
        defaultLayerVisible: true,     // Default layer visibility
        maxLayers: 50                 // Maximum number of layers
    },

    // UI settings
    ui: {
        sidebarWidth: 350,            // Sidebar width in pixels
        panelSpacing: 15,             // Spacing between panels
        buttonSize: "40px",           // Button size
        colorPickerWidth: "100%",     // Color picker width
        sliderMin: 1,                 // Minimum slider value
        sliderMax: 5,                 // Maximum slider value
        sliderStep: 1                 // Slider step value
    },

    // Rendering settings
    rendering: {
        antialias: true,              // Enable antialiasing
        pixelRatio: window.devicePixelRatio || 1, // Device pixel ratio
        shadowMapEnabled: false,      // Enable shadow mapping
        toneMapping: "Linear",        // Tone mapping type
        toneMappingExposure: 1        // Tone mapping exposure
    },

    // Performance settings
    performance: {
        maxObjects: 1000,             // Maximum number of objects
        animationFrameRate: 60,       // Target animation frame rate
        renderQuality: "high"         // Render quality (low, medium, high)
    },

    // Keyboard shortcuts
    shortcuts: {
        addCube: "Ctrl+1",
        addSphere: "Ctrl+2",
        addCylinder: "Ctrl+3",
        addRamp: "Ctrl+4",
        clearScene: "Ctrl+Delete",
        resetCamera: "Ctrl+R",
        rotateClockwise: "Ctrl+Right",
        rotateCounterClockwise: "Ctrl+Left",
        moveUp: "ArrowUp",
        moveDown: "ArrowDown",
        moveLeft: "ArrowLeft",
        moveRight: "ArrowRight"
    },

    // Debug settings
    debug: {
        showStats: false,             // Show performance stats
        showBoundingBoxes: false,     // Show object bounding boxes
        showWireframes: false,        // Show wireframe mode
        logCameraChanges: false,      // Log camera position changes
        logObjectChanges: false       // Log object creation/modification
    }
};

// Export the configuration
export default config;