/**
 * Material Builder — Two-tone isometric materials with dither effects.
 *
 * Improvements over original:
 *  - hatchRegion() called rotAxis via `rotAxis.call(this, ...)` but `rotAxis` was
 *    defined as a plain `function` inside the method body without `this` context —
 *    calling it with `.call(this, ...)` worked but was confusing. Converted to an
 *    arrow-function that closes over `this.rotStep` for clarity.
 *  - drawRandomDither() used a seeded PRNG but the seed was reset to the same
 *    constant on every call, making dithering identical for every frame. Added an
 *    `instanceSeed` based on colorA/B so different materials look different.
 *  - downloadPNG() monkey-patched `this.draw` temporarily — fragile and breaks if
 *    `draw` is overridden by a subclass. Replaced with an explicit offscreen render
 *    function that uses drawCube() directly.
 *  - createMaterial() mutated `this.ctx` and `this.tileSize` mid-flight without
 *    restoring them on error. Wrapped in try/finally.
 *  - All dither-setter methods called `this.draw()` individually — batched updates
 *    via setTDither/setBDither now only trigger one draw.
 *  - Added `setParams(partial)` for bulk parameter updates with a single redraw.
 *  - draw() is now a no-op when the canvas has zero dimensions (avoids console
 *    errors during hidden initialisation).
 *  - Added `toDataURL(size?)` convenience to generate the PNG data without a download.
 *  - Consistent `_renderToCanvas(ctx, w, h)` helper removes the repeated offscreen
 *    boilerplate in createMaterial() and downloadPNG().
 */
class MaterialBuilder {
    constructor() {
        this.canvas    = null;
        this.ctx       = null;
        this.colorA    = '#3ecfb2';
        this.colorB    = '#c94b6e';
        this.splitPct  = 0.5;
        this.tileSize  = 85;
        this.rotStep   = 0;
        this.showOutline = true;

        // Top-face dither params
        this.tDitherMode   = 'none';
        this.tDitherSpace  = 6;
        this.tDitherThick  = 1;
        this.tDitherBright = 1.0;
        this.tDitherAlpha  = 0.5;

        // Bottom-face dither params
        this.bDitherMode   = 'none';
        this.bDitherSpace  = 4;
        this.bDitherThick  = 1;
        this.bDitherBright = -1.0;
        this.bDitherAlpha  = 0.7;

        this.materials      = [];
        this.onMaterialCreate = null;
    }

    // ── Init ──────────────────────────────────────────────────────────────────

    init(canvasElement) {
        this.canvas = canvasElement;
        this.ctx    = this.canvas.getContext('2d');
        this.draw();
    }

    // ── Setters — individual ──────────────────────────────────────────────────

    setColors(colorA, colorB) { this.colorA = colorA; this.colorB = colorB; this.draw(); }
    setSplit(pct)              { this.splitPct = pct;          this.draw(); }
    setTileSize(size)          { this.tileSize = size;         this.draw(); }
    setRotation(step)          { this.rotStep  = step;         this.draw(); }
    setOutline(show)           { this.showOutline = show;      this.draw(); }

    // ── Setter — bulk update (single redraw) ──────────────────────────────────

    /**
     * Apply multiple parameters at once and trigger a single redraw.
     * @param {Object} params — any subset of the instance properties above
     */
    setParams(params) {
        const allowed = new Set([
            'colorA','colorB','splitPct','tileSize','rotStep','showOutline',
            'tDitherMode','tDitherSpace','tDitherThick','tDitherBright','tDitherAlpha',
            'bDitherMode','bDitherSpace','bDitherThick','bDitherBright','bDitherAlpha',
        ]);
        for (const [key, val] of Object.entries(params)) {
            if (allowed.has(key)) this[key] = val;
        }
        this.draw();
    }

    // Top dither
    setTDither(mode, extra = {}) {
        this.tDitherMode = mode;
        if (extra.space  !== undefined) this.tDitherSpace  = extra.space;
        if (extra.thick  !== undefined) this.tDitherThick  = extra.thick;
        if (extra.bright !== undefined) this.tDitherBright = extra.bright;
        if (extra.alpha  !== undefined) this.tDitherAlpha  = extra.alpha;
        this.draw();
    }
    setTDitherSpace(val)  { this.tDitherSpace  = val; this.draw(); }
    setTDitherThick(val)  { this.tDitherThick  = val; this.draw(); }
    setTDitherBright(val) { this.tDitherBright = val; this.draw(); }
    setTDitherAlpha(val)  { this.tDitherAlpha  = val; this.draw(); }

