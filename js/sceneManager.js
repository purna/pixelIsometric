/**
 * Scene Manager for Isometric 3D Editor
 * Handles scene-related functionality including background management, scene settings, and scene operations
 */

import { stateManager } from './state.js';
import config from './config.js';

class SceneManager {
    /**
     * Initialize the Scene Manager
     * @param {THREE.Scene} scene - Three.js scene instance
     */
    constructor(scene) {
        this.scene = scene;
        this.currentBackgroundColor = config.scene.backgroundColor;
        this.setupScene();
    }

    /**
     * Set up initial scene configuration
     */
    setupScene() {
        // Set initial background color
        this.setBackgroundColor(this.currentBackgroundColor);

        // Initialize state with current scene settings
        stateManager.setStateProperty('scene.backgroundColor', this.hexToString(this.currentBackgroundColor));
    }

    /**
     * Set scene background color
     * @param {string|number} color - Color in hex string (#RRGGBB) or hex number (0xRRGGBB) format
     */
    setBackgroundColor(color) {
        // Convert string color to hex number if needed
        let colorHex = color;
        if (typeof color === 'string' && color.startsWith('#')) {
            colorHex = this.stringToHex(color);
        }

        // Update scene background
        this.scene.background = new THREE.Color(colorHex);
        this.currentBackgroundColor = colorHex;

        // Update state
        stateManager.setBackgroundColor(this.hexToString(colorHex));
        stateManager.addToHistory({
            action: 'change_background',
            color: this.hexToString(colorHex)
        });

        return colorHex;
    }

    /**
     * Get current background color
     * @returns {string} Current background color in hex string format (#RRGGBB)
     */
    getBackgroundColor() {
        return this.hexToString(this.currentBackgroundColor);
    }

    /**
     * Reset background color to default
     */
    resetBackgroundColor() {
        this.setBackgroundColor(config.scene.backgroundColor);
    }

