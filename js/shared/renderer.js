/**
 * Canvas2D Renderer — pure 2D isometric drawing (no THREE dependency).
 * Single shared entry for the drawing-tool canvas and the stamp-grid.
 * Adapts iso_drawing_tool_v7_blob.html geometry + isoProj math.
 */
class Canvas2DRenderer {
    constructor(masterCanvas) {
        this.wrapEl  = masterCanvas.parentElement;
        this.master  = masterCanvas;                      // top-level drawing canvas
        this.ctx     = masterCanvas.getContext('2d');
        this.S       = 42;                                 // iso tile size (set by resize)
        this.W       = 0;
        this.H       = 0;
        this.OX      = 0;
        this.OY      = 0;

        // Scene state mirrors shared/state.js (local reference for hot-threads)
        this.colorA   = '#3ecfb2';
        this.colorB   = '#c94b6e';
        this.splitPct = 0.5;

        // Exposed cube/collider stores (2D system: keyed by "col,row")
        this.cubes     = {};    // { "c,r": 1 }
        this.colliders = [];    // [{type:'top'|'left'|'right'|'line', col, row}|{type:'line',x1,y1,x2,y2}]
        this.hoverTile = null;
        this.hoverDot  = null;
        this.activeTool = 'cube';

        // Event bus (set by 2D adapter)
        this.onClick = null;
        this.onMouseMove = null;
        this.onResize = null;

        this.resize();
        this._bindEvents();
    }

    // ── iso projection helpers (shared math) ──────────────────────────────────
    _iso(x, y, z) {
        return [this.OX + (x - y) * this.S, this.OY + (x + y) * 0.5 * this.S - z * this.S];
    }

    _shaded(hex, f) {
        const r = parseInt(hex.slice(1,3), 16);
        const g = parseInt(hex.slice(3,5), 16);
        const b = parseInt(hex.slice(5,7), 16);
        return `rgb(${Math.min(255, r * f | 0)},${Math.min(255, g * f | 0)},${Math.min(255, b * f | 0)})`;
    }

    // ── Layout ────────────────────────────────────────────────────────────────
    resize() {
        const rect = this.wrapEl.getBoundingClientRect();
        this.W = rect.width;
        this.H = rect.height;
        [this.master].forEach(c => { c.width = this.W; c.height = this.H; });
        // Center the grid
        this.OX = this.W / 2;
        this.OY = this.H / 2;
        this.redraw();
    }