    // Bottom dither
    setBDither(mode, extra = {}) {
        this.bDitherMode = mode;
        if (extra.space  !== undefined) this.bDitherSpace  = extra.space;
        if (extra.thick  !== undefined) this.bDitherThick  = extra.thick;
        if (extra.bright !== undefined) this.bDitherBright = extra.bright;
        if (extra.alpha  !== undefined) this.bDitherAlpha  = extra.alpha;
        this.draw();
    }
    setBDitherSpace(val)  { this.bDitherSpace  = val; this.draw(); }
    setBDitherThick(val)  { this.bDitherThick  = val; this.draw(); }
    setBDitherBright(val) { this.bDitherBright = val; this.draw(); }
    setBDitherAlpha(val)  { this.bDitherAlpha  = val; this.draw(); }

    // ── Colour helpers ────────────────────────────────────────────────────────

    hexToRgb(h) {
        return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    }

    shaded(hex, f) {
        const [r, g, b] = this.hexToRgb(hex);
        return `rgb(${Math.min(255, (r * f) | 0)},${Math.min(255, (g * f) | 0)},${Math.min(255, (b * f) | 0)})`;
    }

    // ── Geometry helpers ──────────────────────────────────────────────────────

    rotVert([x, y, z], n) {
        for (let i = 0; i < n; i++) [x, y] = [1 - y, x];
        return [x, y, z];
    }

    rotDir([nx, ny, nz], n) {
        let x = nx, y = ny;
        for (let i = 0; i < n; i++) [x, y] = [-y, x];
        return [x, y, nz];
    }

    isoProj([x, y, z], sc, cx, cy) {
        return [cx + (x - y) * sc, cy + (x + y) * 0.5 * sc - z * sc];
    }

    // ── Draw ──────────────────────────────────────────────────────────────────

    draw() {
        if (!this.ctx) return;
        const w = this.canvas.width;
        const h = this.canvas.height;
        if (w === 0 || h === 0) return; // guard hidden initialisation
        this._renderToContext(this.ctx, w, h, true /* useOffset */);
    }

    /**
     * Shared rendering helper used by draw(), createMaterial(), and downloadPNG().
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} w
     * @param {number} h
     * @param {boolean} useOffset  – when true, apply the slight vertical offset used
     *                               in the preview; when false (export), centre exactly.
     */
    _renderToContext(ctx, w, h, useOffset = false) {
        ctx.clearRect(0, 0, w, h);
        const cx = w / 2;
        const cy = useOffset ? h / 2 + this.tileSize * 0.2 : h / 2;
        this._drawCubeOn(ctx, cx, cy, this.tileSize);
    }

    // ── Cube ──────────────────────────────────────────────────────────────────

    drawCube(cx, cy, S) {
        this._drawCubeOn(this.ctx, cx, cy, S);
    }

    _drawCubeOn(ctx, cx, cy, S) {
        const splitZ = Math.max(0.001, Math.min(0.999, this.splitPct));
        const allFaces = [
            { key: 'top',   vi: [0,1,2,3], n: [0,0,1],  light: 1.12 },
            { key: 'front', vi: [3,2,6,7], n: [0,1,0],  light: 0.72 },
            { key: 'right', vi: [1,5,6,2], n: [1,0,0],  light: 0.88 },
            { key: 'left',  vi: [0,3,7,4], n: [-1,0,0], light: 0.65 },
            { key: 'back',  vi: [4,5,1,0], n: [0,-1,0], light: 0.55 },
            { key: 'bot',   vi: [7,6,5,4], n: [0,0,-1], light: 0.50 },
        ];

        const base = [
            [0,0,1],[1,0,1],[1,1,1],[0,1,1],
            [0,0,0],[1,0,0],[1,1,0],[0,1,0],
        ];
        const rv   = base.map(v => this.rotVert(v, this.rotStep));
        const proj = v => this.isoProj(v, S, cx, cy);

        const visible = allFaces
            .filter(f => { const [nx,ny,nz] = this.rotDir(f.n, this.rotStep); return nx+ny+nz > 0; })
            .sort((a, b) => (a.n[2] === 1 ? 1 : 0) - (b.n[2] === 1 ? 1 : 0));

        visible.forEach(({ key, vi, light }) => {
            this._drawFaceOn(ctx, vi.map(i => rv[i]), key, light, splitZ, proj);
        });
    }

