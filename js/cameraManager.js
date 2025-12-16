/**
 * Camera Manager for 3D Editor
 * Manages camera functionality including rotation, positioning, and controls
 */

class CameraManager {
    constructor(camera, controls, currentCameraAngle = 0) {
        this.camera = camera;
        this.controls = controls;
        this.currentCameraAngle = currentCameraAngle;
    }

    /**
     * Initialize the camera manager
     */
    init() {
        // Set up initial camera position
        this.updateCameraPosition();
    }

    /**
     * Rotate camera clockwise 90 degrees
     */
    rotateClockwise() {
        this.currentCameraAngle = (this.currentCameraAngle + 90) % 360;
        this.updateCameraPosition();
    }

    /**
     * Rotate camera counter-clockwise 90 degrees
     */
    rotateCounterClockwise() {
        this.currentCameraAngle = (this.currentCameraAngle - 90 + 360) % 360;
        this.updateCameraPosition();
    }

    /**
     * Update camera position based on current angle
     */
    updateCameraPosition() {
        const distance = 20;
        const radians = THREE.MathUtils.degToRad(this.currentCameraAngle);

        // Calculate isometric position based on angle
        switch (this.currentCameraAngle) {
            case 0:
                this.camera.position.set(distance, distance, distance);
                break;
            case 90:
                this.camera.position.set(-distance, distance, distance);
                break;
            case 180:
                this.camera.position.set(-distance, distance, -distance);
                break;
            case 270:
                this.camera.position.set(distance, distance, -distance);
                break;
        }

        this.camera.lookAt(0, 0, 0);
        this.controls.update();
        this.updateCameraInfo();
    }

    /**
     * Reset camera to default isometric position
     */
    reset() {
        this.currentCameraAngle = 0;
        this.updateCameraPosition();
    }

    /**
     * Update camera position display in UI
     */
    updateCameraInfo() {
        const cameraPos = document.getElementById('camera-position');
        if (cameraPos) {
            cameraPos.value = `X: ${this.camera.position.x.toFixed(2)}, Y: ${this.camera.position.y.toFixed(2)}, Z: ${this.camera.position.z.toFixed(2)}`;
        }
    }

    /**
     * Get current camera angle
     * @returns {number} Current camera angle in degrees
     */
    getCurrentAngle() {
        return this.currentCameraAngle;
    }

    /**
     * Set camera angle
     * @param {number} angle - Angle in degrees
     */
    setAngle(angle) {
        this.currentCameraAngle = angle % 360;
        this.updateCameraPosition();
    }

    /**
     * Get camera position
     * @returns {THREE.Vector3} Camera position
     */
    getPosition() {
        return this.camera.position.clone();
    }

    /**
     * Set camera position
     * @param {THREE.Vector3} position - New camera position
     */
    setPosition(position) {
        this.camera.position.copy(position);
        this.camera.lookAt(0, 0, 0);
        this.controls.update();
        this.updateCameraInfo();
    }
}

// Export the CameraManager class
export { CameraManager };