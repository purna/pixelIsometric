# Update: Dither Ink Mode, Erase Hover Highlight, and Flat 2D Grid

## Overview

This update touches four demo files across the **2D** and **3D** tracks:

| File | Track | What Changed |
|---|---|---|
| `demos/2d/iso_drawing_tool_v11.html` | 2D Drawing Tool | Removed Z-layer / view-rotation system; added grid stamp system |
| `demos/3d/three_iso_drawing_tool_v5.html` | 3D Drawing Tool | Added erase-hover highlight system; collider transparency eased |
| `demos/2d/isometric-cube6.html` | 2D Dither | Added per-half **Ink Mode** toggle (Bright / Color ink); renamed labels |
| `demos/3d/three_iso4.html` | 3D Dither | Same Ink Mode toggle shader-side; renamed panel titles |

---

## 1 — Per-Half Dither Ink Mode

**Files:** `isometric-cube6.html` · `three_iso4.html`

Both 2D and 3D dither demos now support a pair of **Ink Type** selectors — one for the top half and one for the bottom half of each material. This was previously a single `bright` slider for both halves; now each half can independently choose its dithering strategy.

### Modes

| Mode | Behaviour |
|---|---|
| **Bright** | Blend dither toward white (positive `bright`) or black (negative `bright`) — identical to the old behaviour |
| **Color** | Use a user-chosen hex colour as the dither ink, then apply the face's light-factor to it so 3D depth is preserved |

### 2D — `isometric-cube6.html`

**UI additions (top half):**

```html
<!-- Ink Type selector (section: TOP DITHER) -->
<div class="seg" id="tInkTypeSeg">
  <button class="active" data-v="bright">Bright</button>
  <button data-v="color">Color</button>
</div>

<!-- Bright row — shown only in Bright mode -->
<div class="row" id="tBrightRow">
  <span class="lbl">Bright</span>
  <input type="range" id="tBright" ...>
  <span class="val" id="tBrightV">100</span>
</div>

<!-- Color row — shown only in Color mode -->
<div class="row hidden" id="tColorRow">
  <span class="lbl">Ink Color</span>
  <div class="sw" id="swTInk" style="background:#ffffff">
    <input type="color" id="tInkCol" value="#ffffff">
  </div>
</div>
```

The same controls are duplicated for the **Bottom half** (`bInkTypeSeg`, `bBrightRow`, `bColorRow`, `swBInk`, `bInkCol`).

**Label rename:**

```diff
- <span class="lbl">Top</span>       →  <span class="lbl">Top Base</span>
- <span class="lbl">Bottom</span>   →  <span class="lbl">Bottom Base</span>
```

**Data model change:**

```diff
- let topDither = { mode: 'hv',     space: 6, thick: 1, bright:  1.0, alpha: 0.5 };
- let botDither = { mode: 'random', space: 4, thick: 1, bright: -1.0, alpha: 0.7 };
+ let topDither = { mode: 'hv', inkMode: 'bright', inkColor: '#ffffff', space: 6, thick: 1, bright:  1.0, alpha: 0.5 };
+ let botDither = { mode: 'random', inkMode: 'bright', inkColor: '#000000', space: 4, thick: 1, bright: -1.0, alpha: 0.7 };
```

**`ditherStroke()` logic:** when `inkMode === 'color'`, the colour is first shaded by the face light-factor and then used as the dither tint; when `inkMode === 'bright'`, the original bright-direction logic is used.

---

### 3D — `three_iso4.html`

Same UI additions, but the work happens in the fragment shader.

**New uniform declarations:**

```glsl
uniform int tInkMode; uniform vec3 tInkColor;   // top half
uniform int bInkMode; uniform vec3 bInkColor;   // bottom half
```

**New JS uniforms:**