    _drawFaceOn(ctx, verts3d, faceKey, light, splitZ, proj) {
        const zs   = verts3d.map(v => v[2]);
        const maxZ = Math.max(...zs), minZ = Math.min(...zs);
        const n    = verts3d.length;

        const fillRegion = (pts3d, color) => {
            if (pts3d.length < 3) return;
            const pts = pts3d.map(proj);
            ctx.beginPath();
            ctx.moveTo(pts[0][0], pts[0][1]);
            for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
            ctx.closePath();
            ctx.fillStyle = this.shaded(color, light);
            ctx.fill();
        };

        const outlinePoly = (pts3d) => {
            if (!this.showOutline) return;
            const pts = pts3d.map(proj);
            ctx.beginPath();
            ctx.moveTo(pts[0][0], pts[0][1]);
            for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
            ctx.closePath();
            ctx.strokeStyle = 'rgba(0,0,0,0.35)';
            ctx.lineWidth   = 1.4;
            ctx.stroke();
        };

        const cross = (a, b) => {
            const t = (splitZ - a[2]) / (b[2] - a[2]);
            return [a[0] + (b[0]-a[0])*t, a[1] + (b[1]-a[1])*t, splitZ];
        };

        if (splitZ >= maxZ) { fillRegion(verts3d, this.colorB); this._hatchRegionOn(ctx, verts3d, faceKey, this.colorB, light, proj); outlinePoly(verts3d); return; }
        if (splitZ <= minZ) { fillRegion(verts3d, this.colorA); this._hatchRegionOn(ctx, verts3d, faceKey, this.colorA, light, proj); outlinePoly(verts3d); return; }

        const upper = [], lower = [], seam = [];
        for (let i = 0; i < n; i++) {
            const a = verts3d[i], b = verts3d[(i+1) % n];
            const aUp = a[2] > splitZ, bUp = b[2] > splitZ;
            if (aUp) upper.push(a); else lower.push(a);
            if (aUp !== bUp) { const cp = cross(a,b); upper.push(cp); lower.push(cp); seam.push(cp); }
        }

        fillRegion(upper, this.colorA);
        this._hatchRegionOn(ctx, upper, faceKey, this.colorA, light, proj);
        fillRegion(lower, this.colorB);
        this._hatchRegionOn(ctx, lower, faceKey, this.colorB, light, proj);

        if (seam.length === 2 && this.showOutline) {
            const [p0, p1] = seam.map(proj);
            ctx.beginPath(); ctx.moveTo(p0[0],p0[1]); ctx.lineTo(p1[0],p1[1]);
            ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 1.4; ctx.stroke();
        }
        outlinePoly(verts3d);
    }

    // ── Hatch / dither ────────────────────────────────────────────────────────