    /**
     * Set scene background to a gradient
     * @param {string} color1 - First gradient color
     * @param {string} color2 - Second gradient color
     * @param {string} direction - Gradient direction ('horizontal' or 'vertical')
     */
    setGradientBackground(color1, color2, direction = 'vertical') {
        // For Three.js, we'll create a canvas texture for the gradient
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;

        const context = canvas.getContext('2d');
        const gradient = direction === 'vertical'
            ? context.createLinearGradient(0, 0, 0, canvas.height)
            : context.createLinearGradient(0, 0, canvas.width, 0);

        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);

        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);

        const texture = new THREE.CanvasTexture(canvas);
        this.scene.background = texture;

        // Store gradient information in state
        stateManager.updateState({
            scene: {
                ...stateManager.getStateProperty('scene'),
                backgroundType: 'gradient',
                gradientColors: [color1, color2],
                gradientDirection: direction
            }
        });

        stateManager.addToHistory({
            action: 'change_background_gradient',
            color1: color1,
            color2: color2,
            direction: direction
        });
    }

    /**
     * Set scene background to an image
     * @param {string} imageUrl - URL of the background image
     * @param {Function} callback - Callback function when image is loaded
     */
    setImageBackground(imageUrl, callback) {
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
            imageUrl,
            (texture) => {
                this.scene.background = texture;

                // Update state
                stateManager.updateState({
                    scene: {
                        ...stateManager.getStateProperty('scene'),
                        backgroundType: 'image',
                        backgroundImage: imageUrl
                    }
                });

                stateManager.addToHistory({
                    action: 'change_background_image',
                    imageUrl: imageUrl
                });

                if (callback) callback();
            },
            undefined,
            (error) => {
                console.error('Failed to load background image:', error);
                if (callback) callback(error);
            }
        );
    }

    /**
     * Reset scene background to solid color (removes gradients/images)
     */
    resetBackgroundToSolidColor() {
        this.setBackgroundColor(this.currentBackgroundColor);

        // Update state to indicate solid color background
        stateManager.updateState({
            scene: {
                ...stateManager.getStateProperty('scene'),
                backgroundType: 'solid'
            }
        });
    }

    /**
     * Apply a preset background theme
     * @param {string} themeName - Name of the theme to apply
     */
    applyBackgroundTheme(themeName) {
        const themes = {
            'default': config.scene.backgroundColor,
            'dark': 0x222222,
            'light': 0xf0f0f0,
            'blue': 0x1e90ff,
            'green': 0x2e8b57,
            'sky': 0x87ceeb,
            'space': 0x000033,
            'sunset': this.createGradientTheme('#ff7e5f', '#feb47b', 'vertical'),
            'ocean': this.createGradientTheme('#00c6ff', '#0072ff', 'vertical'),
            'forest': this.createGradientTheme('#56ab2f', '#a8e063', 'vertical')
        };

        if (themes[themeName]) {
            if (typeof themes[themeName] === 'function') {
                // It's a gradient theme
                themes[themeName]();
            } else {
                // It's a solid color theme
                this.setBackgroundColor(themes[themeName]);
            }

            // Update state with current theme
            stateManager.setStateProperty('scene.currentTheme', themeName);
            stateManager.addToHistory({
                action: 'apply_background_theme',
                theme: themeName
            });
        } else {
            console.warn(`Unknown theme: ${themeName}`);
        }
    }

    /**
     * Create a gradient theme function
     * @param {string} color1 - First gradient color
     * @param {string} color2 - Second gradient color
     * @param {string} direction - Gradient direction
     * @returns {Function} Function that applies the gradient
     */
    createGradientTheme(color1, color2, direction) {
        return () => this.setGradientBackground(color1, color2, direction);
    }

    /**
     * Cycle through available background themes
     */
    cycleBackgroundThemes() {
        const themes = Object.keys(this.getAvailableThemes());
        const currentTheme = stateManager.getStateProperty('scene.currentTheme') || 'default';
        const currentIndex = themes.indexOf(currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        const nextTheme = themes[nextIndex];

        this.applyBackgroundTheme(nextTheme);
    }

    /**
     * Get available background themes
     * @returns {Object} Available themes with their descriptions
     */
    getAvailableThemes() {
        return {
            'default': 'Default gray background',
            'dark': 'Dark theme for better contrast',
            'light': 'Light theme for bright environments',
            'blue': 'Blue ocean theme',
            'green': 'Nature green theme',
            'sky': 'Sky blue theme',
            'space': 'Deep space theme',
            'sunset': 'Sunset gradient theme',
            'ocean': 'Ocean gradient theme',
            'forest': 'Forest gradient theme'
        };
    }

    /**
     * Adjust background brightness
     * @param {number} factor - Brightness factor (0.1 to 2.0)
     */
    adjustBackgroundBrightness(factor) {
        if (this.scene.background instanceof THREE.Color) {
            const currentColor = this.scene.background.clone();
            currentColor.multiplyScalar(factor);

            // Ensure values stay within valid range
            currentColor.r = Math.min(1, Math.max(0, currentColor.r));
            currentColor.g = Math.min(1, Math.max(0, currentColor.g));
            currentColor.b = Math.min(1, Math.max(0, currentColor.b));

            this.scene.background = currentColor;
            this.currentBackgroundColor = currentColor.getHex();

            // Update state
            stateManager.setBackgroundColor(this.hexToString(this.currentBackgroundColor));
            stateManager.addToHistory({
                action: 'adjust_background_brightness',
                factor: factor,
                newColor: this.hexToString(this.currentBackgroundColor)
            });
        }
    }

    /**
     * Toggle grid visibility
     * @param {boolean} visible - Whether to show the grid
     */
    toggleGridVisibility(visible) {
        const gridHelper = this.scene.children.find(child => child.type === 'GridHelper');
        if (gridHelper) {
            gridHelper.visible = visible;
        }

        stateManager.setStateProperty('scene.gridVisible', visible);
        stateManager.addToHistory({
            action: 'toggle_grid',
            visible: visible
        });
    }

    /**
     * Toggle axes helper visibility
     * @param {boolean} visible - Whether to show the axes
     */
    toggleAxesVisibility(visible) {
        const axesHelper = this.scene.children.find(child => child.type === 'AxesHelper');
        if (axesHelper) {
            axesHelper.visible = visible;
        }

        stateManager.setStateProperty('scene.axesVisible', visible);
        stateManager.addToHistory({
            action: 'toggle_axes',
            visible: visible
        });
    }

    /**
     * Update scene fog settings
     * @param {string|number} color - Fog color
     * @param {number} near - Near fog distance
     * @param {number} far - Far fog distance
     */
    updateFog(color, near, far) {
        let fogColor = color;
        if (typeof color === 'string' && color.startsWith('#')) {
            fogColor = this.stringToHex(color);
        }

        this.scene.fog = new THREE.Fog(fogColor, near, far);

        stateManager.updateState({
            scene: {
                ...stateManager.getStateProperty('scene'),
                fogColor: this.hexToString(fogColor),
                fogNear: near,
                fogFar: far
            }
        });

        stateManager.addToHistory({
            action: 'update_fog',
            color: this.hexToString(fogColor),
            near: near,
            far: far
        });
    }

    /**
     * Remove fog from scene
     */
    removeFog() {
        this.scene.fog = null;

        stateManager.updateState({
            scene: {
                ...stateManager.getStateProperty('scene'),
                fogColor: null,
                fogNear: null,
                fogFar: null
            }
        });

        stateManager.addToHistory({
            action: 'remove_fog'
        });
    }

    /**
     * Save current scene settings to state
     */
    saveSceneSettings() {
        const sceneState = {
            backgroundColor: this.getBackgroundColor(),
            backgroundType: stateManager.getStateProperty('scene.backgroundType') || 'solid',
            gridVisible: stateManager.getStateProperty('scene.gridVisible'),
            axesVisible: stateManager.getStateProperty('scene.axesVisible'),
            fogSettings: this.scene.fog ? {
                color: this.hexToString(this.scene.fog.color.getHex()),
                near: this.scene.fog.near,
                far: this.scene.fog.far
            } : null
        };

        stateManager.updateState({
            scene: sceneState
        });
    }

    /**
     * Load scene settings from state
     */
    loadSceneSettings() {
        const sceneState = stateManager.getStateProperty('scene') || {};

        if (sceneState.backgroundColor) {
            this.setBackgroundColor(sceneState.backgroundColor);
        }

        if (sceneState.gridVisible !== undefined) {
            this.toggleGridVisibility(sceneState.gridVisible);
        }

        if (sceneState.axesVisible !== undefined) {
            this.toggleAxesVisibility(sceneState.axesVisible);
        }

        if (sceneState.fogSettings) {
            this.updateFog(
                sceneState.fogSettings.color,
                sceneState.fogSettings.near,
                sceneState.fogSettings.far
            );
        }
    }

    // Utility methods

    /**
     * Convert hex string to hex number
     * @param {string} hexString - Hex string (#RRGGBB)
     * @returns {number} Hex number (0xRRGGBB)
     */
    stringToHex(hexString) {
        // Remove # if present
        hexString = hexString.replace('#', '');

        // Convert to hex number
        return parseInt(hexString, 16);
    }

    /**
     * Convert hex number to hex string
     * @param {number} hexNumber - Hex number (0xRRGGBB)
     * @returns {string} Hex string (#RRGGBB)
     */
    hexToString(hexNumber) {
        // Ensure it's a valid hex number
        if (typeof hexNumber !== 'number') {
            return '#000000';
        }

        // Convert to 6-digit hex string
        let hexString = hexNumber.toString(16);

        // Pad with leading zeros if needed
        while (hexString.length < 6) {
            hexString = '0' + hexString;
        }

        return '#' + hexString;
    }

    /**
     * Generate a random pastel color
     * @returns {string} Random pastel color in hex string format
     */
    generateRandomPastelColor() {
        // Generate random RGB values with higher minimum for pastel colors
        const r = Math.floor(Math.random() * 128 + 128);
        const g = Math.floor(Math.random() * 128 + 128);
        const b = Math.floor(Math.random() * 128 + 128);

        return this.rgbToHex(r, g, b);
    }

    /**
     * Convert RGB to hex string
     * @param {number} r - Red component (0-255)
     * @param {number} g - Green component (0-255)
     * @param {number} b - Blue component (0-255)
     * @returns {string} Hex string (#RRGGBB)
     */
    rgbToHex(r, g, b) {
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    /**
     * Get complementary color
     * @param {string|number} color - Input color
     * @returns {string} Complementary color in hex string format
     */
    getComplementaryColor(color) {
        let hexNumber = color;
        if (typeof color === 'string') {
            hexNumber = this.stringToHex(color);
        }

        // Convert to RGB
        const r = (hexNumber >> 16) & 0xff;
        const g = (hexNumber >> 8) & 0xff;
        const b = hexNumber & 0xff;

        // Calculate complementary color
        const compR = 255 - r;
        const compG = 255 - g;
        const compB = 255 - b;

        return this.rgbToHex(compR, compG, compB);
    }
}

// Export the SceneManager class
export { SceneManager };