```diff
  const customUniforms = {
      colorA: { value: new THREE.Color('#3ecfb2') },
      colorB: { value: new THREE.Color('#c94b6e') },
      splitY:  { value: 0.0 },
-
-     tMode: { value: 4 }, tSpace: { value: 6.0 }, ...
+     tMode: { value: 4 }, tInkMode: { value: 0 }, tInkColor: { value: new THREE.Color('#ffffff') }, tSpace: { value: 6.0 }, ...
+     bMode: { value: 1 }, bInkMode: { value: 0 }, bInkColor: { value: new THREE.Color('#000000') }, bSpace: { value: 4.0 }, ...
  };
```

**Fragment shader change — old:**

```glsl
vec3 targetCol = dBright > 0.0 ? vec3(1.0) : vec3(0.0);
vec3 shifted   = mix(gl_FragColor.rgb, targetCol, abs(dBright));
gl_FragColor.rgb = mix(gl_FragColor.rgb, shifted, dAlpha);
```

**Fragment shader change — new:**

```glsl
vec3 targetCol;
if (dInkMode == 1) {
    // Extract Three.js's native lighting scale factor from the computed face color
    vec3 lightingFactor = gl_FragColor.rgb / max(splitBase, vec3(0.001));
    // Apply it to the chosen ink colour so faces maintain 3D depth dimension
    targetCol = dInkColor * lightingFactor;
} else {
    vec3 brightShift = dBright > 0.0 ? vec3(1.0) : vec3(0.0);
    targetCol = mix(gl_FragColor.rgb, brightShift, abs(dBright));
}
// Linear mix cleanly handles alpha blending without colour shifting
gl_FragColor.rgb = mix(gl_FragColor.rgb, targetCol, dAlpha);
```

In **Color mode** the shader recovers Three.js's G-buffer lighting by dividing the current `gl_FragColor.rgb` by the flat split-base colour; this recovers `k.blend · lightFace` so the custom ink colour is shaded the same way as every other pixel in the scene.

---

## 2 — Erase Hover Highlighting

**File:** `demos/3d/three_iso_drawing_tool_v5.html`

The 3D drawing-tool now provides visual feedback when the eraser tool is active and the cursor is hovering over a target object — without needing the click to confirm the deletion.

### New State

```javascript
let currentEraseTarget = null;   // mesh currently hovered for erasure
let lineEraseCache = [];         // line objects whose joint dots need to be restored
```

### Material Swap on Hover

When hovering in **cube layer**, the cube's entire material is replaced with a red tint:

```javascript
const eraseCubeMaterial = new THREE.MeshStandardMaterial({
    color: 0xeb4b6e, emissive: 0x4a101a, transparent: true, opacity: 0.7
});
```

When hovering in **collider layer**, the face material is swapped:

```javascript
const eraseColliderMaterial = new THREE.MeshStandardMaterial({
    color: 0xeb4b6e, side: THREE.DoubleSide, transparent: true, opacity: 0.6
});
const eraseLineMaterial  = new THREE.LineBasicMaterial({ color: 0xeb4b6e, linewidth: 4 });
const eraseJointMaterial = new THREE.MeshBasicMaterial({ color: 0xeb4b6e });
```

### Hover Branch in `updatePreviews()`

```javascript
// Handle Erase Hover Mode separately
if (activeTool === 'erase') {
    hidePreviews();
    clearEraseHighlights();

    // ① Collect objects in the active layer
    const objectsToRaycast = activeLayer === 'cube'
        ? [...activeCubes.values()]
        : [...activeColliders.values()];

    const eraseIntersects = raycaster.intersectObjects(objectsToRaycast, false);

    if (eraseIntersects.length > 0) {
        const hitObj = eraseIntersects[0].object;
        currentEraseTarget = hitObj;
        // ② Swap material for faces; save original for restoration
        if (activeLayer === 'cube') {
            hitObj.material = eraseCubeMaterial;
        } else if (activeLayer === 'collider') {
            hitObj.userData.originalMaterial = hitObj.material;
            hitObj.material = eraseColliderMaterial;
        }
        return;
    }

    // ③ Even if no face was hit, check collider vertex lines
    if (activeLayer === 'collider') {
        const planeIntersect = raycaster.intersectObject(interactionPlane);
        if (planeIntersect.length > 0) {
            const nodeData = getNearestVertex(planeIntersect[0].point);
            if (nodeData) {
                activeLines.forEach(ln => {
                    if (ln.userData.y === activeHeightIndex && adjacentVertexMatches(ln, nodeData)) {
                        ln.material = eraseLineMaterial;
                        ln.children.forEach(j => { j.material = eraseJointMaterial; });
                        lineEraseCache.push(ln);
                    }
                });
            }
        }
    }
    return;
}
```

