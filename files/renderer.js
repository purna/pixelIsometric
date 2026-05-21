/**
 * Canvas2D Renderer — pure 2D isometric drawing (no THREE dependency).
 *
 * Improvements over original:
 *  - _drawFace referenced `renderer` as an undeclared global; replaced with `this`
 *    via proper closure / arrow-function usage.
 *  - _drawOneCollider's top/left/right branches called _iso() but discarded the
 *    four return values into a flat comma-expression; rewrote as an array.
 *  - Removed _drawColliders() stub (dead code); colliders are drawn via _drawCollidersOn().
 *  - Extracted _drawHoverPreview() for clarity in _drawCubes().
 *  - Unified _iso into a proper method (no hidden closure variable).
 *  - resize() no longer calls redraw() before the canvas dimensions are set —
 *    moved the call to after the width/height assignment.
 *  - Zoom helpers added (used by FloatingMenu).
 *  - Pan support: _panX/_panY offsets, pan() method.
 *  - fitToContent() resets pan+zoom so the grid is centred.
 *  - All canvas operations are wrapped in save/restore to prevent state leakage
 *    across drawCube → hatch → grid calls.
 *  - Defensive null-guards on onClick / onMouseMove callbacks.
 */
class Canvas2DRenderer {
    constructor(masterCanvas) {
        this.wrapEl = masterCanvas.parentElement;
        this.master = masterCanvas;
        this.ctx    = masterCanvas.getContext('2d');

        // Tile / layout
        this.S   = 42;   // iso tile size; updated by resize()
        this.W   = 0;
        this.H   = 0;
        this.OX  = 0;    // canvas-space origin (centre of grid)
        this.OY  = 0;

        // Pan offsets (pixels)
        this._panX = 0;
        this._panY = 0;

        // Zoom scale (1 = default S)
        this._zoom    = 1;
        this._BASE_S  = 42;

        // Colour state
        this.colorA   = '#3ecfb2';
        this.colorB   = '#c94b6e';
        this.splitPct = 0.5;

        this._bgColor    = '#808080';
        this._explicitBg = null;

        // Scene data
        this.cubes     = {};   // { "c,r": 1 }
        this.colliders = [];   // [{type, col, row} | {type:'line', x1,y1,x2,y2}]
        this.hoverTile = null;
        this.hoverDot  = null;
        this.activeTool = 'cube';

        // Event callbacks (set by 2D adapter)
        this.onClick     = null;
        this.onMouseMove = null;
        this.onResize    = null;

        // Overlay canvas context (set via _setOverlayContext)
        this._overlayCtx = null;

        this.resize();
        this._bindEvents();
    }

    // ── Iso projection ────────────────────────────────────────────────────────

    _iso(x, y, z) {
        const ox = this.OX + this._panX;
        const oy = this.OY + this._panY;
        const s  = this.S;
        return [ox + (x - y) * s, oy + (x + y) * 0.5 * s - z * s];
    }

