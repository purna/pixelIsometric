/**
 * Configuration file for Isometric 3D Editor
 * Stage 1: added objectCreation defaults for stairs, roof, pyramid, bridge
 */

const config = {
    camera: {
        initialAngle:       0,
        distance:           20,
        fov:                75,
        near:               0.1,
        far:                1000,
        orthographicSize:   20,
        enableDamping:      true,
        dampingFactor:      0.05,
        minDistance:        5,
        maxDistance:        50
    },

    scene: {
        backgroundColor:            0x808080,
        gridSize:                   100,
        gridDivisions:              20,
        gridColor1:                 0x333333,
        gridColor2:                 0x333333,
        axesHelperSize:             5,
        ambientLightColor:          0x404040,
        ambientLightIntensity:      0.5,
        directionalLightColor:      0xffffff,
        directionalLightIntensity:  0.8,
        directionalLightPosition:   { x: 10, y: 20, z: 10 }
    },

    objects: {
        defaultColor:         0xffffff,
        defaultScale:         1,
        defaultPositionRange: 5,
        gridSnapSize:         1,
        maxZIndex:            100,
        materialProperties: {
            roughness: 0.7,
            metalness: 0.2
        }
    },

    objectCreation: {
        cube: {
            width: 1, height: 1, depth: 1
        },
        sphere: {
            radius: 0.5, widthSegments: 16, heightSegments: 16
        },
        cylinder: {
            radiusTop: 0.5, radiusBottom: 0.5, height: 1, radialSegments: 16
        },
        ramp: {
            width: 1, height: 0.5, depth: 1
        },
        terrain: {
            width: 1, length: 1, height: 0.25, segments: 1
        },
        wall: {
            width: 1, height: 2, depth: 0.2
        },
        building: {
            width: 2, height: 3, depth: 2
        },
        path: {
            width: 1, length: 1, thickness: 0.05
        },
        river: {
            width: 1, length: 1, thickness: 0.05, curveIntensity: 0.3
        },
        window: {
            width: 0.3, height: 0.5, frameWidth: 0.05
        },
        door: {
            width: 0.8, height: 1.8, frameWidth: 0.1
        },

        // ── Stage 1 additions ─────────────────────────────────────────
        stairs: {
            steps:      4,
            width:      1,
            stepHeight: 0.25,
            stepDepth:  0.5
        },
        roof: {
            width:    2,
            depth:    2,
            height:   0.8,
            overhang: 0.1
        },
        pyramid: {
            base:   1,
            height: 1.5
        },
        bridge: {
            width:      1,
            span:       3,
            deckHeight: 0.15,
            pierHeight: 1,
            pierWidth:  0.2,
            clearance:  0.5
        }
    },

    textures: {
        basePath:    'gfx/textures/',
        defaultTile: 'grass.png',
        tileSize:    64,
        spriteSheet: 'tileset.png',
        materials: {
            grass:       { color: 0x7CFC00, roughness: 0.9,  metalness: 0.0 },
            dirt:        { color: 0x8B4513, roughness: 0.95, metalness: 0.0 },
            stone:       { color: 0x808080, roughness: 0.8,  metalness: 0.2 },
            wood:        { color: 0x8B4513, roughness: 0.7,  metalness: 0.1 },
            brick:       { color: 0xB22222, roughness: 0.85, metalness: 0.1 },
            sand:        { color: 0xF4A460, roughness: 0.95, metalness: 0.0 },
            water:       { color: 0x1E90FF, roughness: 0.1,  metalness: 0.8, transparent: true, opacity: 0.7 },
            cobblestone: { color: 0x696969, roughness: 0.9,  metalness: 0.1 },
            roof:        { color: 0x8B0000, roughness: 0.8,  metalness: 0.2 },
            snow:        { color: 0xEEEEFF, roughness: 0.9,  metalness: 0.0 },
            lava:        { color: 0xFF4500, roughness: 0.6,  metalness: 0.1, emissive: 0xFF2000, emissiveIntensity: 0.3 }
        }
    },

    export: {
        unity: {
            defaultCellSize:          1,
            defaultColliderType:      'box',
            includeCollidersByDefault: true,
            generatePrefab:           true,
            tilemapLayerName:         'IsometricTiles',
            gridOrientation:          'isometric',
            shadowsEnabled:           true
        },
        obj: {
            includeNormals: true,
            includeUVs:     true,
            scale:          1.0
        },
        stl: {
            binary: true,
            scale:  1.0
        }
    },

    layers: {
        defaultLayerName:    'Layer',
        defaultLayerVisible: true,
        maxLayers:           50
    },

    ui: {
        sidebarWidth:     350,
        panelSpacing:     15,
        buttonSize:       '40px',
        colorPickerWidth: '100%',
        sliderMin:        1,
        sliderMax:        5,
        sliderStep:       1
    },

    rendering: {
        antialias:              true,
        pixelRatio:             window.devicePixelRatio || 1,
        shadowMapEnabled:       true,     // Stage 1: enable shadow map
        shadowMapType:          'PCFSoft', // prettier soft shadows
        toneMapping:            'Linear',
        toneMappingExposure:    1
    },

    performance: {
        maxObjects:         1000,
        animationFrameRate: 60,
        renderQuality:      'high'
    },

    shortcuts: {
        addCube:                  'Ctrl+1',
        addSphere:                'Ctrl+2',
        addCylinder:              'Ctrl+3',
        addRamp:                  'Ctrl+4',
        clearScene:               'Ctrl+Delete',
        resetCamera:              'Ctrl+R',
        rotateClockwise:          'Ctrl+Right',
        rotateCounterClockwise:   'Ctrl+Left'
    },

    debug: {
        showStats:         false,
        showBoundingBoxes: false,
        showWireframes:    false,
        logCameraChanges:  false,
        logObjectChanges:  false
    }
};

export default config;