### `clearEraseHighlights()`

Restores the original material of the previously highlighted object and resets line vertices back to their collider palette when the user moves the cursor or switches mode away from `erase`.

---

## 3 — 2D Drawing Tool v11: Flat Grid + Stamp Tray

**File:** `demos/2d/iso_drawing_tool_v11.html`

### What Was Removed

The **View Rotation** (`camRot`, `getViewCell()`, `getDataCell()`, `getViewVertex()`, `getViewFace()`) and **Z-level** (`activeZ`, `changeZ()`) abstraction layers were removed entirely. The tool no longer supports stacking cubes on multiple vertical levels or rotating the view. All cubes now live on a single flat layer.

Corresponding toolbar controls — **View CW/CCW** buttons and the **Level Z ±** buttons — were removed.

### Grid Stamp / Placement System

A new block-registry pattern replaces inline geometry calls:

```javascript
const BLOCK_TYPES = {
  'cube':      { name: 'split',        alpha: 1.0, ... },
  'cube-solid':{ name: 'solid',        alpha: 1.0, ... },
  'cube-water':{ name: 'water',        alpha: 0.5, ... },
};
```

The **Save to Grid** button (`renderSnapshot()`) renders a tight-cropped 2× scaled PNG blob of the current drawing, stores both the `blobUrl` and a deep JSON snapshot of scene state (`cubesSnap`, `collidersSnap`), and appends a thumbnail to the stamp tray.

The **12×8 placement grid** (`GCOLS`, `GROWS`) renders placed stamps sorted by `gridCol + gridRow` (painter's algorithm) so earlier stamps are drawn first. Right-click on the placement grid removes the stamp at that cell.

---

## Summary of Changes Across All Four Files

| Demo | Change | Depth |
|---|---|---|
| `iso_drawing_tool_v11.html` | Removed Z-level / view-rotation system; added stamp registry, stamp tray, placement grid | All drawing, collision, and snapshot code simplified to flat 2D coordinates |
| `three_iso_drawing_tool_v5.html` | Added erase-hover highlight materials (`eraseCubeMaterial`, `eraseColliderMaterial`, `eraseLineMaterial`, `eraseJointMaterial`); added `clearEraseHighlights()` and erase branch in `updatePreviews()`; eased collider default opacity `0.35→0.15` (`MeshStandardMaterial` with `roughness:0.5`); connector-transparent `0.2` for `colliderLineMat`; `currentHeightIndex` comment trimmed | ~50 new lines |
| `isometric-cube6.html` | Per-half **Ink Mode** (Bright / Color); top/bottom `bright` rows made context-sensitive; `Ink Color` row per half; label rename (Top → Top Base, Bottom → Bottom Base); `ditherStroke()` branching on `inkMode` | ~60 new UI controls + ~35 new JS lines |
| `three_iso4.html` | Same Ink Mode additions as 2D + GLSL extension: `int tInkMode`, `vec3 tInkColor`, `int bInkMode`, `vec3 bInkColor` uniforms; "Ink Type" select row clearly separated from "Bright" row; fragment shader uses lighting-factor extraction when `dInkMode==1` | ~10 new UI rows + ~15 uniform lines + ~40 GLSL lines |