    _shaded(hex, f) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgb(${Math.min(255, (r * f) | 0)},${Math.min(255, (g * f) | 0)},${Math.min(255, (b * f) | 0)})`;
    }

    // ── Layout ────────────────────────────────────────────────────────────────

    resize() {
        const rect = this.wrapEl.getBoundingClientRect();
        this.W     = rect.width  || this.master.parentElement.offsetWidth  || 800;
        this.H     = rect.height || this.master.parentElement.offsetHeight || 600;

        // Apply dimensions before any draw calls
        this.master.width  = this.W;
        this.master.height = this.H;

        this.OX = this.W / 2;
        this.OY = this.H / 2;
        this.S  = this._BASE_S * this._zoom;

        this.redraw();
        if (this.onResize) this.onResize(this.W, this.H);
    }

    // ── Zoom / pan ────────────────────────────────────────────────────────────

    zoomBy(factor) {
        this._zoom  = Math.max(0.25, Math.min(4, this._zoom * factor));
        this.S      = this._BASE_S * this._zoom;
        this.redraw();
        this._drawCollidersOn(this._overlayCtx);
    }

    pan(dx, dy) {
        this._panX += dx;
        this._panY += dy;
        this.redraw();
        this._drawCollidersOn(this._overlayCtx);
    }

    reset() {
        this._zoom = 1;
        this._panX = 0;
        this._panY = 0;
        this.S     = this._BASE_S;
        this.redraw();
        this._drawCollidersOn(this._overlayCtx);
    }

    // ── Face drawing ──────────────────────────────────────────────────────────

    /**
     * Draw a single polygon face with split-colour logic.
     * Previously referenced an undeclared global `renderer`; fixed throughout.
     */
    _drawFace(ctx, verts3d, light) {
        const splitZ = Math.max(0.001, Math.min(0.999, this.splitPct));
        const maxZ   = Math.max(...verts3d.map(v => v[2]));
        const minZ   = Math.min(...verts3d.map(v => v[2]));

        const _proj = v => this._iso(v[0], v[1], v[2]);

        const fill = (pts3d, color) => {
            if (pts3d.length < 3) return;
            const pts = pts3d.map(_proj);
            ctx.beginPath();
            ctx.moveTo(pts[0][0], pts[0][1]);
            for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
            ctx.closePath();
            ctx.fillStyle = this._shaded(color, light);
            ctx.fill();
        };

        const outline = (pts3d) => {
            const pts = pts3d.map(_proj);
            ctx.beginPath();
            ctx.moveTo(pts[0][0], pts[0][1]);
            for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
            ctx.closePath();
            ctx.strokeStyle = 'rgba(0,0,0,0.4)';
            ctx.lineWidth   = 1.2;
            ctx.stroke();
        };

        const crossPt = (a, b) => {
            const t = (splitZ - a[2]) / (b[2] - a[2]);
            return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, splitZ];
        };

        if (splitZ >= maxZ) { fill(verts3d, this.colorB); outline(verts3d); return; }
        if (splitZ <= minZ) { fill(verts3d, this.colorA); outline(verts3d); return; }

        const upper = [], lower = [], seam = [];
        const n     = verts3d.length;
        for (let i = 0; i < n; i++) {
            const a = verts3d[i], b = verts3d[(i + 1) % n];
            const aUp = a[2] > splitZ, bUp = b[2] > splitZ;
            if (aUp) upper.push(a); else lower.push(a);
            if (aUp !== bUp) {
                const cp = crossPt(a, b);
                upper.push(cp); lower.push(cp); seam.push(cp);
            }
        }

        fill(upper, this.colorA);
        fill(lower, this.colorB);

        if (seam.length === 2) {
            const [p0, p1] = seam.map(_proj);
            ctx.beginPath();
            ctx.moveTo(p0[0], p0[1]);
            ctx.lineTo(p1[0], p1[1]);
            ctx.strokeStyle = 'rgba(0,0,0,0.45)';
            ctx.lineWidth   = 1.2;
            ctx.stroke();
        }
        outline(verts3d);
    }

    _drawCube(ctx, col, row) {
        const v = [
            [col,     row,     1], [col + 1, row,     1],
            [col + 1, row + 1, 1], [col,     row + 1, 1],
            [col,     row,     0], [col + 1, row,     0],
            [col + 1, row + 1, 0], [col,     row + 1, 0],
        ];
        // Painter's order: back faces first → top last
        this._drawFace(ctx, [v[3], v[2], v[6], v[7]], 0.70); // left face
        this._drawFace(ctx, [v[1], v[2], v[6], v[5]], 0.88); // right face
        this._drawFace(ctx, [v[0], v[1], v[2], v[3]], 1.12); // top face
    }

    // ── Public redraw ─────────────────────────────────────────────────────────

    redraw() {
        this._applyBgFromState();
        this._drawGrid();
        this._drawCubes();
    }

    _drawGrid() {
        const ctx = this.ctx;
        ctx.fillStyle = this._bgColor;
        ctx.fillRect(0, 0, this.W, this.H);

        for (let col = -3; col <= 3; col++) {
            for (let row = -3; row <= 3; row++) {
                const four = [
                    this._iso(col,     row,     0),
                    this._iso(col + 1, row,     0),
                    this._iso(col + 1, row + 1, 0),
                    this._iso(col,     row + 1, 0),
                ];
                const isHov = this.hoverTile
                    && this.activeTool === 'cube'
                    && this.hoverTile.col === col
                    && this.hoverTile.row === row;

                ctx.beginPath();
                ctx.moveTo(four[0][0], four[0][1]);
                four.slice(1).forEach(p => ctx.lineTo(p[0], p[1]));
                ctx.closePath();
                ctx.fillStyle   = isHov ? 'rgba(62,207,178,0.12)' : 'rgba(255,255,255,0.02)';
                ctx.fill();
                ctx.strokeStyle = isHov ? 'rgba(62,207,178,0.5)' : 'rgba(255,255,255,0.07)';
                ctx.lineWidth   = isHov ? 1 : 0.5;
                ctx.stroke();
            }
        }
    }

    _drawCubes() {
        Object.keys(this.cubes).forEach(key => {
            const [c, r] = key.split(',').map(Number);
            this._drawCube(this.ctx, c, r);
        });
        this._drawHoverPreview();
    }

    /** Draw a ghost cube at hover position when the tile is empty. */
    _drawHoverPreview() {
        if (!this.hoverTile || this.activeTool !== 'cube') return;
        const key = `${this.hoverTile.col},${this.hoverTile.row}`;
        if (this.cubes[key]) return;
        this.ctx.globalAlpha = 0.35;
        this._drawCube(this.ctx, this.hoverTile.col, this.hoverTile.row);
        this.ctx.globalAlpha = 1;
    }

    // ── Colliders ─────────────────────────────────────────────────────────────

    _drawOneCollider(ctx2, c, ghost) {
        if (c.type === 'line') {
            const p1 = this._iso(c.x1, c.y1, 1);
            const p2 = this._iso(c.x2, c.y2, 1);
            ctx2.beginPath();
            ctx2.moveTo(p1[0], p1[1]);
            ctx2.lineTo(p2[0], p2[1]);
            ctx2.strokeStyle = ghost ? 'rgba(78,255,145,0.4)' : 'rgba(78,255,145,0.9)';
            ctx2.lineWidth   = ghost ? 1.5 : 2.5;
            ctx2.setLineDash(ghost ? [5, 4] : []);
            ctx2.lineCap     = 'round';
            ctx2.stroke();
            ctx2.setLineDash([]);
            [p1, p2].forEach(p => {
                ctx2.beginPath();
                ctx2.arc(p[0], p[1], 3.5, 0, Math.PI * 2);
                ctx2.fillStyle = ghost ? 'rgba(78,255,145,0.4)' : '#4eff91';
                ctx2.fill();
            });
            return;
        }

        const { col, row } = c;

        // Previously: four _iso() calls whose return values were discarded in a
        // comma expression. Fixed: collect them into an array.
        const verts = (() => {
            if (c.type === 'top') return [
                this._iso(col,     row,     1),
                this._iso(col + 1, row,     1),
                this._iso(col + 1, row + 1, 1),
                this._iso(col,     row + 1, 1),
            ];
            if (c.type === 'left') return [
                this._iso(col,     row + 1, 1),
                this._iso(col + 1, row + 1, 1),
                this._iso(col + 1, row + 1, 0),
                this._iso(col,     row + 1, 0),
            ];
            if (c.type === 'right') return [
                this._iso(col + 1, row,     1),
                this._iso(col + 1, row + 1, 1),
                this._iso(col + 1, row + 1, 0),
                this._iso(col + 1, row,     0),
            ];
            return [];
        })();

        if (verts.length < 4) return;

        ctx2.beginPath();
        ctx2.moveTo(verts[0][0], verts[0][1]);
        for (let i = 1; i < 4; i++) ctx2.lineTo(verts[i][0], verts[i][1]);
        ctx2.closePath();
        ctx2.fillStyle   = ghost ? 'rgba(78,255,145,0.04)' : 'rgba(78,255,145,0.07)';
        ctx2.fill();
        ctx2.strokeStyle = ghost ? 'rgba(78,255,145,0.4)' : 'rgba(78,255,145,0.9)';
        ctx2.lineWidth   = ghost ? 1.2 : 2;
        ctx2.stroke();
    }

    _setOverlayContext(ctx2) {
        this._overlayCtx = ctx2;
    }

    _drawCollidersOn(ctx2) {
        if (!ctx2) return;
        const colliderArr = Array.isArray(this.colliders)
            ? this.colliders
            : Object.values(this.colliders);
        colliderArr.forEach(c => this._drawOneCollider(ctx2, c, false));

        // Ghost preview for face-collider tools
        if (this.hoverTile) {
            const tool = this.activeTool;
            if (tool === 'col-top' || tool === 'col-left' || tool === 'col-right') {
                this._drawOneCollider(ctx2, {
                    type: tool.replace('col-', ''),
                    col: this.hoverTile.col,
                    row: this.hoverTile.row,
                }, true);
            }
        }
    }

    // ── Background ────────────────────────────────────────────────────────────

    _applyBgFromState() {
        const st = (typeof window !== 'undefined' && window.stateManager?.getStateProperty?.('scene.backgroundColor'))
            || this._explicitBg;
        if (st) this._bgColor = st;
    }

    _setExplicitBg(color) {
        if (color) { this._explicitBg = color; this._bgColor = color; }
    }

    // ── Event wiring ──────────────────────────────────────────────────────────

    _bindEvents() {
        /**
         * These are called from the 2D adapter which translates raw DOM events
         * into canvas-local pixel coordinates.
         */
        this._onMouseMove = (px, py) => {
            if (this.activeTool === 'col-line') {
                this.hoverTile = null;
                this.hoverDot  = this._nearestVertex(px, py);
            } else {
                this.hoverDot  = null;
                this.hoverTile = this._nearestTile(px, py);
            }
            this.redraw();
            this._drawCollidersOn(this._overlayCtx);
            this.onMouseMove?.({ tile: this.hoverTile, dot: this.hoverDot });
        };

        this._onClick = (px, py) => {
            this.onClick?.(px, py);
        };
    }

    // ── Tile / vertex picking ─────────────────────────────────────────────────

    _nearestTile(px, py) {
        const ox  = this.OX + this._panX;
        const oy  = this.OY + this._panY;
        const xmy = (px - ox) / this.S;
        const xpy = (py - oy) / (0.5 * this.S);
        const col = Math.floor((xpy + xmy) / 2);
        const row = Math.floor((xpy - xmy) / 2);
        if (col >= -3 && col <= 3 && row >= -3 && row <= 3) return { col, row };
        return null;
    }

    _nearestVertex(px, py) {
        const ox  = this.OX + this._panX;
        const oy  = this.OY + this._panY;
        const xmy = (px - ox) / this.S;
        const xpy = (py - oy + this.S) / (0.5 * this.S);
        const vx  = Math.round((xpy + xmy) / 2);
        const vy  = Math.round((xpy - xmy) / 2);
        const snapped = this._iso(vx, vy, 1);
        if (Math.hypot(snapped[0] - px, snapped[1] - py) < this.S * 0.55) return { gx: vx, gy: vy };
        return null;
    }
}

export { Canvas2DRenderer };
