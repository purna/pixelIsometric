/**
 * Pixel Post-Processing Manager
 * Adds pixel art effects using THREE.js post-processing
 * Supports pixelation, CRT effects, and retro filters
 */

class PixelPostProcessor {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.enabled = false;
        this.pixelSize = 4;
        this.effects = {
            pixelate: false,
            crt: false,
            scanlines: false,
            noise: false
        };
        this.composer = null;
        this.renderTarget = null;
        this.init();
    }

    init() {
        // Check if post-processing is available
        if (typeof EffectComposer === 'undefined') {
            console.warn('THREE.js post-processing not available. Using fallback pixel shader.');
            return;
        }

        try {
            const pixelRatio = this.renderer.getPixelRatio();
            const width = window.innerWidth;
            const height = window.innerHeight;

            // Create render target
            this.renderTarget = new THREE.WebGLRenderTarget(width, height, {
                minFilter: THREE.NearestFilter,
                magFilter: THREE.NearestFilter,
                format: THREE.RGBAFormat
            });

            // Create composer
            this.composer = new EffectComposer(this.renderer, this.renderTarget);
            this.composer.setSize(width, height);
            this.composer.setPixelRatio(pixelRatio);

            // Add render pass
            const renderPass = new RenderPass(this.scene, this.camera);
            this.composer.addPass(renderPass);

            // Add pixelation shader pass
            this.pixelationPass = new ShaderPass(PixelateShader);
            this.pixelationPass.uniforms['pixelSize'].value = this.pixelSize;
            this.pixelationPass.enabled = false;
            this.composer.addPass(this.pixelationPass);

            // Add CRT shader pass
            this.crtPass = new ShaderPass(CRTShader);
            this.crtPass.enabled = false;
            this.composer.addPass(this.crtPass);

            // Add scanlines shader pass (combined with CRT)
            this.scanlinePass = new ShaderPass(ScanlineShader);
            this.scanlinePass.enabled = false;
            this.composer.addPass(this.scanlinePass);

            // Add noise shader pass
            this.noisePass = new ShaderPass(NoiseShader);
            this.noisePass.enabled = false;
            this.composer.addPass(this.noisePass);

            this.enabled = true;
        } catch (error) {
            console.warn('Failed to initialize post-processing:', error);
            this.enabled = false;
        }
    }

    setPixelSize(size) {
        this.pixelSize = size;
        if (this.pixelationPass) {
            this.pixelationPass.uniforms['pixelSize'].value = size;
        }
    }

    toggleEffect(effectName, enabled) {
        if (this.effects.hasOwnProperty(effectName)) {
            this.effects[effectName] = enabled;
            
            switch(effectName) {
                case 'pixelate':
                    if (this.pixelationPass) this.pixelationPass.enabled = enabled;
                    break;
                case 'crt':
                    if (this.crtPass) this.crtPass.enabled = enabled;
                    break;
                case 'scanlines':
                    if (this.scanlinePass) this.scanlinePass.enabled = enabled;
                    break;
                case 'noise':
                    if (this.noisePass) this.noisePass.enabled = enabled;
                    break;
            }
        }
    }

    render() {
        if (this.enabled && this.composer) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }

    resize(width, height) {
        if (this.composer) {
            this.composer.setSize(width, height);
        }
        if (this.renderTarget) {
            this.renderTarget.setSize(width, height);
        }
    }
}

// Pixelate Shader
const PixelateShader = {
    uniforms: {
        'tDiffuse': { value: null },
        'pixelSize': { value: 4.0 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float pixelSize;
        varying vec2 vUv;
        
        void main() {
            float dx = pixelSize / 1920.0;
            float dy = pixelSize / 1080.0;
            vec2 coord = vec2(dx * floor(vUv.x / dx), dy * floor(vUv.y / dy));
            gl_FragColor = texture2D(tDiffuse, coord);
        }
    `
};

// CRT Shader
const CRTShader = {
    uniforms: {
        'tDiffuse': { value: null },
        'time': { value: 0.0 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float time;
        varying vec2 vUv;
        
        void main() {
            vec2 uv = vUv;
            // Barrel distortion
            vec2 centered = uv - 0.5;
            float dist = dot(centered, centered);
            uv = uv + centered * dist * 0.05;
            
            // RBG shift
            float shift = sin(time * 2.0) * 0.002;
            vec4 cr = texture2D(tDiffuse, uv + vec2(shift, 0.0));
            vec4 cga = texture2D(tDiffuse, uv);
            vec4 cb = texture2D(tDiffuse, uv - vec2(shift, 0.0));
            
            gl_FragColor = vec4(cr.r, cga.g, cb.b, 1.0);
            
            // Vignette
            float vignette = 1.0 - dist * 1.5;
            gl_FragColor.rgb *= vignette;
        }
    `
};

// Scanline Shader
const ScanlineShader = {
    uniforms: {
        'tDiffuse': { value: null },
        'time': { value: 0.0 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float time;
        varying vec2 vUv;
        
        void main() {
            vec4 color = texture2D(tDiffuse, vUv);
            float scanline = sin(vUv.y * 1080.0 * 1.0) * 0.1;
            color.rgb -= scanline;
            gl_FragColor = color;
        }
    `
};

// Noise Shader
const NoiseShader = {
    uniforms: {
        'tDiffuse': { value: null },
        'time': { value: 0.0 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float time;
        varying vec2 vUv;
        
        // Classic noise function
        float rand(vec2 co) {
            return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        void main() {
            vec4 color = texture2D(tDiffuse, vUv);
            float noise = rand(vUv + time * 0.5) * 0.05;
            color.rgb += noise;
            gl_FragColor = color;
        }
    `
};

export { PixelPostProcessor, PixelateShader, CRTShader, ScanlineShader, NoiseShader };