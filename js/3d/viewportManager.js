
/**
 * Viewport Manager - Handles canvas viewport, pan, zoom, and fixed resolution
 * The canvas maintains a fixed internal resolution and is clipped.
 * Users can pan (drag) and zoom the viewport.
 */
class ViewportManager {
    constructor(renderer, camera, container) {
        this.renderer = renderer;
        this.camera = camera;
        this.container = container;
        
        // Fixed internal canvas resolution (logical pixels)
        this.viewportWidth = 1200;
        this.viewportHeight = 800;
        
        // Viewport transform (what part of the scene is visible)
        this.offsetX = 0;
        this.offsetZ = 0;
        this.zoom = 1.0;
        this.minZoom = 0.2;
        this.maxZoom = 5.0;
        
        // Panning state
        this.isPanning = false;
        this.panStartX = 0;
        this.panStartY = 0;
        this.panStartOffsetX = 0;
        this.panStartOffsetZ = 0;
        
    // Cursor position in world coordinates (XZ ground plane)
    this.cursorX = 0;
    this.cursorZ = 0;

    // Callback for viewport updates
    this.onViewportUpdate = null;

    this._initViewport();
    }
    
    /**
     * Initialize the viewport container and canvas styling
     */
    _initViewport() {
        // Container should show scrollbars and allow panning via dragging
        this.container.style.overflow = 'hidden';
        this.container.style.position = 'relative';
        this.container.style.cursor = 'default';

        // Ensure the renderer DOM element is positioned correctly
        this.renderer.domElement.style.position = 'absolute';
        this.renderer.domElement.style.display = 'block'
    }
    
    /**
     * Update the viewport transform - apply offset and zoom to the scene/camera
     */
    updateViewport() {
        // For orthographic camera, we adjust the projection to simulate zoom/pan
        const aspect = this.viewportWidth / this.viewportHeight;
        const baseSize = 10;

        const zoomedSize = baseSize / this.zoom;

        this.camera.left = -zoomedSize * aspect / 2 + this.offsetX;
        this.camera.right = zoomedSize * aspect / 2 + this.offsetX;
        this.camera.top = zoomedSize / 2 + this.offsetZ;
        this.camera.bottom = -zoomedSize / 2 + this.offsetZ;

        this.camera.updateProjectionMatrix();

        // Call callback if set
        if (this.onViewportUpdate) {
            this.onViewportUpdate();
        }
    }
    
    /**
     * Pan the viewport by delta (in viewport coordinates)
     */
    pan(deltaX, deltaY) {
        const aspect = this.viewportWidth / this.viewportHeight;
        const baseSize = 10;
        const zoomedSize = baseSize / this.zoom;
        
        // Convert pixel delta to world units (XZ ground plane)
        const worldDeltaX = (deltaX / this.viewportWidth) * zoomedSize * aspect;
        const worldDeltaZ = (deltaY / this.viewportHeight) * zoomedSize;
        
        this.offsetX -= worldDeltaX;
        this.offsetZ += worldDeltaZ;
        
        this.updateViewport();
    }
    
    /**
     * Zoom in/out centered on the viewport center (or optionally at a point)
     */
    zoomBy(factor, centerX = null, centerY = null) {
        const oldZoom = this.zoom;
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom * factor));
        
        // Adjust offset to zoom towards a specific point
        if (centerX !== null && centerY !== null) {
            const aspect = this.viewportWidth / this.viewportHeight;
            const baseSize = 10;
            
            const oldZoomedSize = baseSize / oldZoom;
            const newZoomedSize = baseSize / this.zoom;
            
            // Convert center from pixel to world before zoom (XZ ground plane)
            const worldX = this.offsetX + (centerX / this.viewportWidth - 0.5) * oldZoomedSize * aspect;
            const worldZ = this.offsetZ + (0.5 - centerY / this.viewportHeight) * oldZoomedSize;
            
            // Adjust offset to keep world point under cursor
            this.offsetX = worldX - (centerX / this.viewportWidth - 0.5) * newZoomedSize * aspect;
            this.offsetZ = worldZ - (0.5 - centerY / this.viewportHeight) * newZoomedSize;
        } else {
            // Zoom centered
            const aspect = this.viewportWidth / this.viewportHeight;
            const baseSize = 10;
            
            const oldZoomedSize = baseSize / oldZoom;
            const newZoomedSize = baseSize / this.zoom;
            
            this.offsetX = this.offsetX * (newZoomedSize / oldZoomedSize);
            this.offsetZ = this.offsetZ * (newZoomedSize / oldZoomedSize);
        }
        
        this.updateViewport();
    }
    
    /**
     * Set zoom level directly
     */
    setZoom(level) {
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, level));
        this.updateViewport();
    }
    
    /**
     * Reset viewport to default
     */
    reset() {
        this.offsetX = 0;
        this.offsetZ = 0;
        this.zoom = 1.0;
        this.updateViewport();
    }
    
    /**
     * Get current viewport info
     */
    getInfo() {
        return {
            offsetX: this.offsetX,
            offsetZ: this.offsetZ,
            zoom: this.zoom,
            width: this.viewportWidth,
            height: this.viewportHeight
        };
    }

    /**
     * Set callback for viewport updates
     */
    setViewportUpdateCallback(callback) {
        this.onViewportUpdate = callback;
    }
    
    /**
     * Convert screen pixel coordinates to world coordinates (XZ ground plane)
     */
    screenToWorld(screenX, screenY) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        const aspect = this.viewportWidth / this.viewportHeight;
        const baseSize = 10;
        const zoomedSize = baseSize / this.zoom;
        
        const worldX = this.offsetX + ((screenX - rect.left) / this.viewportWidth - 0.5) * zoomedSize * aspect;
        const worldZ = this.offsetZ + (0.5 - (screenY - rect.top) / this.viewportHeight) * zoomedSize;
        
        return { x: worldX, z: worldZ };
    }
    
    /**
     * Set cursor position in world coordinates (XZ ground plane)
     */
    setCursor(worldX, worldZ) {
        this.cursorX = worldX;
        this.cursorZ = worldZ;
    }
    
    /**
     * Get cursor position in world coordinates (XZ ground plane)
     */
    getCursor() {
        return { x: this.cursorX, z: this.cursorZ };
    }
    
    /**
     * Start panning
     */
    startPan(screenX, screenY) {
        this.isPanning = true;
        this.panStartX = screenX;
        this.panStartY = screenY;
        this.panStartOffsetX = this.offsetX;
        this.panStartOffsetZ = this.offsetZ;
    }
    
    /**
     * Update panning
     */
    updatePan(screenX, screenY) {
        if (!this.isPanning) return;
        const deltaX = screenX - this.panStartX;
        const deltaY = screenY - this.panStartY;
        this.offsetX = this.panStartOffsetX - (deltaX / this.viewportWidth) * (10 / this.zoom) * (this.viewportWidth / this.viewportHeight);
        this.offsetZ = this.panStartOffsetZ + (deltaY / this.viewportHeight) * (10 / this.zoom);
        this.updateViewport();
    }
    
    /**
     * Stop panning
     */
    stopPan() {
        this.isPanning = false;
    }
    
    /**
     * Resize the viewport display (canvas fills container via CSS, internal resolution stays fixed)
     * Only calls renderer.setSize() for Three.js internal tracking.
     */
    resize(width, height) {
        this.renderer.setSize(width, height);
        this.updateViewport();
    }
}

export { ViewportManager };