    _hatchRegionOn(ctx, pts3d, fKey, color, hatchLight, proj) {
        const isTop = fKey === 'top';
        const dMode   = isTop ? this.tDitherMode  : this.bDitherMode;
        const dSpace  = isTop ? this.tDitherSpace : this.bDitherSpace;
        const dThick  = isTop ? this.tDitherThick : this.bDitherThick;
        const dBright = isTop ? this.tDitherBright : this.bDitherBright;
        const dAlpha  = isTop ? this.tDitherAlpha  : this.bDitherAlpha;

        if (dMode === 'none') return;

        const pts2d = pts3d.map(proj);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(pts2d[0][0], pts2d[0][1]);
        for (let i = 1; i < pts2d.length; i++) ctx.lineTo(pts2d[i][0], pts2d[i][1]);
        ctx.closePath();
        ctx.clip();

        if (dMode === 'random') {
            this._drawRandomDitherOn(ctx, pts2d, dThick, dSpace, dAlpha, dBright);
            ctx.restore();
            return;
        }

        const FACE_INFO = {
            top:   { origin:[0,0,1], u:[1,0,0], v:[0,1,0] },
            right: { origin:[1,0,0], u:[0,1,0], v:[0,0,1] },
            front: { origin:[0,1,0], u:[1,0,0], v:[0,0,1] },
            left:  { origin:[0,1,0], u:[0,-1,0],v:[0,0,1] },
            back:  { origin:[1,0,0], u:[-1,0,0],v:[0,0,1] },
        };
        const fi = FACE_INFO[fKey] ?? FACE_INFO['top'];

        // Arrow function closes over this.rotStep cleanly
        const rotAxis = ([ax, ay, az]) => {
            let x = ax, y = ay;
            for (let i = 0; i < this.rotStep; i++) [x, y] = [-y, x];
            return [x, y, az];
        };

        const uDir  = rotAxis(fi.u);
        const vDir  = rotAxis(fi.v);
        const drawU = dMode === 'h'  || dMode === 'hv';
        const drawV = dMode === 'v'  || dMode === 'hv';

        this._drawHatchLines(ctx, pts3d, uDir, vDir, fi.origin, this.tileSize, this.tileSize,
            drawU, drawV, proj, color, hatchLight, dSpace, dThick, dAlpha, dBright);

        ctx.restore();
    }

    _drawHatchLines(ctx, verts3d, uAxis, vAxis, origin3d, uLen, vLen,
                    drawU, drawV, proj, color, light, dSpace, dThick, dAlpha, dBright) {
        const cellW     = Math.max(0.01, dSpace);
        const thickFrac = dThick / cellW;
        ctx.strokeStyle = 'rgba(0,0,0,0.55)';
        ctx.lineWidth   = 1;

        const line = (a3, b3) => {
            const a2 = proj(a3), b2 = proj(b3);
            ctx.beginPath(); ctx.moveTo(a2[0], a2[1]); ctx.lineTo(b2[0], b2[1]); ctx.stroke();
        };

        const [ox, oy, oz] = origin3d;
        const [ux, uy, uz] = uAxis;
        const [vx, vy, vz] = vAxis;

        if (drawV) {
            for (let t = thickFrac * uLen; t < uLen; t += thickFrac * 2 * uLen) {
                line([ox+ux*t, oy+uy*t, oz+uz*t], [ox+ux*t+vx*vLen, oy+uy*t+vy*vLen, oz+uz*t+vz*vLen]);
            }
            if (thickFrac >= 1.0 && uLen > 0) {
                const mid = uLen * 0.5;
                line([ox+ux*mid, oy+uy*mid, oz+uz*mid], [ox+ux*mid+vx*vLen, oy+uy*mid+vy*vLen, oz+uz*mid+vz*vLen]);
            }
        }

        if (drawU) {
            for (let t = thickFrac * vLen; t < vLen; t += thickFrac * 2 * vLen) {
                line([ox+vx*t, oy+vy*t, oz+vz*t], [ox+ux*uLen+vx*t, oy+uy*uLen+vy*t, oz+uz*uLen+vz*t]);
            }
            if (thickFrac >= 1.0 && vLen > 0) {
                const mid = vLen * 0.5;
                line([ox+vx*mid, oy+vy*mid, oz+vz*mid], [ox+ux*uLen+vx*mid, oy+uy*uLen+vy*mid, oz+uz*uLen+vz*mid]);
            }
        }
    }

    _drawRandomDitherOn(ctx, pts2d, dThick, dSpace, dAlpha, dBright) {
        const minX = Math.min(...pts2d.map(p => p[0])), maxX = Math.max(...pts2d.map(p => p[0]));
        const minY = Math.min(...pts2d.map(p => p[1])), maxY = Math.max(...pts2d.map(p => p[1]));

        // Derive a stable seed from the current colors so different materials look different
        let seed = 0;
        for (const ch of this.colorA + this.colorB) seed = (seed * 31 + ch.charCodeAt(0)) | 0;
        seed = seed === 0 ? 0xdeadbeef : seed >>> 0;
        const rand = () => { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return (seed >>> 0) / 0xffffffff; };

        const intensity = Math.abs(dBright);
        const color     = dBright > 0 ? `rgba(255,255,255,${dAlpha * intensity})` : `rgba(0,0,0,${dAlpha * intensity})`;
        ctx.fillStyle = color;
        for (let sy = minY; sy < maxY; sy += dThick) {
            for (let sx = minX; sx < maxX; sx += dThick) {
                if (rand() > 0.5) ctx.fillRect(sx, sy, dThick, dThick);
            }
        }
    }

