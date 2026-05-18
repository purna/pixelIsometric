/**
 * State Management for Isometric 3D Editor
 * Handles application state, user preferences, and session data
 */

class StateManager {
    constructor() {
        this.state = this.loadState() || this.getDefaultState();
        this.listeners = [];
    }

    getDefaultState() {
        return {
            scene: {
                backgroundColor: '#808080',
                currentCameraAngle: 0,
                cameraPosition: { x: 20, y: 20, z: 20 },
                gridVisible: true,
                axesVisible: true
            },
            objects: {
                selectedObjectId: null,
                lastCreatedObjectType: null,
                objectCount: 0,
                totalObjectsCreated: 0
            },
            layers: {
                currentLayerId: 1,
                layerCount: 1,
                lastActiveLayer: 1
            },
            ui: {
                sidebarVisible: true,
                propertiesPanelVisible: false,
                layersPanelExpanded: true,
                objectsPanelExpanded: true,
                cameraPanelExpanded: true,
                scenePanelExpanded: true,
                activeTab: 'objects'
            },
            tools: {
                currentTool: 'select',
                lastUsedTool: 'select',
                dragModeActive: false,
                snapToGrid: true,
                gridSize: 1,
                currentPaintMaterial: 'grass',
                terrainHeight: 0.25
            },
            preferences: {
                theme: 'dark',
                language: 'en',
                showTutorial: true,
                autoSave: false,
                saveInterval: 300,
                showGrid: true,
                showAxes: true,
                defaultObjectColor: '#ffffff',
                materialDownloadSize: 512,
                showOutlines: true
            },
            session: {
                lastSaveTime: null,
                sessionStartTime: new Date().toISOString(),
                unsavedChanges: false,
                projectName: 'Untitled Project',
                projectDescription: ''
            },
            recentFiles: {
                files: [],
                maxRecentFiles: 5
            },
            history: {
                undoStack: [],
                redoStack: [],
                maxHistorySize: 50
            },
            performance: {
                lastFrameTime: 0,
                averageFPS: 60,
                objectCount: 0,
                polygonCount: 0,
                memoryUsage: 0
            }
        };
    }

    getState() {
        return this.state;
    }

    getStateProperty(path) {
        return path.split('.').reduce((obj, key) => obj?.[key], this.state);
    }

    setStateProperty(path, value) {
        const keys = path.split('.');
        let current = this.state;

        for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]];
        }

        current[keys[keys.length - 1]] = value;
        this.saveState();
        this.notifyListeners();
    }

    updateState(newState) {
        this.state = { ...this.state, ...newState };
        this.saveState();
        this.notifyListeners();
    }

    resetState() {
        this.state = this.getDefaultState();
        this.saveState();
        this.notifyListeners();
    }

    saveState() {
        try {
            localStorage.setItem('isometricEditorState', JSON.stringify(this.state));
        } catch (error) {
            console.error('Failed to save state:', error);
        }
    }

    loadState() {
        try {
            const savedState = localStorage.getItem('isometricEditorState');
            return savedState ? JSON.parse(savedState) : null;
        } catch (error) {
            console.error('Failed to load state:', error);
            return null;
        }
    }

    clearState() {
        try {
            localStorage.removeItem('isometricEditorState');
            this.state = this.getDefaultState();
            this.notifyListeners();
        } catch (error) {
            console.error('Failed to clear state:', error);
        }
    }

    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(listener => listener !== callback);
        };
    }

    notifyListeners() {
        this.listeners.forEach(listener => listener(this.state));
    }

    // State helper methods
    setCameraAngle(angle) {
        this.setStateProperty('scene.currentCameraAngle', angle);
    }

    setCameraPosition(position) {
        this.setStateProperty('scene.cameraPosition', position);
    }

    setBackgroundColor(color) {
        this.setStateProperty('scene.backgroundColor', color);
    }

    setSelectedObjectId(id) {
        this.setStateProperty('objects.selectedObjectId', id);
    }

    incrementObjectCount() {
        const currentCount = this.getStateProperty('objects.objectCount');
        this.setStateProperty('objects.objectCount', currentCount + 1);
        this.setStateProperty('objects.totalObjectsCreated', this.getStateProperty('objects.totalObjectsCreated') + 1);
    }

    setCurrentLayerId(id) {
        this.setStateProperty('layers.currentLayerId', id);
        this.setStateProperty('layers.lastActiveLayer', id);
    }

    incrementLayerCount() {
        const currentCount = this.getStateProperty('layers.layerCount');
        this.setStateProperty('layers.layerCount', currentCount + 1);
    }

    setCurrentPaintMaterial(type) {
        this.setStateProperty('tools.currentPaintMaterial', type);
    }

    getCurrentPaintMaterial() {
        return this.getStateProperty('tools.currentPaintMaterial') || 'grass';
    }

    setTerrainHeight(height) {
        this.setStateProperty('tools.terrainHeight', height);
    }

    getTerrainHeight() {
        return this.getStateProperty('tools.terrainHeight') || 0.25;
    }

    togglePanelVisibility(panelName) {
        const currentVisibility = this.getStateProperty(`ui.${panelName}Visible`);
        this.setStateProperty(`ui.${panelName}Visible`, !currentVisibility);
    }

    setActiveTab(tabName) {
        this.setStateProperty('ui.activeTab', tabName);
    }

    setCurrentTool(toolName) {
        this.setStateProperty('tools.currentTool', toolName);
        this.setStateProperty('tools.lastUsedTool', toolName);
    }

    toggleSnapToGrid() {
        const currentSnap = this.getStateProperty('tools.snapToGrid');
        this.setStateProperty('tools.snapToGrid', !currentSnap);
    }

    addToHistory(action) {
        const history = this.getStateProperty('history');
        history.undoStack.push(action);

        if (history.undoStack.length > history.maxHistorySize) {
            history.undoStack.shift();
        }

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

    updatePerformanceMetrics(metrics) {
        this.updateState({
            performance: {
                ...this.getStateProperty('performance'),
                ...metrics
            }
        });
    }
}

const stateManager = new StateManager();
export { stateManager };
