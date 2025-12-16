/**
 * State Management for Isometric 3D Editor
 * Handles application state, user preferences, and session data
 */

// Application State Manager
class StateManager {
    constructor() {
        // Initialize state from localStorage if available
        this.state = this.loadState() || this.getDefaultState();
        this.listeners = [];
    }

    /**
     * Get default application state
     * @returns {Object} Default state object
     */
    getDefaultState() {
        return {
            // Scene state
            scene: {
                backgroundColor: '#808080',
                currentCameraAngle: 0,
                cameraPosition: { x: 20, y: 20, z: 20 },
                gridVisible: true,
                axesVisible: true
            },

            // Object state
            objects: {
                selectedObjectId: null,
                lastCreatedObjectType: null,
                objectCount: 0,
                totalObjectsCreated: 0
            },

            // Layer state
            layers: {
                currentLayerId: 1,
                layerCount: 1,
                lastActiveLayer: 1
            },

            // UI state
            ui: {
                sidebarVisible: true,
                propertiesPanelVisible: false,
                layersPanelExpanded: true,
                objectsPanelExpanded: true,
                cameraPanelExpanded: true,
                scenePanelExpanded: true,
                activeTab: 'objects'
            },

            // Tool state
            tools: {
                currentTool: 'select',
                lastUsedTool: 'select',
                dragModeActive: false,
                snapToGrid: true,
                gridSize: 1
            },

            // User preferences
            preferences: {
                theme: 'dark',
                language: 'en',
                showTutorial: true,
                autoSave: false,
                saveInterval: 300, // 5 minutes in seconds
                showGrid: true,
                showAxes: true,
                defaultObjectColor: '#ffffff'
            },

            // Session data
            session: {
                lastSaveTime: null,
                sessionStartTime: new Date().toISOString(),
                unsavedChanges: false,
                projectName: 'Untitled Project',
                projectDescription: ''
            },

            // Recent files
            recentFiles: {
                files: [],
                maxRecentFiles: 5
            },

            // Undo/Redo stack
            history: {
                undoStack: [],
                redoStack: [],
                maxHistorySize: 50
            },

            // Performance metrics
            performance: {
                lastFrameTime: 0,
                averageFPS: 60,
                objectCount: 0,
                polygonCount: 0,
                memoryUsage: 0
            }
        };
    }

    /**
     * Get current state
     * @returns {Object} Current state
     */
    getState() {
        return this.state;
    }

    /**
     * Get specific state property
     * @param {string} path - Dot notation path to property
     * @returns {*} State property value
     */
    getStateProperty(path) {
        return path.split('.').reduce((obj, key) => obj?.[key], this.state);
    }

    /**
     * Set state property
     * @param {string} path - Dot notation path to property
     * @param {*} value - Value to set
     */
    setStateProperty(path, value) {
        const keys = path.split('.');
        let current = this.state;

        // Navigate to the parent object
        for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]];
        }

        // Set the final property
        current[keys[keys.length - 1]] = value;

        this.saveState();
        this.notifyListeners();
    }

    /**
     * Update state with new values
     * @param {Object} newState - Partial state to merge
     */
    updateState(newState) {
        this.state = { ...this.state, ...newState };
        this.saveState();
        this.notifyListeners();
    }

    /**
     * Reset state to defaults
     */
    resetState() {
        this.state = this.getDefaultState();
        this.saveState();
        this.notifyListeners();
    }

    /**
     * Save state to localStorage
     */
    saveState() {
        try {
            localStorage.setItem('3dEditorState', JSON.stringify(this.state));
        } catch (error) {
            console.error('Failed to save state:', error);
        }
    }

    /**
     * Load state from localStorage
     * @returns {Object|null} Loaded state or null if not found
     */
    loadState() {
        try {
            const savedState = localStorage.getItem('3dEditorState');
            return savedState ? JSON.parse(savedState) : null;
        } catch (error) {
            console.error('Failed to load state:', error);
            return null;
        }
    }

    /**
     * Clear saved state
     */
    clearState() {
        try {
            localStorage.removeItem('3dEditorState');
            this.state = this.getDefaultState();
            this.notifyListeners();
        } catch (error) {
            console.error('Failed to clear state:', error);
        }
    }

    /**
     * Add state change listener
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    subscribe(callback) {
        this.listeners.push(callback);

        return () => {
            this.listeners = this.listeners.filter(listener => listener !== callback);
        };
    }

    /**
     * Notify all listeners of state change
     */
    notifyListeners() {
        this.listeners.forEach(listener => listener(this.state));
    }

    // Scene-specific state methods
    setCameraAngle(angle) {
        this.setStateProperty('scene.currentCameraAngle', angle);
    }

    setCameraPosition(position) {
        this.setStateProperty('scene.cameraPosition', position);
    }

    setBackgroundColor(color) {
        this.setStateProperty('scene.backgroundColor', color);
    }

    // Object-specific state methods
    setSelectedObjectId(id) {
        this.setStateProperty('objects.selectedObjectId', id);
    }

    incrementObjectCount() {
        const currentCount = this.getStateProperty('objects.objectCount');
        this.setStateProperty('objects.objectCount', currentCount + 1);
        this.setStateProperty('objects.totalObjectsCreated', this.getStateProperty('objects.totalObjectsCreated') + 1);
    }

    // Layer-specific state methods
    setCurrentLayerId(id) {
        this.setStateProperty('layers.currentLayerId', id);
        this.setStateProperty('layers.lastActiveLayer', id);
    }

    incrementLayerCount() {
        const currentCount = this.getStateProperty('layers.layerCount');
        this.setStateProperty('layers.layerCount', currentCount + 1);
    }

    // UI-specific state methods
    togglePanelVisibility(panelName) {
        const currentVisibility = this.getStateProperty(`ui.${panelName}Visible`);
        this.setStateProperty(`ui.${panelName}Visible`, !currentVisibility);
    }

    setActiveTab(tabName) {
        this.setStateProperty('ui.activeTab', tabName);
    }

    // Tool-specific state methods
    setCurrentTool(toolName) {
        this.setStateProperty('tools.currentTool', toolName);
        this.setStateProperty('tools.lastUsedTool', toolName);
    }

    toggleSnapToGrid() {
        const currentSnap = this.getStateProperty('tools.snapToGrid');
        this.setStateProperty('tools.snapToGrid', !currentSnap);
    }

    // History management methods
    addToHistory(action) {
        const history = this.getStateProperty('history');
        history.undoStack.push(action);

        // Limit history size
        if (history.undoStack.length > history.maxHistorySize) {
            history.undoStack.shift();
        }

        // Clear redo stack when new action is added
        history.redoStack = [];

        this.updateState({ history });
    }

    undo() {
        const history = this.getStateProperty('history');
        if (history.undoStack.length > 0) {
            const action = history.undoStack.pop();
            history.redoStack.push(action);
            this.updateState({ history });
            return action;
        }
        return null;
    }

    redo() {
        const history = this.getStateProperty('history');
        if (history.redoStack.length > 0) {
            const action = history.redoStack.pop();
            history.undoStack.push(action);
            this.updateState({ history });
            return action;
        }
        return null;
    }

    // Performance tracking methods
    updatePerformanceMetrics(metrics) {
        this.updateState({
            performance: {
                ...this.getStateProperty('performance'),
                ...metrics
            }
        });
    }
}

// Create and export state manager instance
const stateManager = new StateManager();
export { stateManager };