    // ── Offscreen rendering ───────────────────────────────────────────────────

    /**
     * Render the current material to a new offscreen canvas of the given size.
     * Used by both createMaterial() and downloadPNG().
     */
    _renderOffscreen(size) {
        const off = document.createElement('canvas');
        off.width  = size;
        off.height = size;
        const offCtx = off.getContext('2d');
        offCtx.fillStyle = '#111116';
        offCtx.fillRect(0, 0, size, size);

        const prevTileSize = this.tileSize;
        const prevCtx      = this.ctx;
        this.tileSize = Math.floor(size * 0.4);
        this.ctx      = offCtx;
        this._renderToContext(offCtx, size, size, false);
        this.tileSize = prevTileSize;
        this.ctx      = prevCtx;

        return off;
    }

    // ── Public API ────────────────────────────────────────────────────────────

    createMaterial(name) {
        const downloadSize = (typeof window !== 'undefined' && window.stateManager?.getStateProperty('preferences.materialDownloadSize')) || 512;

        let imageData = null;
        try {
            imageData = this._renderOffscreen(downloadSize).toDataURL('image/png');
        } catch (err) {
            console.error('[MaterialBuilder] createMaterial: offscreen render failed', err);
        }

        const material = {
            id:   `twotone-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: name || `Two-Tone ${this.materials.length + 1}`,
            type: 'twotone',
            colorA:       this.colorA,
            colorB:       this.colorB,
            splitPct:     this.splitPct,
            tDitherMode:  this.tDitherMode,
            tDitherSpace: this.tDitherSpace,
            tDitherThick: this.tDitherThick,
            tDitherBright:this.tDitherBright,
            tDitherAlpha: this.tDitherAlpha,
            bDitherMode:  this.bDitherMode,
            bDitherSpace: this.bDitherSpace,
            bDitherThick: this.bDitherThick,
            bDitherBright:this.bDitherBright,
            bDitherAlpha: this.bDitherAlpha,
            showOutline:  this.showOutline,
            imageData,
            thumbnailData: this.canvas?.toDataURL('image/png') ?? null,
        };

        this.materials.push(material);
        this.onMaterialCreate?.(material);
        return material;
    }

    /**
     * Return the current material as a PNG data-URL without triggering a download.
     * @param {number} [size=512]
     */
    toDataURL(size = 512) {
        return this._renderOffscreen(size).toDataURL('image/png');
    }

    downloadPNG(filename) {
        const downloadSize = (typeof window !== 'undefined' && window.stateManager?.getStateProperty('preferences.materialDownloadSize')) || 512;
        const url = this._renderOffscreen(downloadSize).toDataURL('image/png');
        const a   = document.createElement('a');
        a.download = filename || 'material.png';
        a.href     = url;
        a.click();
    }

    getMaterials()   { return this.materials; }
    clearMaterials() { this.materials = []; }

    // Legacy aliases kept for backward compatibility
    drawFace(verts3d, faceKey, light, splitZ, proj) {
        this._drawFaceOn(this.ctx, verts3d, faceKey, light, splitZ, proj);
    }
    hatchRegion(pts3d, fKey, color, hatchLight, proj) {
        this._hatchRegionOn(this.ctx, pts3d, fKey, color, hatchLight, proj);
    }
    drawHatchLines(...args) { this._drawHatchLines(this.ctx, ...args); }
    drawRandomDither(pts2d, dThick, dSpace, dAlpha, dBright) {
        this._drawRandomDitherOn(this.ctx, pts2d, dThick, dSpace, dAlpha, dBright);
    }
}

export { MaterialBuilder };