    // ── Low-level face drawer (mirrors iso_drawing_tool_v6 drawFace) ───────────
    _drawFace(ctx, verts3d, light) {
        const maxZ = Math.max(...verts3d.map(v => v[2]));
        const minZ = Math.min(...verts3d.map(v => v[2]));
        const splitZ = Math.max(0.001, Math.min(0.999, this.splitPct));

        const _proj = v => this._iso(v[0], v[1], v[2]);

        function fill(pts3d, color) {
            if (pts3d.length < 3) return;
            const pts = pts3d.map(_proj);
            ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
            for (let i = 1; i < pts3d.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
            ctx.closePath();
            ctx.fillStyle = renderer._shaded(color, light);
            ctx.fill();
        }

        function outline(pts3d) {
            const pts = pts3d.map(_proj);
            ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
            for (let i = 1; i < pts3d.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
            ctx.closePath();
            ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1.2; ctx.stroke();
        }

        function crossPt(a, b) {
            const t = (splitZ - a[2]) / (b[2] - a[2]);
            return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, splitZ];
        }

        if (splitZ >= maxZ) { fill(verts3d, this.colorB); outline(verts3d); return; }
        if (splitZ <= minZ) { fill(verts3d, this.colorA); outline(verts3d); return; }

        const upper = [], lower = [], seam = [];
        const n = verts3d.length;
        for (let i = 0; i < n; i++) {
            const a = verts3d[i], b = verts3d[(i + 1) % n];
            const aUp = a[2] > splitZ, bUp = b[2] > splitZ;
            if (aUp) upper.push(a); else lower.push(a);
            if (aUp !== bUp) { const cp = crossPt(a, b); upper.push(cp); lower.push(cp); seam.push(cp); }
        }
        fill(upper, this.colorA);
        fill(lower, this.colorB);
        if (seam.length === 2) {
            const [p0, p1] = seam.map(_proj);
            ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]);
            ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 1.2; ctx.stroke();
        }
        outline(verts3d);
    }

    _drawCube(ctx, col, row) {
        const splitZ = Math.max(0.001, Math.min(0.999, this.splitPct));
        // 8 corners in grid coordinates
        const v = [
            [col, row, 1],   [col + 1, row, 1],   [col + 1, row + 1, 1], [col, row + 1, 1],
            [col, row, 0],   [col + 1, row, 0],   [col + 1, row + 1, 0], [col, row + 1, 0],
        ];
        // Draw in painter's order: back faces first → front last
        this._drawFace(ctx, [v[3], v[2], v[6], v[7]], 0.70);  // left face
        this._drawFace(ctx, [v[1], v[2], v[6], v[5]], 0.88);  // right face
        this._drawFace(ctx, [v[0], v[1], v[2], v[3]], 1.12);  // top face
    }

    // ── Public draw helpers ───────────────────────────────────────────────────
    redraw() {
        this._drawGrid();
        this._drawCubes();
        this._drawColliders();
    }

    _drawGrid() {
        this.ctx.clearRect(0, 0, this.W, this.H);
        // Center the 7x7 grid (start at -3, -3 to center around origin)
        for (let col = -3; col <= 3; col++) {
            for (let row = -3; row <= 3; row++) {
                const four = [this._iso(col, row, 0), this._iso(col + 1, row, 0), this._iso(col + 1, row + 1, 0), this._iso(col, row + 1, 0)];
                const isHov = this.hoverTile && this.activeTool === 'cube'
                    && this.hoverTile.col === col && this.hoverTile.row === row;
                this.ctx.beginPath();
                this.ctx.moveTo(four[0][0], four[0][1]);
                four.slice(1).forEach(p => this.ctx.lineTo(p[0], p[1]));
                this.ctx.closePath();
                this.ctx.fillStyle = isHov ? 'rgba(62,207,178,0.12)' : 'rgba(255,255,255,0.02)';
                this.ctx.fill();
                this.ctx.strokeStyle = isHov ? 'rgba(62,207,178,0.5)' : 'rgba(255,255,255,0.07)';
                this.ctx.lineWidth = isHov ? 1 : 0.5;
                this.ctx.stroke();
            }
        }
    }

    _drawCubes() {
        Object.keys(this.cubes).forEach(key => {
            const [c, r] = key.split(',').map(Number);
            this._drawCube(this.ctx, c, r);
        });
        if (this.hoverTile && this.activeTool === 'cube' && !this.cubes[`${this.hoverTile.col},${this.hoverTile.row}`]) {
            this.ctx.globalAlpha = 0.35;
            this._drawCube(this.ctx, this.hoverTile.col, this.hoverTile.row);
            this.ctx.globalAlpha = 1;
        }
    }

    _drawOneCollider(ctx2, c, ghost) {
        if (c.type === 'line') {
            const p1 = this._iso(c.x1, c.y1, 1), p2 = this._iso(c.x2, c.y2, 1);
            ctx2.beginPath(); ctx2.moveTo(p1[0], p1[1]); ctx2.lineTo(p2[0], p2[1]);
            ctx2.strokeStyle = ghost ? 'rgba(78,255,145,0.4)' : 'rgba(78,255,145,0.9)';
            ctx2.lineWidth   = ghost ? 1.5 : 2.5;
            ctx2.setLineDash(ghost ? [5, 4] : []); ctx2.lineCap = 'round'; ctx2.stroke(); ctx2.setLineDash([]);
            [p1, p2].forEach(p => {
                ctx2.beginPath(); ctx2.arc(p[0], p[1], 3.5, 0, Math.PI * 2);
                ctx2.fillStyle = ghost ? 'rgba(78,255,145,0.4)' : '#4eff91'; ctx2.fill();
            });
            return;
        }
        const col = c.col, row = c.row;
        const verts = (() => {
            if (c.type === 'top')  return this._iso(col, row, 1), this._iso(col + 1, row, 1), this._iso(col + 1, row + 1, 1), this._iso(col, row + 1, 1);
            if (c.type === 'left') return this._iso(col, row + 1, 1), this._iso(col + 1, row + 1, 1), this._iso(col + 1, row + 1, 0), this._iso(col, row + 1, 0);
            if (c.type === 'right')return this._iso(col + 1, row, 1), this._iso(col + 1, row + 1, 1), this._iso(col + 1, row + 1, 0), this._iso(col + 1, row, 0);
            return [];
        })();
        if (verts.length < 4) return;
        ctx2.beginPath(); ctx2.moveTo(verts[0][0], verts[0][1]);
        for (let i = 1; i < 4; i++) ctx2.lineTo(verts[i][0], verts[i][1]);
        ctx2.closePath();
        ctx2.fillStyle   = ghost ? 'rgba(78,255,145,0.04)' : 'rgba(78,255,145,0.07)'; ctx2.fill();
        ctx2.strokeStyle = ghost ? 'rgba(78,255,145,0.4)' : 'rgba(78,255,145,0.9)'; ctx2.lineWidth = ghost ? 1.2 : 2; ctx2.stroke();
    }

    _drawColliders() {
        // We need a 2nd canvas context — the caller passes it in via _setOverlayContext
    }

    _setOverlayContext(ctx2) {
        this._overlayCtx = ctx2;
    }

    _drawCollidersOn(ctx2) {
        if (!ctx2) return;
        Object.values(this.colliders).forEach(c => this._drawOneCollider(ctx2, c, false));
        if (this.hoverTile && (this.activeTool === 'col-top' || this.activeTool === 'col-left' || this.activeTool === 'col-right')) {
            this._drawOneCollider(ctx2, { type: this.activeTool.replace('col-', ''), col: this.hoverTile.col, row: this.hoverTile.row }, true);
        }
    }

    // ── Event wiring (called from app2d) ─────────────────────────────────────
    _bindEvents() {
        this._onMouseMove = (px, py) => {
            if (this.activeTool === 'col-line') {
                this.hoverTile = null;
                this.hoverDot = this._nearestVertex(px, py);
            } else {
                this.hoverDot = null;
                this.hoverTile = this._nearestTile(px, py);
            }
            this.redraw();
            this._drawCollidersOn(this._overlayCtx);
            if (this.onMouseMove) this.onMouseMove({ tile: this.hoverTile, dot: this.hoverDot });
        };
        this._onClick = (px, py) => {
            // handled by app2d which has full state access
            if (this.onClick) this.onClick(px, py);
        };
    }

    _nearestTile(px, py) {
        const xmy = (px - this.OX) / this.S, xpy = (py - this.OY) / (0.5 * this.S);
        const col = Math.floor((xpy + xmy) / 2), row = Math.floor((xpy - xmy) / 2);
        if (col >= -3 && col <= 3 && row >= -3 && row <= 3) return { col, row };
        return null;
    }

    _nearestVertex(px, py) {
        const xmy = (px - this.OX) / this.S, xpy = (py - this.OY + this.S) / (0.5 * this.S);
        const vx = Math.round((xpy + xmy) / 2), vy = Math.round((xpy - xmy) / 2);
        const snapped = this._iso(vx, vy, 1);
        if (Math.hypot(snapped[0] - px, snapped[1] - py) < this.S * 0.55)
            return { gx: vx, gy: vy };
        return null;
    }
}

export { Canvas2DRenderer };
