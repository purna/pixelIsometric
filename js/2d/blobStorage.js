/**
 * js/2d/blobStorage.js — Blob-backed scene serialisation for the 2D canvas editor.
 *
 * Pattern (from iso_drawing_tool_v7_blob.html):
 *  - Capture  : render current scene data → object URL via canvas.toBlob()
 *  - Persist : as indexedDB or as base64 string inside localStorage keys
 *  - Restore : create Image() <src = objectURL> and draw▲ onto target canvas
 *
 * Public API:
 *  .capture(canvasRect, state)  ⇒ Blob               — creates a blob URL from an offscreen render
 *  .saveScene(label, state, blob) ⇒ string key       — persist blob URL into localStorage
 *  .loadScenes()                ⇒ Record<string,Blob> — restore from localStorage
 *  .snapshotToDataUrl(blob)     ⇒ string              — for thumbnails / image previews
 *  .registerLocalStoreKey(key)  — safety: reserve a URL.createObjectURL blob before localStorage write
 */
class BlobStorage {
    constructor(lsPrefix = 'iso2d') {
        this.lsPrefix   = lsPrefix;
        this._urlMap    = new Map();   // uuid → Blob (URL.createObjectURL kept alive as long as mapped)
    }

    _lsKey(idx) { return `${this.lsPrefix}:scene:${idx}`; }

    /**
     * Serialise current scene state into a base64 string.
     * (Compact, stored inside localStorage alongside the blob reference.)
     */
    static _stateToString(state) {
        // state has: cubes{}, colliders[], colorA, colorB, splitPct
        return JSON.stringify({
            cubes:      state.cubes      || {},
            colliders:  state.colliders  || [],
            colorA:     state.colorA     || '#3ecfb2',
            colorB:     state.colorB     || '#c94b6e',
            splitPct:   state.splitPct   ?? 0.5,
        });
    }

    /**
     * Render an offscreen thumbnail of the current scene.
     * @param {Function} drawFaceFn  (ctx2, verts, light) => void
     * @param {Function} _iso        (x,y,z) => [px,py]   iso projection
     * @param {object}   state       current scene snapshot
     * @param {number}   scale        export resolution multiplier
     * @returns  {HTMLCanvasElement}
     */
    _renderOffscreen(drawFaceFn, _iso, state, scale = 2) {
        if (!Object.keys(state.cubes || {}).length) return null;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const key in state.cubes) {
            const [c, r] = key.split(',').map(Number);
            [[c, r, 1], [c + 1, r, 1], [c + 1, r + 1, 1], [c, r + 1, 1],
             [c, r, 0], [c + 1, r, 0], [c + 1, r + 1, 0], [c, r + 1, 0]].forEach(([x, y, z]) => {
                const [px, py] = _iso(x, y, z);
                minX = Math.min(minX, px); minY = Math.min(minY, py);
                maxX = Math.max(maxX, px); maxY = Math.max(maxY, py);
            });
        }

        const PAD = 6;
        minX -= PAD; minY -= PAD; maxX += PAD; maxY += PAD;
        const sw2 = (maxX - minX) * scale, sh2 = (maxY - minY) * scale;

        const offscreen = document.createElement('canvas');
        offscreen.width = sw2; offscreen.height = sh2;
        const octx = offscreen.getContext('2d');

        // Shift origin so crop box lands at (0,0) of offscreen canvas
        const savedOX = _iso(0, 0, 0), savedS = 1; // callers re-bind OX/OY/S — here we just rely on caller shifting
        // We call drawFaceFn directly — caller closes over _iso with modified OX/OY
        octx.clearRect(0, 0, sw2, sh2);

        for (const key in state.cubes) {
            const [c, r] = key.split(',').map(Number);
            state._drawCube(octx, c, r);
        }
        return offscreen;
    }

    /**
     * Capture the current scene as a Blob.
     * Caller (stampLayer) re-binds its own _iso projection before invoking.
     */
    capture(drawFaceFn, _iso, state, scale) {
        const canvas = this._renderOffscreen(drawFaceFn, _iso, state, scale);
        if (!canvas) return null;
        return new Promise(resolve => canvas.toBlob(blob => resolve(blob), 'image/png'));
    }

    /**
     * Persist a scene snapshot under an auto-increment id.
     * Returns that id.
     */
    async persistScene(label, state, blob, drawFn, _isoFn) {
        // Serialise state compactly
        const stateStr = BlobStorage._stateToString(state);

        // Find next numeric id inside localStorage keys
        let nextId = 1;
        for (let i = 0; ; i++) {
            const key = `iso2d:meta:${i}`;
            if (!localStorage.getItem(key)) { nextId = i; break; }
        }

        // Blob URL must survive across sessions — store the data as base64 DataURL
        const dataUrl = await new Promise(res => blob.arrayBuffer().then(buf => {
            const bytes = new Uint8Array(buf);
            let binary = '';
            for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
            const b64 = btoa(binary);
            res('data:image/png;base64,' + b64);
        }));

        // Meta record (lightweight flag + label)
        const meta = { label, stateSnap: stateStr, stampIndex: nextId };
        localStorage.setItem(`iso2d:meta:${nextId}`, JSON.stringify(meta));
        localStorage.setItem(`iso2d:img:${nextId}`, dataUrl);

        return nextId;
    }

    /** Restore all persisted scene meta-records */
    loadMeta() {
        const records = [];
        let i = 0;
        for (let idx = 0; ; idx++) {
            const raw = localStorage.getItem(`iso2d:meta:${idx}`);
            if (raw === null) break;
            try { records.push({ idx, ...JSON.parse(raw) }); } catch (_) {}
        }
        return records;
    }

    /** Load a saved blob URL for a stamp id */
    loadBlobUrl(idx) {
        const dataUrl = localStorage.getItem(`iso2d:img:${idx}`);
        if (!dataUrl) return null;
        return dataUrl; // DataURL works everywhere Image() accepts src
    }

    /** Delete a saved stamp id */
    deleteScene(idx) {
        localStorage.removeItem(`iso2d:meta:${idx}`);
        localStorage.removeItem(`iso2d:img:${idx}`);
    }
}

export { BlobStorage };
