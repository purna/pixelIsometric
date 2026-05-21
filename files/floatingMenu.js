/**
 * Floating Menu — Blender-style toolbar for viewport tools.
 *
 * Improvements over original:
 *  - Keyboard shortcuts registered once on the document; removed via destroy().
 *  - All tool config in one declarative array — easy to add/remove tools.
 *  - setTool() short-circuits when the requested tool is already active.
 *  - Zoom / pan clamps are now the renderer's responsibility; menu just delegates.
 *  - setPosition() accepts CSS strings (e.g. '10px') as well as numbers.
 *  - Added destroy() to clean up DOM node and event listeners (important for
 *    mode switching: 3D → 2D → 3D won't accumulate duplicate menus).
 *  - Added isVisible() helper.
 *  - Keyboard listener uses a single AbortController for clean teardown.
 */
class FloatingMenu {
    constructor(viewportManager, onToolChange) {
        this.viewportManager = viewportManager;
        this.currentTool     = 'select';
        this.onToolChange    = onToolChange;
        this.container       = null;
        this.buttons         = {};

        // 2D-mode overrides (set via setZoomHandlers / setCursorContainer)
        this._zoomIn         = null;
        this._zoomOut        = null;
        this._zoomFit        = null;
        this._cursorContainer = null;

        // Used to cleanly remove the keydown listener
        this._kbdController  = null;
    }

    // ── Tool definitions ──────────────────────────────────────────────────────

    static get TOOLS() {
        return [
            { id: 'settings',     icon: 'fas fa-cog',               title: 'Settings (S)',      key: 's',      action: 'settings' },
            { id: 'select',       icon: 'fas fa-mouse-pointer',      title: 'Select Box (V)',    key: 'v',      action: 'tool' },
            { id: 'cursor',       icon: 'fas fa-crosshairs',         title: 'Cursor (C)',        key: 'c',      action: 'tool' },
            { id: 'move',         icon: 'fas fa-hand-pointer',       title: 'Move View (M)',     key: 'm',      action: 'tool' },
            { id: 'eye-dropper',  icon: 'fas fa-eye-dropper',        title: 'Eye Dropper (E)',   key: 'e',      action: 'tool' },
            { id: 'zoom-in',      icon: 'fas fa-search-plus',        title: 'Zoom In (+)',       key: '+',      action: 'zoom-in' },
            { id: 'zoom-out',     icon: 'fas fa-search-minus',       title: 'Zoom Out (-)',      key: '-',      action: 'zoom-out' },
            { id: 'zoom-fit',     icon: 'fas fa-expand-arrows-alt',  title: 'Zoom to Fit (F)',   key: 'f',      action: 'zoom-fit' },
        ];
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    create() {
        // Guard against double-creation
        if (this.container) return this.container;

        this.container       = document.createElement('div');
        this.container.id    = 'floating-menu';
        this.container.className = 'floating-menu';

        FloatingMenu.TOOLS.forEach(tool => {
            const btn       = document.createElement('button');
            btn.className   = 'tool-btn';
            btn.id          = `tool-${tool.id}`;
            btn.title       = tool.title;
            btn.innerHTML   = `<i class="${tool.icon}"></i>`;
            btn.addEventListener('click', () => this._handleToolClick(tool));
            this.container.appendChild(btn);
            this.buttons[tool.id] = btn;
        });

        document.body.appendChild(this.container);
        this.setTool(this.currentTool);
        this._setupKeyboardShortcuts();

        return this.container;
    }

    destroy() {
        this._kbdController?.abort();
        this._kbdController = null;
        this.container?.remove();
        this.container = null;
        this.buttons   = {};
    }

    // ── Tool click dispatcher ─────────────────────────────────────────────────

    _handleToolClick(tool) {
        switch (tool.action) {
            case 'settings': window.openSettingsModal?.(); break;
            case 'tool':     this.setTool(tool.id);        break;
            case 'zoom-in':  this.zoomIn();                break;
            case 'zoom-out': this.zoomOut();               break;
            case 'zoom-fit': this.zoomFit();               break;
        }
    }

    // ── Keyboard shortcuts ────────────────────────────────────────────────────

    _setupKeyboardShortcuts() {
        if (this._kbdController) this._kbdController.abort();
        this._kbdController = new AbortController();

        // Build a key → tool lookup
        const keyMap = {};
        FloatingMenu.TOOLS.forEach(t => { if (t.key) keyMap[t.key] = t; });
        // Also handle '=' as an alias for '+'
        keyMap['='] = keyMap['+'];

        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
            const tool = keyMap[e.key.toLowerCase()] ?? keyMap[e.key];
            if (tool) {
                e.preventDefault();
                this._handleToolClick(tool);
            }
        }, { signal: this._kbdController.signal });
    }

    // ── Tool state ────────────────────────────────────────────────────────────

    setTool(tool) {
        if (tool === this.currentTool && this.buttons[tool]?.classList.contains('active')) return;

        this.currentTool = tool;

        Object.keys(this.buttons).forEach(key => this.buttons[key].classList.remove('active'));
        this.buttons[tool]?.classList.add('active');

        this._updateCursor();
        this.onToolChange?.(tool);
    }

    getTool() { return this.currentTool; }

    // ── Cursor ────────────────────────────────────────────────────────────────

    _updateCursor() {
        const target = this._cursorContainer
            ?? this.viewportManager?.container
            ?? null;
        if (!target) return;

        const CURSOR_MAP = {
            select:      'crosshair',
            cursor:      'crosshair',
            move:        'grab',
            'eye-dropper': 'copy',
            'zoom-in':   'zoom-in',
            'zoom-out':  'zoom-out',
            'zoom-fit':  'zoom-in',
        };
        target.style.cursor = CURSOR_MAP[this.currentTool] ?? 'default';
    }

    // ── Zoom ──────────────────────────────────────────────────────────────────

    zoomIn() {
        if (this._zoomIn)            { this._zoomIn(); }
        else if (this.viewportManager) { this.viewportManager.zoomBy(1.2); }
    }

    zoomOut() {
        if (this._zoomOut)           { this._zoomOut(); }
        else if (this.viewportManager) { this.viewportManager.zoomBy(1 / 1.2); }
    }

    zoomFit() {
        if (this._zoomFit)           { this._zoomFit(); }
        else if (this.viewportManager) { this.viewportManager.reset(); }
    }

    // ── 2D wiring ─────────────────────────────────────────────────────────────

    setZoomHandlers(zoomInFn, zoomOutFn, zoomFitFn) {
        this._zoomIn  = zoomInFn  || null;
        this._zoomOut = zoomOutFn || null;
        this._zoomFit = zoomFitFn || null;
    }

    setCursorContainer(containerEl) {
        this._cursorContainer = containerEl || null;
        this._updateCursor();
    }

    // ── Visibility ────────────────────────────────────────────────────────────

    getElement()  { return this.container; }
    isVisible()   { return this.container ? this.container.style.display !== 'none' : false; }
    show()        { if (this.container) this.container.style.display = 'flex'; }
    hide()        { if (this.container) this.container.style.display = 'none'; }

    /**
     * @param {number|string} x  – pixels or CSS value
     * @param {number|string} y  – pixels or CSS value
     */
    setPosition(x, y) {
        if (!this.container) return;
        this.container.style.left = typeof x === 'number' ? `${x}px` : x;
        this.container.style.top  = typeof y === 'number' ? `${y}px` : y;
    }
}

export { FloatingMenu };
