/**
 * js/3d/materialsManager.js — Three.js adapter for shared MaterialsManager.
 *
 * Inherits all shared CRUD/render/edit-dialog logic from MaterialsManagerBase.
 * Overrides one hook: `_applyMaterialToMesh(obj, mat)` to swap actual THREE meshes.
 *
 * The 3D system is the only consumer that calls this; the 2D system imports
 * MaterialsManagerBase directly from `js/shared/materialsManager.js`.
 */
import { MaterialsManagerBase } from '../shared/materialsManager.js';

class MaterialsManager extends MaterialsManagerBase {
    constructor(app) {
        // We set _applyToSelected and _applyToObj as no-ops in the base;
        // replace them here.
        super(app);
        this._applyToObj = this._applyToObj3D.bind(this);
        this._applyToSelected = this._applyToSelected3D.bind(this);
        this._onMaterialUpdated = this._onMaterialUpdated3D.bind(this);
    }

    // ── THREE.Mesh StandardMaterial adapter ──────────────────────────────────
    _applyToObj3D(obj, mat) {
        if (mat.type === 'twotone') {
            const loader   = new THREE.TextureLoader();
            const texture  = loader.load(mat.imageData);
            texture.magFilter = THREE.NearestFilter;
            texture.minFilter = THREE.NearestFilter;
            obj.material = new THREE.MeshStandardMaterial({
                map: texture, transparent: true,
                metalness:  mat.metalness  ?? 0.2,
                roughness:  mat.roughness  ?? 0.7,
                opacity:    mat.opacity    ?? 1.0,
            });
            return;
        }
        if (mat.isPixelTexture && window.textureManager) {
            const tm = window.textureManager;
            if (!tm) return;
            const newMat = tm[mat.textureType];
            if (newMat) {
                obj.material = newMat;
                obj.userData.materialType = mat.textureType;
                obj.userData.isPixelTexture = true;
            }
            return;
        }
        obj.material = new THREE.MeshStandardMaterial({
            color:       mat.color,
            transparent: (mat.opacity ?? 1.0) < 1.0,
            opacity:     mat.opacity ?? 1.0,
        });
        obj.userData.isPixelTexture = false;
    }

    _applyToSelected3D(mat, selObjs) {
        if (!selObjs?.length) return;
        selObjs.forEach(obj => this._applyToObj3D(obj, mat));
    }

    _onMaterialUpdated3D(mat) {
        // refresh all THREE objects that use this material
        mat.objectsUsing?.forEach(obj => {
            if (obj.userData.type === 'figure' || obj.isGroup) {
                obj.traverse(c => { if (c.isMesh) this._applyToObj3D(c, mat); });
            } else if (obj.isMesh && obj.material) {
                this._applyToObj3D(obj, mat);
            }
        });
    }
}

export { MaterialsManager };
export default MaterialsManager;
