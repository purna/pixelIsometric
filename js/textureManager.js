/**
 * Texture Manager - Procedural Textures
 */
class TextureManager {
    constructor() {
        this.textures = new Map();
        this.materials = new Map();
        this.canvasSize = 64;
        this.initialized = false;
    }

    init(config) {
        if (this.initialized) return;

        const materials = config.textures.materials;
        Object.keys(materials).forEach(type => {
            const texture = this.createProceduralTexture(type, this.canvasSize);
            const matConfig = materials[type];
            
            const material = new THREE.MeshStandardMaterial({
                map: texture,
                color: matConfig.color || 0xffffff,
                roughness: matConfig.roughness || 0.7,
                metalness: matConfig.metalness || 0.2,
                transparent: matConfig.transparent || false,
                opacity: matConfig.opacity || 1.0
            });

            this.textures.set(type, texture);
            this.materials.set(type, material);
        });

        this.initialized = true;
    }

    createProceduralTexture(type, size) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        const palettes = {
            grass: ['#4CAF50', '#388E3C', '#81C784', '#2E7D32'],
            dirt: ['#8B4513', '#A0522D', '#6D4C41', '#5D4037'],
            stone: ['#757575', '#616161', '#9E9E9E', '#424242'],
            wood: ['#8D6E63', '#6D4C41', '#5D4037', '#4E342E'],
            brick: ['#D32F2F', '#B71C1C', '#E53935', '#C62828'],
            sand: ['#FFD54F', '#FFECB3', '#FFEE58', '#F9A825'],
            water: ['#2196F3', '#1976D2', '#64B5F6', '#0D47A1'],
            cobblestone: ['#78909C', '#546E7A', '#607D8B', '#37474F'],
            roof: ['#BF360C', '#E65100', '#DD2C00', '#FF6F00']
        };

        const palette = palettes[type] || palettes.grass;

        // Fill background
        ctx.fillStyle = palette[0];
        ctx.fillRect(0, 0, size, size);

        // Add noise
        for (let i = 0; i < size * size * 0.15; i++) {
            const x = Math.floor(Math.random() * size);
            const y = Math.floor(Math.random() * size);
            ctx.fillStyle = palette[Math.floor(Math.random() * palette.length)];
            ctx.fillRect(x, y, 2, 2);
        }

        // Add patterns
        if (['brick', 'cobblestone', 'stone'].includes(type)) {
            this.addPattern(ctx, type, size);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.colorSpace = THREE.SRGBColorSpace;

        return texture;
    }

    addPattern(ctx, type, size) {
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 1;

        if (type === 'brick') {
            const brickH = size / 4;
            const brickW = size / 2;
            for (let y = 0; y < size; y += brickH) {
                const offset = (y / brickH) % 2 === 0 ? 0 : brickW / 2;
                for (let x = -brickW; x < size; x += brickW) {
                    ctx.strokeRect(x + offset, y, brickW, brickH);
                }
            }
        } else if (type === 'stone' || type === 'cobblestone') {
            const stoneSize = size / 4;
            for (let y = 0; y < size; y += stoneSize) {
                for (let x = 0; x < size; x += stoneSize) {
                    const offsetX = (y / stoneSize) % 2 === 0 ? 0 : stoneSize / 2;
                    ctx.strokeRect(x + offsetX, y, stoneSize, stoneSize);
                }
            }
        }
    }

    getTexture(type) {
        return this.textures.get(type);
    }

    getMaterial(type, overrides) {
        let material = this.materials.get(type);
        if (!material) {
            material = new THREE.MeshStandardMaterial({ color: 0xffffff });
        } else {
            material = material.clone();
        }

        if (overrides && overrides.color) {
            material.color.set(overrides.color);
        }
        return material;
    }

    setTextureOnMesh(mesh, type, options) {
        const material = this.getMaterial(type, options);
        mesh.material = material;
        mesh.userData.materialType = type;
        mesh.userData.spriteName = type;
        return mesh;
    }
}

const textureManager = new TextureManager();
export { textureManager };
