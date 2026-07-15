/**
 * Material Builder - Two-tone isometric materials with dither effects
 * Based on isometric-cube.html and isometric-cube2.html patterns
 */
class MaterialBuilder {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.colorA = '#3ecfb2';
        this.colorB = '#c94b6e';
        this.splitPct = 0.5;
        this.tileSize = 85;
        this.rotStep = 0;
        this.showOutline = true;
        // Top dither params (analogous to three_iso3.html: tMode, tSpace, tThick, tBright, tAlpha)
        this.tDitherMode = 'none';
        this.tDitherSpace = 6;
        this.tDitherThick = 1;
        this.tDitherBright = 1.0;
        this.tDitherAlpha = 0.5;
        // Bottom dither params (analogous to three_iso3.html: bMode, bSpace, bThick, bBright, bAlpha)
        this.bDitherMode = 'none';
        this.bDitherSpace = 4;
        this.bDitherThick = 1;
        this.bDitherBright = -1.0;
        this.bDitherAlpha = 0.7;
        this.tInkMode = 'bright';
        this.bInkMode = 'bright';
        this.materials = [];
        this.onMaterialCreate = null;
    }

    init(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d');
        this.draw();
    }

    setColors(colorA, colorB) {
        this.colorA = colorA;
        this.colorB = colorB;
        this.draw();
    }

    setSplit(pct) {
        this.splitPct = pct;
        this.draw();
    }

    setTileSize(size) {
        this.tileSize = size;
        this.draw();
    }

    setRotation(step) {
        this.rotStep = step;
        this.draw();
    }

    setOutline(show) {
        this.showOutline = show;
        this.draw();
    }

    // ── Top dither setters (mode, space, thick, bright, alpha) ──────────────────
    setTDither(mode, extra) {
        this.tDitherMode = mode;
        if (extra) {
            if (extra.space !== undefined) this.tDitherSpace = extra.space;
            if (extra.thick !== undefined) this.tDitherThick = extra.thick;
            if (extra.bright !== undefined) this.tDitherBright = extra.bright;
            if (extra.alpha  !== undefined) this.tDitherAlpha  = extra.alpha;
        }
        this.draw();
    }

    setTDitherSpace(val) { this.tDitherSpace = val; this.draw(); }
    setTDitherThick(val) { this.tDitherThick = val; this.draw(); }
    setTDitherBright(val) { this.tDitherBright = val; this.draw(); }
    setTDitherAlpha(val)   { this.tDitherAlpha   = val; this.draw(); }

    // ── Bottom dither setters (mode, space, thick, bright, alpha) ───────────────
    setBDither(mode, extra) {
        this.bDitherMode = mode;
        if (extra) {
            if (extra.space !== undefined) this.bDitherSpace = extra.space;
            if (extra.thick !== undefined) this.bDitherThick = extra.thick;
            if (extra.bright !== undefined) this.bDitherBright = extra.bright;
            if (extra.alpha  !== undefined) this.bDitherAlpha  = extra.alpha;
        }
        this.draw();
    }

    setBDitherSpace(val) { this.bDitherSpace = val; this.draw(); }
    setBDitherThick(val) { this.bDitherThick = val; this.draw(); }
    setBDitherBright(val) { this.bDitherBright = val; this.draw(); }
    setBDitherAlpha(val)   { this.bDitherAlpha   = val; this.draw(); }
    setTDitherInkMode(mode) { this.tInkMode = mode; this.draw(); }
    setBDitherInkMode(mode) { this.bInkMode = mode; this.draw(); }

    hexToRgb(h) {
        return [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
    }

    shaded(hex, f) {
        const [r,g,b] = this.hexToRgb(hex);
        return `rgb(${Math.min(255,r*f|0)},${Math.min(255,g*f|0)},${Math.min(255,b*f|0)})`;
    }

    rotVert([x,y,z], n) {
        for(let i=0;i<n;i++) [x,y]=[1-y,x];
        return [x,y,z];
    }

    rotDir([nx,ny,nz], n) {
        let x=nx,y=ny;
        for(let i=0;i<n;i++) [x,y]=[-y,x];
        return [x,y,nz];
    }

    isoProj([x,y,z], sc, cx,cy) {
        return [cx+(x-y)*sc, cy+(x+y)*0.5*sc-z*sc];
    }

    draw() {
        if (!this.ctx) return;
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        ctx.clearRect(0, 0, w, h);
        const cx = w / 2;
        const cy = h / 2 + this.tileSize * 0.2;
        this.drawCube(cx, cy, this.tileSize);
    }

    drawCube(cx, cy, S) {
        const splitZ = Math.max(0.001, Math.min(0.999, this.splitPct));
        const bx = 0, by = 0;

        const base = [
            [0,0,1],[1,0,1],[1,1,1],[0,1,1],
            [0,0,0],[1,0,0],[1,1,0],[0,1,0],
        ].map(([x,y,z]) => [x+bx, y+by, z]);

        const rv = base.map(([x,y,z]) => this.rotVert([x,y,z], this.rotStep));
        const proj = v => this.isoProj(v, S, cx, cy);

        const allFaces = [
            { key:'top',   vi:[0,1,2,3], n:[0,0,1],   light:1.12 },
            { key:'front', vi:[3,2,6,7], n:[0,1,0],   light:0.72 },
            { key:'right', vi:[1,5,6,2], n:[1,0,0],   light:0.88 },
            { key:'left',  vi:[0,3,7,4], n:[-1,0,0],  light:0.65 },
            { key:'back',  vi:[4,5,1,0], n:[0,-1,0],  light:0.55 },
            { key:'bot',   vi:[7,6,5,4], n:[0,0,-1],  light:0.50 },
        ];

        const visible = allFaces.filter(f => {
            const [nx,ny,nz] = this.rotDir(f.n, this.rotStep);
            return nx+ny+nz > 0;
        });
        visible.sort((a,b) => (a.n[2]===1?1:0)-(b.n[2]===1?1:0));

        visible.forEach(({ key, vi, light }) => {
            const verts3d = vi.map(i => rv[i]);
            this.drawFace(verts3d, key, light, splitZ, proj, bx, by);
        });
    }

    drawFace(verts3d, faceKey, light, splitZ, proj, bx, by) {
        const zs   = verts3d.map(v=>v[2]);
        const maxZ = Math.max(...zs), minZ = Math.min(...zs);
        const n    = verts3d.length;

        const fillRegion = (pts3d, color) => {
            if(pts3d.length < 3) return;
            const pts = pts3d.map(proj);
            this.ctx.beginPath();
            this.ctx.moveTo(pts[0][0], pts[0][1]);
            for(let i=1;i<pts.length;i++) this.ctx.lineTo(pts[i][0], pts[i][1]);
            this.ctx.closePath();
            this.ctx.fillStyle = this.shaded(color, light);
            this.ctx.fill();
        };

        const outlinePoly = (pts3d) => {
            if(!this.showOutline) return;
            const pts = pts3d.map(proj);
            this.ctx.beginPath();
            this.ctx.moveTo(pts[0][0], pts[0][1]);
            for(let i=1;i<pts.length;i++) this.ctx.lineTo(pts[i][0], pts[i][1]);
            this.ctx.closePath();
            this.ctx.strokeStyle = 'rgba(0,0,0,0.35)';
            this.ctx.lineWidth   = 1.4;
            this.ctx.stroke();
        };

        const cross = (a, b) => {
            const t = (splitZ-a[2])/(b[2]-a[2]);
            return [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, splitZ];
        };

        // ── Trivial: entire face is one colour ───────────────────────────────────
        if(splitZ >= maxZ) {
            fillRegion(verts3d, this.colorB);
            this.hatchRegion(verts3d, faceKey, this.colorB, light, proj);
            outlinePoly(verts3d);
            return;
        }
        if(splitZ <= minZ) {
            fillRegion(verts3d, this.colorA);
            this.hatchRegion(verts3d, faceKey, this.colorA, light, proj);
            outlinePoly(verts3d);
            return;
        }

        // ── Clip face at splitZ ───────────────────────────────────────────────────
        const upper=[], lower=[], seam=[];
        for(let i=0;i<n;i++) {
            const a=verts3d[i], b=verts3d[(i+1)%n];
            const aUp=a[2]>splitZ, bUp=b[2]>splitZ;
            if(aUp) upper.push(a); else lower.push(a);
            if(aUp!==bUp){const cp=cross(a,b);upper.push(cp);lower.push(cp);seam.push(cp);}
        }

        fillRegion(upper, this.colorA);
        this.hatchRegion(upper, faceKey, this.colorA, light, proj);
        fillRegion(lower, this.colorB);
        this.hatchRegion(lower, faceKey, this.colorB, light, proj);

        // Seam line
        if(seam.length===2 && this.showOutline) {
            const [p0,p1] = seam.map(proj);
            this.ctx.beginPath(); this.ctx.moveTo(p0[0],p0[1]); this.ctx.lineTo(p1[0],p1[1]);
            this.ctx.strokeStyle='rgba(0,0,0,0.45)'; this.ctx.lineWidth=1.4; this.ctx.stroke();
        }

        outlinePoly(verts3d);
    }

    hatchRegion(pts3d, fKey, color, hatchLight, proj) {
        // Gather side-specific dither params (matching three_iso3.html t* / b* uniforms)
        const isTopFace    = fKey === 'top';
        const dMode        = isTopFace ? this.tDitherMode      : this.bDitherMode;
        const dSpace       = isTopFace ? this.tDitherSpace     : this.bDitherSpace;
        const dThick       = isTopFace ? this.tDitherThick     : this.bDitherThick;
        const dBright      = isTopFace ? this.tDitherBright    : this.bDitherBright;
        const dAlpha       = isTopFace ? this.tDitherAlpha     : this.bDitherAlpha;
        const dInkMode     = isTopFace ? this.tInkMode         : this.bInkMode;

        if (dMode === 'none') return;

        const pts2d = pts3d.map(proj);
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.moveTo(pts2d[0][0], pts2d[0][1]);
        for (let i = 1; i < pts2d.length; i++) this.ctx.lineTo(pts2d[i][0], pts2d[i][1]);
        this.ctx.closePath();
        this.ctx.clip();

        if (dMode === 'random') {
            this.drawRandomDither(pts2d, dThick, dSpace, dAlpha, dBright, dInkMode);
            this.ctx.restore();
            return;
        }

        const FACE_INFO = {
            top:   { origin:[0,0,1], u:[1,0,0], v:[0,1,0] },
            right: { origin:[1,0,0], u:[0,1,0], v:[0,0,1] },
            front: { origin:[0,1,0], u:[1,0,0], v:[0,0,1] },
            left:  { origin:[0,1,0], u:[0,-1,0], v:[0,0,1] },
            back:  { origin:[1,0,0], u:[-1,0,0], v:[0,0,1] },
        };

        const fi = FACE_INFO[fKey] || FACE_INFO['top'];

        function rotAxis([ax,ay,az]) {
            let x=ax,y=ay;
            for(let i=0;i<this.rotStep;i++) [x,y]=[-y,x];
            return [x,y,az];
        }

        const uDir = rotAxis.call(this, fi.u);
        const vDir = rotAxis.call(this, fi.v);

        const drawU = dMode === 'h' || dMode === 'hv';
        const drawV = dMode === 'v' || dMode === 'hv';

        this.drawHatchLines(pts3d, uDir, vDir, fi.origin, this.tileSize, this.tileSize, drawU, drawV, proj, color, hatchLight, dSpace, dThick, dAlpha, dBright, dInkMode);
        this.ctx.restore();
    }

    drawHatchLines(verts3d, uAxis, vAxis, origin3d, uLen, vLen, drawU, drawV, proj, color, light, dSpace, dThick, dAlpha, dBright, dInkMode) {
        // Line width & phase are both expressed as fractions of the cell (1.0);
        // this mirrors the shader math in three_iso3.html (scaledUv = uv * 100/space).
        const cellW = Math.max(0.01, dSpace);
        const thickFrac = dThick / cellW; // line-band width as a cell fraction
        const intensity = Math.abs(dBright);
        let strokeR = 0, strokeG = 0, strokeB = 0;
        if (dInkMode === 'color') {
            strokeR = 255; strokeG = 255; strokeB = 255;
        } else if (dBright >= 0) {
            strokeR = 255; strokeG = 255; strokeB = 255;
        } else {
            strokeR = 0; strokeG = 0; strokeB = 0;
        }
        const strokeA = Math.min(1, dAlpha * intensity * 1.5);
        this.ctx.strokeStyle = `rgba(${strokeR},${strokeG},${strokeB},${strokeA})`;
        this.ctx.lineWidth   = 1;

        if (drawV) {
            for (let t = thickFrac * uLen; t < uLen; t += thickFrac * 2 * uLen) {
                const a3 = [origin3d[0]+uAxis[0]*t,       origin3d[1]+uAxis[1]*t,       origin3d[2]+uAxis[2]*t];
                const b3 = [origin3d[0]+uAxis[0]*t+vAxis[0]*1*vLen, origin3d[1]+uAxis[1]*t+vAxis[1]*1*vLen, origin3d[2]+uAxis[2]*t+vAxis[2]*1*vLen];
                const a2 = proj(a3), b2 = proj(b3);
                this.ctx.beginPath();
                this.ctx.moveTo(a2[0], a2[1]);
                this.ctx.lineTo(b2[0], b2[1]);
                this.ctx.stroke();
            }
            // If thickFrac >= 1 the above loop skipped; fall back to a single midband line
            if (thickFrac >= 1.0 && uLen > 0) {
                const mid = uLen * 0.5;
                const a3 = [origin3d[0]+uAxis[0]*mid,       origin3d[1]+uAxis[1]*mid,       origin3d[2]+uAxis[2]*mid];
                const b3 = [origin3d[0]+uAxis[0]*mid+vAxis[0]*vLen, origin3d[1]+uAxis[1]*mid+vAxis[1]*vLen, origin3d[2]+uAxis[2]*mid+vAxis[2]*vLen];
                const a2 = proj(a3), b2 = proj(b3);
                this.ctx.beginPath();
                this.ctx.moveTo(a2[0], a2[1]);
                this.ctx.lineTo(b2[0], b2[1]);
                this.ctx.stroke();
            }
        }

        if (drawU) {
            for (let t = thickFrac * vLen; t < vLen; t += thickFrac * 2 * vLen) {
                const a3 = [origin3d[0]+uAxis[0]*0+vAxis[0]*t, origin3d[1]+uAxis[1]*0+vAxis[1]*t, origin3d[2]+uAxis[2]*0+vAxis[2]*t];
                const b3 = [origin3d[0]+uAxis[0]*1*uLen+vAxis[0]*t, origin3d[1]+uAxis[1]*1*uLen+vAxis[1]*t, origin3d[2]+uAxis[2]*1*uLen+vAxis[2]*t];
                const a2 = proj(a3), b2 = proj(b3);
                this.ctx.beginPath();
                this.ctx.moveTo(a2[0], a2[1]);
                this.ctx.lineTo(b2[0], b2[1]);
                this.ctx.stroke();
            }
            if (thickFrac >= 1.0 && vLen > 0) {
                const mid = vLen * 0.5;
                const a3 = [origin3d[0]+uAxis[0]*0+vAxis[0]*mid, origin3d[1]+uAxis[1]*0+vAxis[1]*mid, origin3d[2]+uAxis[2]*0+vAxis[2]*mid];
                const b3 = [origin3d[0]+uAxis[0]*1*uLen+vAxis[0]*mid, origin3d[1]+uAxis[1]*1*uLen+vAxis[1]*mid, origin3d[2]+uAxis[2]*1*uLen+vAxis[2]*mid];
                const a2 = proj(a3), b2 = proj(b3);
                this.ctx.beginPath();
                this.ctx.moveTo(a2[0], a2[1]);
                this.ctx.lineTo(b2[0], b2[1]);
                this.ctx.stroke();
            }
        }
    }

    drawRandomDither(pts2d, dThick, dSpace, dAlpha, dBright, dInkMode) {
        const minX = Math.min(...pts2d.map(p=>p[0])), maxX = Math.max(...pts2d.map(p=>p[0]));
        const minY = Math.min(...pts2d.map(p=>p[1])), maxY = Math.max(...pts2d.map(p=>p[1]));
        let seed = 0xdeadbeef;
        const rand = () => { seed = (seed*1664525+1013904223)&0xffffffff; return (seed>>>0)/0xffffffff; };

        const intensity = Math.abs(dBright);
        const strokeA = dAlpha * intensity;
        let strokeR = 0, strokeG = 0, strokeB = 0;
        if (dInkMode === 'color') {
            strokeR = 255; strokeG = 255; strokeB = 255;
        } else if (dBright > 0) {
            strokeR = 255; strokeG = 255; strokeB = 255;
        } else {
            strokeR = 0; strokeG = 0; strokeB = 0;
        }
        this.ctx.fillStyle = `rgba(${strokeR},${strokeG},${strokeB},${strokeA})`;
        for (let sy = minY; sy < maxY; sy += dThick) {
            for (let sx = minX; sx < maxX; sx += dThick) {
                if (rand() > 0.5)
                    this.ctx.fillRect(sx, sy, dThick, dThick);
            }
        }
    }

    createMaterial(name) {
        const material = {
            id: 'twotone-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
            name: name || `Two-Tone ${this.materials.length + 1}`,
            type: 'twotone',
            colorA: this.colorA,
            colorB: this.colorB,
            splitPct: this.splitPct,
            // Top dither
            tDitherMode: this.tDitherMode,
            tDitherSpace: this.tDitherSpace,
            tDitherThick: this.tDitherThick,
            tDitherBright: this.tDitherBright,
            tDitherAlpha: this.tDitherAlpha,
            // Bottom dither
            bDitherMode: this.bDitherMode,
            bDitherSpace: this.bDitherSpace,
            bDitherThick: this.bDitherThick,
            bDitherBright: this.bDitherBright,
            bDitherAlpha: this.bDitherAlpha,
            tInkMode: this.tInkMode,
            bInkMode: this.bInkMode,
            showOutline: this.showOutline,
            imageData: null
        };

        const w = 512;
        const h = 512;
        
        const offscreen = document.createElement('canvas');
        offscreen.width = w;
        offscreen.height = h;
        const offCtx = offscreen.getContext('2d');
        
        offCtx.fillStyle = '#111116';
        offCtx.fillRect(0, 0, w, h);
        
        const prevTileSize = this.tileSize;
        this.tileSize = Math.floor(w * 0.4);
        
        const prevCtx = this.ctx;
        this.ctx = offCtx;
        this.draw();
        this.ctx = prevCtx;
        this.tileSize = prevTileSize;
        
        material.imageData = offscreen.toDataURL('image/png');
        material.thumbnailData = this.canvas.toDataURL('image/png');
        
        this.materials.push(material);
        
        if (this.onMaterialCreate) {
            this.onMaterialCreate(material);
        }
        
        return material;
    }

     downloadPNG(filename) {
         const downloadSize = (window.stateManager && window.stateManager.getStateProperty('preferences.materialDownloadSize')) || 512;
         
         const w = downloadSize;
         const h = downloadSize;
         
         const offscreen = document.createElement('canvas');
         offscreen.width = w;
         offscreen.height = h;
         const offCtx = offscreen.getContext('2d');
         
         offCtx.fillStyle = '#111116';
         offCtx.fillRect(0, 0, w, h);
         
         const prevTileSize = this.tileSize;
         const prevCtx = this.ctx;
         
         // Save original draw method and override for centered drawing
         const originalDraw = this.draw;
         this.draw = function() {
             if (!offCtx) return;
             offCtx.clearRect(0, 0, w, h);
             const cx = w / 2;
             const cy = h / 2; // Centered without offset for download
             this.drawCube(cx, cy, this.tileSize);
         };
         
         this.tileSize = Math.floor(downloadSize * 0.4);
         this.ctx = offCtx;
         this.draw();
         
         // Restore original draw method
         this.draw = originalDraw;
         this.ctx = prevCtx;
         this.tileSize = prevTileSize;
         
         const url = offscreen.toDataURL('image/png');
         const a = document.createElement('a');
         a.download = filename || 'material.png';
         a.href = url;
         a.click();
     }

    getMaterials() {
        return this.materials;
    }

    clearMaterials() {
        this.materials = [];
    }
}

export { MaterialBuilder };