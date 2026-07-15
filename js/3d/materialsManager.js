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
    _applyToObj3D(obj, mat, textureId = null) {
        if (!obj || !mat) return;

        const apply = (mesh) => {
            mesh.userData.currentMaterialId = mat.id;
            mesh.userData.currentTextureId = textureId;

            const texture = textureId ? mat.textures.find(t => t.id === textureId) : null;

            if (texture && texture.type === 'procedural') {
                const newMaterial = new THREE.MeshStandardMaterial({
                    color: mat.color,
                    roughness: mat.roughness,
                    metalness: mat.metalness,
                });

                newMaterial.onBeforeCompile = (shader) => {
                    // This is where the magic from isometric-cube8.html happens.
                    // We inject uniforms and modify the shader.
                    shader.uniforms.baseColor = { value: new THREE.Color(texture.colorA) };
                    shader.uniforms.colorA = { value: new THREE.Color(texture.colorA) };
                    shader.uniforms.colorB = { value: new THREE.Color(texture.colorB) };
                    shader.uniforms.splitY = { value: (texture.splitPct - 0.5) * 2 }; // Convert 0-1 to -1-1 for shader
                    shader.uniforms.tMode = { value: ['none', 'random', 'h', 'v', 'hv'].indexOf(texture.tDitherMode) };
                    shader.uniforms.tSpace = { value: texture.tDitherSpace };
                    shader.uniforms.tThick = { value: texture.tDitherThick };
                    shader.uniforms.tBright = { value: texture.tDitherBright };
                    shader.uniforms.tAlpha = { value: texture.tDitherAlpha };
                    shader.uniforms.bMode = { value: ['none', 'random', 'h', 'v', 'hv'].indexOf(texture.bDitherMode) };
                    shader.uniforms.bSpace = { value: texture.bDitherSpace };
                    shader.uniforms.bThick = { value: texture.bDitherThick };
                    shader.uniforms.bBright = { value: texture.bDitherBright };
                    shader.uniforms.bAlpha = { value: texture.bDitherAlpha };
                    shader.uniforms.tInkMode = { value: texture.tInkMode === 'color' ? 1 : 0 };
                    shader.uniforms.bInkMode = { value: texture.bInkMode === 'color' ? 1 : 0 };
                    // ... and so on for all dither properties ...

                    shader.vertexShader = `
                        varying vec3 vLocalPosition;
                        ${shader.vertexShader}
                    `.replace(
                        `#include <begin_vertex>`,
                        `#include <begin_vertex>
                         vLocalPosition = position;`
                    );

                    shader.fragmentShader = `
                        varying vec3 vLocalPosition;
                        uniform vec3 baseColor; 
                        uniform vec3 colorA; 
                        uniform vec3 colorB; 
                        uniform float splitY; 
                        uniform int materialMode;
                        
                        uniform int tMode; uniform int tInkMode; uniform float tSpace; uniform float tThick; uniform float tBright; uniform float tAlpha;
                        uniform int bMode; uniform int bInkMode; float bSpace; uniform float bThick; uniform float bBright; uniform float bAlpha;

                        ${shader.fragmentShader}
                    `.replace(
                        `#include <color_fragment>`,
                        `#include <color_fragment>

                        bool isTop = vLocalPosition.y > splitY;
                        vec3 finalColor = isTop ? colorA : colorB;

                        diffuseColor.rgb = mix(diffuseColor.rgb, finalColor, 0.85);
                        `
                    ).replace(
                        `#include <dithering_fragment>`,
                        `
                        int dMode = isTop ? tMode : bMode;
                        int dInkMode = isTop ? tInkMode : bInkMode;
                        float dSpace = isTop ? tSpace : bSpace;
                        float dThick = isTop ? tThick : bThick;
                        float dBright = isTop ? tBright : bBright;
                        float dAlpha = isTop ? tAlpha : bAlpha;

                        if (dMode > 0) {
                            bool isDither = false;
                            vec2 scaledUv = vUv * (100.0 / dSpace);
                            float lineThreshold = dThick / dSpace;

                            if (dMode == 1) { // Noise
                                float noise = fract(sin(dot(floor(scaledUv), vec2(12.9898, 78.233))) * 43758.5453);
                                isDither = noise > 0.5;
                            } else if (dMode == 2) { // H-Lines
                                isDither = fract(scaledUv.y) < lineThreshold;
                            } else if (dMode == 3) { // V-Lines
                                isDither = fract(scaledUv.x) < lineThreshold;
                            } else if (dMode == 4) { // Crosshatch
                                isDither = (fract(scaledUv.y) < lineThreshold) || (fract(scaledUv.x) < lineThreshold);
                            }

                            if (isDither) {
                                vec3 brightShift = dBright > 0.0 ? vec3(1.0) : vec3(0.0);
                                vec3 targetCol = mix(gl_FragColor.rgb, brightShift, abs(dBright));
                                gl_FragColor.rgb = mix(gl_FragColor.rgb, targetCol, dAlpha);
                            }
                        }
                        `
                    );
                };
                mesh.material = newMaterial;

            } else {
                // Apply the base material
                mesh.material = new THREE.MeshStandardMaterial({
                    color: mat.color,
                    opacity: mat.opacity,
                    transparent: mat.opacity < 1.0,
                    roughness: mat.roughness,
                    metalness: mat.metalness,
                });
            }
            mesh.material.needsUpdate = true;
        };

        if (obj.isGroup) {
            obj.traverse(child => {
                if (child.isMesh) apply(child);
            });
        } else if (obj.isMesh) {
            apply(obj);
        }
    }

    _applyToSelected3D(mat, selObjs, textureId = null) {
        if (!selObjs?.length) return;
        selObjs.forEach(obj => this._applyToObj3D(obj, mat, textureId));
    }

    _onMaterialUpdated3D(mat) {
        // refresh all THREE objects that use this material
        mat.objectsUsing?.forEach(obj => {
            const textureId = obj.userData.currentTextureId;
            if (obj.isGroup) {
                obj.traverse(c => { if (c.isMesh) this._applyToObj3D(c, mat, textureId); });
            } else if (obj.isMesh && obj.material) {
                this._applyToObj3D(obj, mat, textureId);
            }
        });
    }
}

export { MaterialsManager };
export default MaterialsManager;
