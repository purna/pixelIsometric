
/**
 * Floating Menu - Blender-style toolbar for viewport tools
 * Provides: Select, Cursor, Move View, Zoom In/Out
 */
class FloatingMenu {
    constructor(viewportManager, onToolChange) {
        this.viewportManager = viewportManager;
        this.currentTool = 'select'; // 'select', 'cursor', 'move', 'zoom'
        this.onToolChange = onToolChange;
        this.container = null;
        this.buttons = {};
        // 2D-mode zoom handlers (set via setZoomHandlers)
        this._zoomIn  = null;
        this._zoomOut = null;
        this._zoomFit = null;
        // 2D-mode cursor container (set via setCursorContainer)
        this._cursorContainer = null;
    }
    
    /**
     * Create and inject the floating menu into the DOM
     */
    create() {
        // Create container
        this.container = document.createElement('div');
        this.container.id = 'floating-menu';
        this.container.className = 'floating-menu';
        
        // Tool buttons configuration
        const tools = [
            { id: 'select', icon: 'fas fa-mouse-pointer', title: 'Select Box (V)', action: () => this.setTool('select') },
            { id: 'cursor', icon: 'fas fa-crosshairs', title: 'Cursor (C)', action: () => this.setTool('cursor') },
            { id: 'move', icon: 'fas fa-hand-pointer', title: 'Move View (M)', action: () => this.setTool('move') },
            { id: 'eye-dropper', icon: 'fas fa-eye-dropper', title: 'Eye Dropper (E)', action: () => this.setTool('eye-dropper') },
            { id: 'zoom-in', icon: 'fas fa-search-plus', title: 'Zoom In (+)', action: () => this.zoomIn() },
            { id: 'zoom-out', icon: 'fas fa-search-minus', title: 'Zoom Out (-)', action: () => this.zoomOut() },
            { id: 'zoom-fit', icon: 'fas fa-expand-arrows-alt', title: 'Zoom to Fit (F)', action: () => this.zoomFit() }
        ];
        
        tools.forEach(tool => {
            const btn = document.createElement('button');
            btn.className = 'tool-btn';
            btn.id = `tool-${tool.id}`;
            btn.title = tool.title;
            btn.innerHTML = `<i class="${tool.icon}"></i>`;
            btn.addEventListener('click', tool.action);
            this.container.appendChild(btn);
            this.buttons[tool.id] = btn;
        });
        
        // Add to document body (floating above everything)
        document.body.appendChild(this.container);
        
        // Set initial active tool
        this.setTool(this.currentTool);
        
        // Keyboard shortcuts
        this._setupKeyboardShortcuts();
        
        return this.container;
    }
    
    /**
     * Set up keyboard shortcuts
     */
    _setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ignore if typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            switch(e.key.toLowerCase()) {
                case 's':
                    e.preventDefault();
                    window.openSettingsModal?.();
                    return;
                case 'v':
                    e.preventDefault();
                    this.setTool('select');
                    break;
                case 'c':
                    e.preventDefault();
                    this.setTool('cursor');
                    break;
                case 'm':
                    e.preventDefault();
                    this.setTool('move');
                    break;
                case 'e':
                    e.preventDefault();
                    this.setTool('eye-dropper');
                    break;
                case '+':
                case '=':
                    e.preventDefault();
                    this.zoomIn();
                    break;
                case '-':
                    e.preventDefault();
                    this.zoomOut();
                    break;
                case 'f':
                    e.preventDefault();
                    this.zoomFit();
                    break;
            }
        });
    }
    
    /**
     * Set the current tool
     */
    setTool(tool) {
        this.currentTool = tool;
        
        // Update button active states
        Object.keys(this.buttons).forEach(key => {
            this.buttons[key].classList.remove('active');
        });
        
        if (this.buttons[tool]) {
            this.buttons[tool].classList.add('active');
        }
        
        // Update cursor style on viewport
        this._updateCursor();
        
        // Notify listener
        if (this.onToolChange) {
            this.onToolChange(tool);
        }
    }
    
    /**
     * Get current tool
     */
    getTool() {
        return this.currentTool;
    }
    
    /**
     * Update cursor style based on current tool
     */
    _updateCursor() {
        const sceneContainer = this._cursorContainer || (this.viewportManager ? this.viewportManager.container : null);
        if (!sceneContainer) return;
        
        switch(this.currentTool) {
            case 'select':
                sceneContainer.style.cursor = 'crosshair';
                break;
            case 'cursor':
                sceneContainer.style.cursor = 'crosshair';
                break;
            case 'move':
                sceneContainer.style.cursor = 'grab';
                break;
            case 'eye-dropper':
                sceneContainer.style.cursor = 'copy';
                break;
            case 'zoom':
            case 'zoom-in':
            case 'zoom-out':
                sceneContainer.style.cursor = 'zoom-in';
                break;
            default:
                sceneContainer.style.cursor = 'default';
        }
    }
    
    /**
     * Zoom in
     */
    zoomIn() {
        if (this._zoomIn) { this._zoomIn(); }
        else if (this.viewportManager) { this.viewportManager.zoomBy(1.2); }
    }
    
    /**
     * Zoom out
     */
    zoomOut() {
        if (this._zoomOut) { this._zoomOut(); }
        else if (this.viewportManager) { this.viewportManager.zoomBy(1 / 1.2); }
    }
    
    /**
     * Zoom to fit
     */
    zoomFit() {
        if (this._zoomFit) { this._zoomFit(); }
        else if (this.viewportManager) { this.viewportManager.reset(); }
    }
    
    /**
     * ── 2D-mode wiring ────────────────────────────────────────────────────────
     */

    /**
     * Replace the 3D-viewport zoom actions with callbacks that talk to the
     * active 2D renderer (Canvas2DRenderer) instead of a ViewportManager.
     * Call from switchTo2d() after app2d.init().
     */
    setZoomHandlers(zoomInFn, zoomOutFn, zoomFitFn) {
        this._zoomIn  = zoomInFn  || null;
        this._zoomOut = zoomOutFn || null;
        this._zoomFit = zoomFitFn || null;
    }

    /**
     * Point the floating-menu at a new scene container so that _updateCursor()
     * can set the correct CSS cursor without touching the old (destroyed)
     * ViewportManager instance.
     * Call from switchTo2d() after app2d.init().
     */
    setCursorContainer(containerEl) {
        this._cursorContainer = containerEl || null;
    }
    
    /**
     * Get DOM element
     */
    getElement() {
        return this.container;
    }
    
    /**
     * Show the floating menu
     */
    show() {
        if (this.container) {
            this.container.style.display = 'flex';
        }
    }
    
    /**
     * Hide the floating menu
     */
    hide() {
        if (this.container) {
            this.container.style.display = 'none';
        }
    }
    
    /**
     * Position the menu
     */
    setPosition(x, y) {
        if (this.container) {
            this.container.style.left = `${x}px`;
            this.container.style.top = `${y}px`;
        }
    }
}

export { FloatingMenu };
