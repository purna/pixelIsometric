/**
 * Object Manager for Isometric 3D Editor
 *
 * Stage 1: Added stairs, roof, pyramid, bridge object types.
 */
import { textureManager } from './textureManager.js';
import { GeometryBuilder } from './geometryBuilder.js';
import config from './config.js';

class ObjectManager {
    constructor() {
        this.objects     = [];
        this.initialized = false;
    }

    init(cfg) {
        textureManager.init(cfg);
        this.initialized = true;
    }

    createObject(type, options) {
        options = options || {};
        let obj;
        let isGroup = false;

        switch (type) {
            // ── Primitives ──────────────────────────────────────────────────
            case 'cube':
                obj = new THREE.Mesh(new THREE.BoxGeometry(
                    config.objectCreation.cube.width,
                    config.objectCreation.cube.height,
                    config.objectCreation.cube.depth
                ));
                break;

            case 'sphere':
                obj = new THREE.Mesh(new THREE.SphereGeometry(
                    config.objectCreation.sphere.radius,
                    config.objectCreation.sphere.widthSegments,
                    config.objectCreation.sphere.heightSegments
                ));
                break;

            case 'cylinder':
                obj = new THREE.Mesh(new THREE.CylinderGeometry(
                    config.objectCreation.cylinder.radiusTop,
                    config.objectCreation.cylinder.radiusBottom,
                    config.objectCreation.cylinder.height,
                    config.objectCreation.cylinder.radialSegments
                ));
                break;

            // ── Terrain shapes ──────────────────────────────────────────────
            case 'ramp':
                obj = new THREE.Mesh(GeometryBuilder.createRamp(
                    options.rampConfig || config.objectCreation.ramp
                ));
                break;

            case 'terrain':
                obj = new THREE.Mesh(GeometryBuilder.createTerrain(
                    options.terrainConfig || config.objectCreation.terrain
                ));
                break;

            case 'wall':
                obj = new THREE.Mesh(GeometryBuilder.createWall(
                    options.wallConfig || config.objectCreation.wall
                ));
                break;

            // ── Groups (contain multiple meshes) ────────────────────────────
            case 'building':
                isGroup = true;
                obj = GeometryBuilder.createBuilding(
                    options.buildingConfig || config.objectCreation.building
                );
                break;

            case 'stairs':
                isGroup = true;
                obj = GeometryBuilder.createStairs(
                    options.stairsConfig || config.objectCreation.stairs || {}
                );
                break;

            case 'bridge':
                isGroup = true;
                obj = GeometryBuilder.createBridge(
                    options.bridgeConfig || config.objectCreation.bridge || {}
                );
                break;

            // ── Single-mesh special shapes ──────────────────────────────────
            case 'roof':
                obj = new THREE.Mesh(GeometryBuilder.createRoof(
                    options.roofConfig || config.objectCreation.roof || {}
                ));
                break;

            case 'pyramid':
                obj = new THREE.Mesh(GeometryBuilder.createPyramid(
                    options.pyramidConfig || config.objectCreation.pyramid || {}
                ));
                break;

            case 'path':
                obj = new THREE.Mesh(GeometryBuilder.createPath(
                    options.pathConfig || config.objectCreation.path
                ));
                break;

            case 'river':
                obj = new THREE.Mesh(GeometryBuilder.createRiver(
                    options.riverConfig || config.objectCreation.river
                ));
                break;

            default:
                console.warn('ObjectManager: unknown type "' + type + '", using cube');
                obj = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));
        }

        // ── Material ─────────────────────────────────────────────────────────
        const matType = options.materialType || 'grass';
        this._applyMaterialToObject(obj, matType, options);

        // ── User data ─────────────────────────────────────────────────────────
        obj.userData = {
            id:           Date.now() + Math.random(), // avoid collisions on rapid creation
            name:         options.name || (type + '_' + Date.now()),
            type:         type,
            zindex:       options.zindex       || 0,
            layer:        options.layer        || 1,
            spriteName:   options.spriteName   || matType,
            collider:     options.collider !== false,
            colliderType: options.colliderType || 'box',
            materialType: matType
        };

        // ── Position ──────────────────────────────────────────────────────────
        const pos = options.position || { x: 0, y: 0, z: 0 };
        obj.position.set(
            Math.round(pos.x),
            Math.round(pos.y),
            Math.round(pos.z)
        );
        if (options.yOffset !== undefined) {
            obj.position.y += options.yOffset;
        }

        // ── Scale ─────────────────────────────────────────────────────────────
        if (options.scale) {
            obj.scale.set(
                options.scale.x || 1,
                options.scale.y || 1,
                options.scale.z || 1
            );
        }

        obj.renderOrder = obj.userData.zindex;
        this.objects.push(obj);
        return obj;
    }

    _applyMaterialToObject(obj, matType, options) {
        const material = textureManager.getMaterial(matType, {
            color: options.color
        });

        if (obj.isGroup) {
            obj.traverse(child => {
                if (child.isMesh) child.material = material.clone();
            });
        } else {
            obj.material = material;
        }
    }

    applyTexture(object, materialType) {
        this._applyMaterialToObject(object, materialType, {});
        object.userData.materialType = materialType;
        object.userData.spriteName   = materialType;
    }

    applyMaterialToObject(obj, matType, options) {
        this._applyMaterialToObject(obj, matType, options || {});
    }

    duplicateObject(source, offset) {
        offset = offset || { x: 1, z: 0 };
        const clone = source.clone();
        clone.position.x += offset.x;
        clone.position.z += offset.z;
        clone.userData        = { ...source.userData };
        clone.userData.id     = Date.now() + Math.random();
        clone.userData.name   = source.userData.name + '_copy';
        this.objects.push(clone);
        return clone;
    }

    updateObject(object, updates) {
        if (updates.position) {
            object.position.set(updates.position.x, updates.position.y, updates.position.z);
        }
        if (updates.scale) {
            object.scale.set(updates.scale.x, updates.scale.y, updates.scale.z);
        }
        if (updates.rotation !== undefined) {
            object.rotation.y = updates.rotation;
        }
        if (updates.zindex !== undefined) {
            object.userData.zindex = updates.zindex;
            object.renderOrder     = updates.zindex;
        }
        if (updates.materialType) {
            this.applyTexture(object, updates.materialType);
        }
    }

    getObjectsInLayer(layerId) {
        return this.objects.filter(obj => obj.userData.layer === layerId);
    }

    clearAll() {
        this.objects = [];
    }

    get count() {
        return this.objects.length;
    }
}

const objectManager = new ObjectManager();
export { objectManager };
