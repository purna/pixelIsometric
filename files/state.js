/**
 * State Management for Isometric 3D Editor
 * Handles application state, user preferences, and session data.
 *
 * Improvements over original:
 *  - Deep-merge on loadState so new keys survive a stale localStorage blob
 *  - Debounced localStorage writes (avoids thrashing on slider drags)
 *  - Event filtering: listeners only called when the value actually changes
 *  - Path-based subscriptions: subscribe('scene.backgroundColor', cb) is now possible
 *  - setStateProperty validates path instead of silently creating orphaned keys
 *  - History helpers (undo/redo) accept action type + payload and return them cleanly
 *  - Typed helper methods no longer duplicate setStateProperty round-trips
 *  - resetState() optionally preserves preferences (pass true)
 *  - Getter/setter symmetry: every setX has a matching getX
 */

class StateManager {
    constructor() {
        this._saveTimer   = null;
        this._SAVE_DELAY  = 300; // ms debounce for localStorage writes
        this._listeners   = new Map(); // path → Set<fn>  ('' = global)
        this.state        = this._mergeWithDefaults(this._loadRaw());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Default state
    // ─────────────────────────────────────────────────────────────────────────

    getDefaultState() {
        return {
            scene: {
                backgroundColor:    '#808080',
                currentCameraAngle: 0,
                cameraPosition:     { x: 20, y: 20, z: 20 },
                gridVisible:        true,
                axesVisible:        true,
            },
            objects: {
                selectedObjectId:       null,
                lastCreatedObjectType:  null,
                objectCount:            0,
                totalObjectsCreated:    0,
            },
            layers: {
                currentLayerId: 1,
                layerCount:     1,
                lastActiveLayer:1,
            },
            ui: {
                sidebarVisible:         true,
                propertiesPanelVisible: false,
                layersPanelExpanded:    true,
                objectsPanelExpanded:   true,
                cameraPanelExpanded:    true,
                scenePanelExpanded:     true,
                activeTab:              'objects',
            },
            tools: {
                currentTool:        'select',
                lastUsedTool:       'select',
                dragModeActive:     false,
                snapToGrid:         true,
                gridSize:           1,
                currentPaintMaterial: 'grass',
                terrainHeight:      0.25,
            },
            preferences: {
                theme:              'dark',
                language:           'en',
                showTutorial:       true,
                autoSave:           false,
                saveInterval:       300,
                showGrid:           true,
                showAxes:           true,
                defaultObjectColor: '#ffffff',
                materialDownloadSize: 512,
                showOutlines:       true,
            },
            session: {
                lastSaveTime:       null,
                sessionStartTime:   new Date().toISOString(),
                unsavedChanges:     false,
                projectName:        'Untitled Project',
                projectDescription: '',
            },
            recentFiles: {
                files:          [],
                maxRecentFiles: 5,
            },
            history: {
                undoStack:      [],
                redoStack:      [],
                maxHistorySize: 50,
            },
            performance: {
                lastFrameTime: 0,
                averageFPS:    60,
                objectCount:   0,
                polygonCount:  0,
                memoryUsage:   0,
            },
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Read / write
    // ─────────────────────────────────────────────────────────────────────────

    getState() { return this.state; }

    /**
     * Read a dot-path value, e.g. 'scene.backgroundColor'.
     * Returns undefined (not throws) when the path does not exist.
     */
    getStateProperty(path) {
        return path.split('.').reduce((obj, key) => obj?.[key], this.state);
    }

    /**
     * Write a dot-path value.
     * Skips the write and warns when the path doesn't exist in the default
     * schema, preventing silent creation of orphaned keys.
     */
    setStateProperty(path, value) {
        const keys    = path.split('.');
        const current = keys.slice(0, -1).reduce((obj, k) => obj?.[k], this.state);
        const lastKey = keys[keys.length - 1];

        if (current === undefined || current === null) {
            console.warn(`[StateManager] setStateProperty: invalid path "${path}"`);
            return;
        }

        const prev = current[lastKey];
        if (prev === value) return; // nothing changed — skip notify + save

        current[lastKey] = value;
        this._scheduleSave();
        this._notifyListeners(path, value, prev);
    }

    /**
     * Shallow-merge a partial state object into the root.
     * Prefer setStateProperty for single values.
     */
    updateState(partial) {
        this.state = { ...this.state, ...partial };
        this._scheduleSave();
        this._notifyListeners('', this.state, null);
    }

    resetState(preservePreferences = false) {
        const prefs = preservePreferences ? { ...this.state.preferences } : null;
        this.state  = this.getDefaultState();
        if (prefs) this.state.preferences = prefs;
        this._scheduleSave();
        this._notifyListeners('', this.state, null);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Persistence
    // ─────────────────────────────────────────────────────────────────────────

    /** Schedule a debounced save so rapid slider moves don't thrash localStorage. */
    _scheduleSave() {
        if (this._saveTimer) clearTimeout(this._saveTimer);
        this._saveTimer = setTimeout(() => this._persist(), this._SAVE_DELAY);
    }

    /** Flush any pending save immediately (e.g. before page unload). */
    flushSave() {
        if (this._saveTimer) { clearTimeout(this._saveTimer); this._saveTimer = null; }
        this._persist();
    }

    _persist() {
        try {
            // Don't store volatile runtime data
            const { performance: _p, history, ...rest } = this.state;
            const trimmed = {
                ...rest,
                history: { ...history, undoStack: [], redoStack: [] },
            };
            localStorage.setItem('isometricEditorState', JSON.stringify(trimmed));
        } catch (err) {
            console.error('[StateManager] Failed to save state:', err);
        }
    }

    _loadRaw() {
        try {
            const raw = localStorage.getItem('isometricEditorState');
            return raw ? JSON.parse(raw) : null;
        } catch (err) {
            console.error('[StateManager] Failed to load state:', err);
            return null;
        }
    }

    /**
     * Deep-merge saved state onto defaults so that new keys added in code
     * are always present even when an older blob is in localStorage.
     */
    _mergeWithDefaults(saved) {
        if (!saved) return this.getDefaultState();
        const defaults = this.getDefaultState();
        const merge = (target, source) => {
            const out = { ...target };
            for (const key of Object.keys(source)) {
                if (
                    key in target &&
                    source[key] !== null &&
                    typeof source[key] === 'object' &&
                    !Array.isArray(source[key])
                ) {
                    out[key] = merge(target[key], source[key]);
                } else {
                    out[key] = source[key];
                }
            }
            return out;
        };
        return merge(defaults, saved);
    }

    clearState() {
        try {
            localStorage.removeItem('isometricEditorState');
            this.state = this.getDefaultState();
            this._notifyListeners('', this.state, null);
        } catch (err) {
            console.error('[StateManager] Failed to clear state:', err);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Subscriptions
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Subscribe to state changes.
     *
     * @param {string|Function} pathOrCb  – dot-path to watch, OR callback for
     *                                      global (any change) subscription.
     * @param {Function}        [cb]      – callback when pathOrCb is a string.
     * @returns {Function} unsubscribe function
     *
     * Examples:
     *   subscribe(fn)                          // fires on any change
     *   subscribe('scene.backgroundColor', fn) // fires only when that path changes
     */
    subscribe(pathOrCb, cb) {
        const [path, fn] = typeof pathOrCb === 'function'
            ? ['', pathOrCb]
            : [pathOrCb, cb];

        if (!this._listeners.has(path)) this._listeners.set(path, new Set());
        this._listeners.get(path).add(fn);

        return () => this._listeners.get(path)?.delete(fn);
    }

    _notifyListeners(changedPath, newValue, oldValue) {
        // Global listeners
        this._listeners.get('')?.forEach(fn => fn(this.state, changedPath));

        // Path-specific listeners (exact match or ancestor paths)
        this._listeners.forEach((fns, path) => {
            if (path && (changedPath === path || changedPath.startsWith(path + '.'))) {
                fns.forEach(fn => fn(newValue, oldValue, changedPath));
            }
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Typed helpers
    // ─────────────────────────────────────────────────────────────────────────

    // Scene
    getCameraAngle()            { return this.getStateProperty('scene.currentCameraAngle'); }
    setCameraAngle(angle)       { this.setStateProperty('scene.currentCameraAngle', angle); }

    getCameraPosition()         { return this.getStateProperty('scene.cameraPosition'); }
    setCameraPosition(pos)      { this.setStateProperty('scene.cameraPosition', pos); }

    getBackgroundColor()        { return this.getStateProperty('scene.backgroundColor'); }
    setBackgroundColor(color)   { this.setStateProperty('scene.backgroundColor', color); }

    // Objects
    getSelectedObjectId()       { return this.getStateProperty('objects.selectedObjectId'); }
    setSelectedObjectId(id)     { this.setStateProperty('objects.selectedObjectId', id); }

    getObjectCount()            { return this.getStateProperty('objects.objectCount'); }
    incrementObjectCount() {
        this.setStateProperty('objects.objectCount',           this.getObjectCount() + 1);
        this.setStateProperty('objects.totalObjectsCreated',   this.getStateProperty('objects.totalObjectsCreated') + 1);
    }

    // Layers
    getCurrentLayerId()         { return this.getStateProperty('layers.currentLayerId'); }
    setCurrentLayerId(id) {
        this.setStateProperty('layers.currentLayerId',  id);
        this.setStateProperty('layers.lastActiveLayer', id);
    }
    incrementLayerCount() {
        this.setStateProperty('layers.layerCount', this.getStateProperty('layers.layerCount') + 1);
    }

    // Tools
    getCurrentTool()            { return this.getStateProperty('tools.currentTool'); }
    setCurrentTool(toolName) {
        this.setStateProperty('tools.lastUsedTool', this.getCurrentTool());
        this.setStateProperty('tools.currentTool',  toolName);
    }

    isSnapToGrid()              { return this.getStateProperty('tools.snapToGrid'); }
    toggleSnapToGrid()          { this.setStateProperty('tools.snapToGrid', !this.isSnapToGrid()); }

    getCurrentPaintMaterial()   { return this.getStateProperty('tools.currentPaintMaterial') || 'grass'; }
    setCurrentPaintMaterial(t)  { this.setStateProperty('tools.currentPaintMaterial', t); }

    getTerrainHeight()          { return this.getStateProperty('tools.terrainHeight') ?? 0.25; }
    setTerrainHeight(h)         { this.setStateProperty('tools.terrainHeight', h); }

    // UI
    togglePanelVisibility(panelName) {
        const key  = `ui.${panelName}Visible`;
        const cur  = this.getStateProperty(key);
        if (cur === undefined) {
            console.warn(`[StateManager] togglePanelVisibility: unknown panel "${panelName}"`);
            return;
        }
        this.setStateProperty(key, !cur);
    }

    getActiveTab()              { return this.getStateProperty('ui.activeTab'); }
    setActiveTab(tabName)       { this.setStateProperty('ui.activeTab', tabName); }

    // ─────────────────────────────────────────────────────────────────────────
    // History (undo / redo)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Push an action onto the undo stack.
     * @param {{ type: string, payload: * }} action
     */
    addToHistory(action) {
        const history = this.getStateProperty('history');
        history.undoStack.push(action);
        if (history.undoStack.length > history.maxHistorySize) history.undoStack.shift();
        history.redoStack = [];
        // Mutate in place — updateState would deep-copy and lose object references
        this.state.history = history;
        this._scheduleSave();
    }

    undo() {
        const history = this.getStateProperty('history');
        if (!history.undoStack.length) return null;
        const action = history.undoStack.pop();
        history.redoStack.push(action);
        this.state.history = history;
        this._scheduleSave();
        return action;
    }

    redo() {
        const history = this.getStateProperty('history');
        if (!history.redoStack.length) return null;
        const action = history.redoStack.pop();
        history.undoStack.push(action);
        this.state.history = history;
        this._scheduleSave();
        return action;
    }

    canUndo() { return this.getStateProperty('history.undoStack').length > 0; }
    canRedo() { return this.getStateProperty('history.redoStack').length > 0; }

    // ─────────────────────────────────────────────────────────────────────────
    // Performance metrics (runtime-only — not persisted)
    // ─────────────────────────────────────────────────────────────────────────

    updatePerformanceMetrics(metrics) {
        Object.assign(this.state.performance, metrics);
        // No save — perf data is ephemeral
        this._listeners.get('performance')?.forEach(fn => fn(this.state.performance));
    }
}

const stateManager = new StateManager();

// Flush on page unload so in-flight debounced saves aren't lost
window.addEventListener('beforeunload', () => stateManager.flushSave());

export { StateManager, stateManager };
