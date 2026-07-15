# Isometric Level Designer — Source of Truth

> **Single source of truth** for features, specifications, and intended functionality.
> Last updated: 2026-07-05

---

## 0. Core Philosophy — Two Ways to Work, One App

The application supports **two equivalent workflows** that can be freely mixed:

| Workflow | Description |
|---|---|
| **Object Mode** | Place discrete 3D objects (cube, ramp, arch…) into the scene, then assign a material/texture to each. |
| **Paint Mode** | Pick a material/texture first, then paint tiles directly onto the isometric canvas. The object shape is implied by the tile type selected. |

Both modes write to the same underlying data model — a tile placed by painting and a cube added via the Objects panel are **identical** in the scene graph. The distinction is purely UX: which action you initiate first.

**Reference implementation:** `demos/2d/iso_drawing_tool_v16.html` — the canonical example of paint-mode UX, canvas expansion, collider visuals, z-layers, and the material dock.

---

## 1. Project Management

A **Project** is the top-level container for all user-created work.

- **Multiple Scenes**: A project can contain one or more scenes.
- **Project Actions**:
  - **Save**: Persist the entire project, including all scenes, tiles, and materials (local browser storage + JSON download).
  - **Load**: Load a previously saved project.
  - **Edit**: Modify project-level details (e.g., name, description).
  - **Export**: Export the project data.
  - **Delete**: Remove a project.

---

## 2. Scenes

A **Scene** is an isometric environment where tiles are placed to build a level.

- **Saving & Loading**: Scenes can be saved and loaded, both to local browser storage and as JSON files.
- **Exporting**: Scenes can be exported in various formats (`.obj`, `.stl`, Unity-compatible).
- **Scene Rotation**: The entire scene view can be rotated CW/CCW in 90° steps (4 discrete camera angles). All tile coordinates are remapped on rotation so the underlying data remains rotation-invariant.

---

## 3. Canvas & Viewport

### 3.1. Infinite / Expanding Canvas
- The canvas has **no fixed boundary**. As tiles are painted or placed, the visible grid expands automatically to include a configurable padding margin (`paddingSize`, default 2 tiles) around all painted content.
- The view auto-centres on the bounding box of all drawn objects whenever content changes.
- **Zoom**: The isometric scale factor (`S`, tile half-width in pixels) is calculated automatically to fit the content, and can also be adjusted manually via ±/reset zoom buttons.

### 3.2. Layer Stack (Canvas Layers)
Four stacked `<canvas>` elements render independently, each at a fixed z-index:

| z-index | Canvas | Purpose |
|---|---|---|
| 1 | `c-grid` | Isometric grid, labels, hover highlight |
| 2 | `c-cube` | Tile/cube geometry and materials |
| 3 | `c-col` | Collider overlays |
| 4 | `c-hit` | Invisible hit-test canvas receiving all mouse events |

### 3.3. Status Bar & HUD
- A **status bar** at the bottom shows contextual messages (e.g., current tool, vertex snap instructions, zoom %).
- A small **grid info overlay** on `c-grid` shows `ACTIVE_Z`, `CAM_ROT`, `SCALE`, and grid bounds.

### 3.4. Zoom Controls (Floating Menu)
A floating panel (top-left of viewport) provides:
- **Zoom In** — increases `S` by 15%
- **Zoom Out** — decreases `S` by 15%
- **Reset View** — resets manual zoom modifier to 1.0 and re-centres

---

## 4. Tiles (Objects)

**Tiles** are the fundamental building blocks placed within a scene. A tile is defined by its **(col, row, z)** grid position and a **materialId**.

### 4.1. Tile Shapes
Every tile is one of several predefined geometric shapes. Each shape has its own isometric draw routine and its own collider geometry:

| Shape | Description |
|---|---|
| **Cube** | Standard isometric cube (3 visible faces: top, left-front, right-front) |
| **Ramp** | Sloped surface tile |
| **Arch** | Archway shape |
| **Wall** | Flat vertical panel |
| **Corner Wall** | 90° corner wall section |
| **Curved Outer Corner** | Convex curved wall |
| **Curved Inner Corner** | Concave curved wall |
| **Pillar** | Vertical column |
| *(more shapes TBD)* | |

### 4.2. Tile Placement
Tiles can be placed by either:
- **Object Mode**: clicking an "Add" button in the Objects panel, which places at a default position.
- **Paint Mode**: clicking directly on the isometric grid canvas with a material selected. Clicking a cell with the same material **toggles** (removes) it; clicking with a different material replaces it.

### 4.3. Hover Preview
While hovering over the grid in paint mode, a **ghost tile** at 35% opacity is rendered at the cursor position to preview the tile before placement.

### 4.4. Eraser
A dedicated **Eraser** tool removes tiles from the cube layer at the current z-level.

### 4.5. Layers & Z-Index

#### Named Layers
- Tiles are grouped into user-named **Layers**.
- Each layer's visibility can be toggled.
- Layer-wide operations (e.g., apply material to all tiles in a layer) are supported.

#### Z-Level (Height)
- A global **Active Z** level controls which height plane is currently being painted.
- Z can be incremented or decremented via toolbar buttons (+ / −). Current value is displayed in the toolbar.
- All tiles placed while a given Z is active are stored at that Z coordinate: `cubes[col,row,z] = materialId`.
- The isometric projection offsets the tile vertically: `y_screen = OY + (col + row) * 0.5 * S − z * S`.
- Tiles at higher Z levels are rendered on top and appear visually elevated.

---

## 5. Materials & Textures

### 5.1. Dual-Entry Point
Materials can be accessed from two directions:
- **From the Materials panel**: create a material, then apply it to tiles.
- **From Paint Mode**: select a material from the material dock, then paint — the material is applied as you draw.

### 5.2. Material Types
Each material has a `type` that governs how it is rendered:

| Type | Description |
|---|---|
| `split` | Two-tone isometric cube: a split-colour gradient divides top from bottom at a configurable `split %` |
| `solid` | Single flat colour across all faces |
| `water` | Semi-transparent water tile with a water-tint overlay |
| `river` | Terrain tile with a ground colour, a river/path channel, configurable start/end XY, width, and bank colour |

### 5.3. Material Properties (common to all types)
- **Name** — user-defined label
- **Opacity / Alpha** — 10–100%
- **Color A** — primary colour (top half for `split`, ground for `river`)
- **Color B** — secondary colour (bottom half for `split`)
- **Dither Pattern** — `none` / `dither-50` / `dither-25` / `stripes` — applied as a post-fill pixel pattern

### 5.4. Split-Specific Properties
- **Split Z %** — position of the colour boundary as a fraction of tile height (0–100)

### 5.5. River/Terrain-Specific Properties
- **Material Mode** — `Split Color` / `Solid Color` / `Water` — controls the ground fill style
- **Ground Color** — base ground fill
- **Path/Channel Color** — the river or road stripe
- **Bank Color** — edge / bank strip colour
- **Channel Width %** — 5–90%
- **Start X / Start Y / End X / End Y** — direction of the river channel across the tile (−100 to +100)
- **Dither Top / Dither Bottom** — independent dither overlays for each face region

### 5.6. Material Groups (Dock Organisation)
Materials are organised into collapsible **type sections** in the material dock. Each section can be expanded/collapsed. Within each section, materials appear as a **3×N thumbnail grid** showing an isometric preview of the tile.

- New materials can be created by typing a name in the "add" bar at the bottom of each section. The new material is cloned from the section's default, with a random palette colour applied.
- Material properties update **live**: changing a colour or slider immediately redraws all tiles on the canvas that use that material.

### 5.7. Texture Builder (Procedural)
The application includes a **Texture Builder** that creates dithered, patterned surface textures:
- Top/Bottom face dither settings: mode, ink type (bright / colour), brightness, ink colour, spacing, thickness, blend
- A `<canvas>` preview updates in real time
- Textures are saved to a parent material

### 5.8. Texture Assignment *(TODO)*
- Assign different textures to different faces of a tile (top, left, right).
- Random-select from a set of textures per tile placement.

### 5.9. Automatic Texture Rules *(TODO)*
A rules engine will apply textures contextually (e.g., edge tiles get a moss texture automatically).

### 5.10. Hand Painting *(TODO)*
Direct per-tile texture painting.

---

## 6. Colliders

Colliders define physics/interaction boundaries. They are rendered on a **dedicated canvas layer** (above the tile layer) with a distinct visual style, and stored in a separate `colliders[]` array.

### 6.1. Visual Style
| Property | Value |
|---|---|
| Stroke colour | `rgba(78, 255, 145, 0.9)` — bright neon green |
| Fill colour | `rgba(78, 255, 145, 0.07)` — very subtle green tint |
| Corner dot | solid `#4eff91` dot at each vertex |
| Ghost (hover preview) | dashed stroke at 40% opacity, no dots |
| Line collider | solid `2.5px` stroke + dots at each endpoint |

These colours can be overridden in the application Settings > Scene panel.

### 6.2. Collider Types

| Tool | Shape | Description |
|---|---|---|
| **Top** | Flat rhombus | Top face of a tile — horizontal surface collider |
| **Left** | Vertical quad | Left-front face — wall/barrier on the left side |
| **Right** | Vertical quad | Right-front face — wall/barrier on the right side |
| **Back Left** | Vertical quad | Back-left face (accessible via camera rotation) |
| **Back Right** | Vertical quad | Back-right face |
| **Line** | Two-point edge | Click vertex → click vertex to draw a free-form edge collider. Shown with vertex snap dots. |

### 6.3. Collider Placement
- **Top / Left / Right**: click a tile to toggle the collider on that face. A ghost preview is shown on hover.
- **Line**: click first vertex (snaps to tile corners), then click second vertex to finalise. While drawing, a dashed ghost line follows the cursor.
- Colliders are stored at the z-level that was active when they were placed.
- Clicking an existing collider of the same type/face again **removes** it (toggle behaviour).

### 6.4. Collider Rotation Awareness
All collider faces are remapped correctly when the camera view is rotated, so `left` / `right` / `backLeft` / `backRight` remain geometrically consistent regardless of camera angle.

### 6.5. Layer Visibility
The collider layer can be hidden or shown independently of the cube layer via the **Layer Bar** tabs.

---

## 7. Layer Bar (Active Layer Switcher)

A tab bar sits between the toolbar and the canvas. It controls which layer is currently active for drawing.

| Tab | Colour Accent | Mode |
|---|---|---|
| **● Cube layer** | Teal `#3ecfb2` | Painting tiles with the selected material |
| **◎ Collider layer** | Green `#4eff91` | Painting colliders with the selected collider tool |

A **hint line** to the right of the tabs shows the current action in plain English (e.g., *"painting cubes (Default Split)"*, *"painting colliders"*).

---

## 8. Toolbar

A horizontal toolbar at the top of the app provides:

| Section | Controls |
|---|---|
| **Collider tools** | Top / Left / Right / Line buttons |
| **Erase** | Eraser tool (removes tiles at current Z) |
| **View** | CCW / CW rotation (90° steps) |
| **Level Z** | − / + buttons and current Z display |
| **Actions** | Clear All |

---

## 9. Material Dock (Sidebar)

A fixed-width right sidebar (`280px`) contains the material management UI:

- **Shape Class selector** at the top — selects the active tile *type category* (`Split` / `Solid` / `Water` / `River`) which controls which material group is shown and what shape is painted.
- **Material list** — collapsible sections, each containing a 3-column thumbnail grid of materials. Each thumbnail is a mini isometric cube rendered with that material's properties. Clicking a thumbnail selects that material as the active paint tool.
- **Add bar** per section — text field + `+` button to create a new material in that category.
- **Material Properties panel** at the bottom — shows live-editable sliders, colour pickers, and selects for the currently selected material. All changes redraw the canvas in real time.

---

## 10. Named Layers (Organisation)

Named layers group tiles for organisational and export purposes:

- **Create / rename** layers from the Layers panel.
- **Visibility toggle** per layer.
- **Layer-wide material apply** — apply a material to all tiles in a layer at once.
- **Current layer selector** — all new tiles are added to the active layer.

---

## 11. Settings

### 11.1. General
- Show/hide grid
- Show/hide axes helper
- Auto-save (every 5 minutes)
- Clear all saved browser data

### 11.2. Scene
- **Background color** — solid fill
- **Themes** — preset colour/lighting schemes (Default, Sunset, Night, Dawn, Overcast)
- **Background image** — set from URL
- **Brightness** — global scene brightness multiplier
- **Fog** — colour, near, far distances
- **Terrain height** — default height for new terrain tiles
- **Collider outline colour** — override the default green stroke
- **Collider fill colour** — override the default green tint

### 11.3. Export
- **Export as .OBJ** — scene geometry + materials
- **Export as .STL** — for 3D printing
- **Export for Unity** — Unity-compatible package
- **Include colliders** — toggle whether collider meshes appear in exports
- **Collider type** — Box or Mesh

### 11.4. Camera
- View current camera coordinates
- Reset / rotate CW / CCW

---

## 12. UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Toolbar (collider tools | erase | view | level-Z | clear)  │
├──────────────────────────────────────┬──────────────────────┤
│  Layer bar (● Cube  ◎ Collider  hint)│                      │
├──────────────────────────────────────┤   Material Dock      │
│                                      │                      │
│         Viewport (canvas stack)      │  [Shape Class]       │
│                                      │  [Mat sections]      │
│   c-grid (1) ← grid + labels        │  [Thumbnails]        │
│   c-cube (2) ← tiles/geometry       │  [+ Add bar]         │
│   c-col  (3) ← collider overlays    │  ──────────────────  │
│   c-hit  (4) ← mouse events         │  [Mat Properties]    │
│                                      │                      │
│   [Zoom floating panel top-left]     │                      │
├──────────────────────────────────────┴──────────────────────┤
│  Status bar                                                  │
└─────────────────────────────────────────────────────────────┘
```

### 12.1. Sidebar Panels (secondary panel set)
- **Objects Panel** — Add shape buttons (Cube, Ramp, Arch, Wall, Corner Wall, Curved corners, Pillar, Collider shapes)
- **Materials Panel** — Create/manage materials; link to texture builder
- **Textures Panel** — Upload and manage image-based textures
- **Properties Panel** — Edit scale, rotation, material of selected tile(s)
- **Layers Panel** — Manage named layers
- **Camera Panel** — Camera controls

### 12.2. Floating Panels
- **Floating Camera Panel** — quick camera controls + position display
- **Floating Movement Panel** — select + fine-move objects

---

## 13. Data Model

### Tile Store
```js
cubes["col,row,z"] = materialId   // e.g. cubes["3,2,1"] = "cube-solid-custom-123"
```

### Collider Store
```js
colliders = [
  { type: "top",  col, row, z },          // face collider
  { type: "left", col, row, z },
  { type: "right", col, row, z },
  { type: "backLeft", col, row, z },
  { type: "backRight", col, row, z },
  { type: "line", x1, y1, x2, y2, z }    // free edge
]
```

### Material Store
```js
MATERIAL_GROUPS = {
  "cube":       { title: "Split Cubes",   items: { materialId: { name, type, alpha, colA, colB, split, dither } } },
  "cube-solid": { title: "Solid Cubes",   items: { … } },
  "cube-water": { title: "Water Cubes",   items: { … } },
  "cube-river": { title: "Terrain Tiles", items: { … } }
}
```

---

## 14. Rendering Pipeline

1. **Grid** (`drawGrid`) — clear `c-grid`, draw all tiles in `[minGridX..maxGridX] × [minGridY..maxGridY]` at `activeZ`, highlight hover tile.
2. **Cubes** (`drawCubes`) — clear `c-cube`, sort tiles by `(vc + vr)` then `vz` for correct painter's algorithm order, draw each tile using its material type's draw routine (`renderCube` → `drawFace` / `drawRiverTile`).
3. **Colliders** (`drawColliders`) — clear `c-col`, remap colliders for camera rotation, draw each with its visual style; draw hover ghost.
4. **Recalculate** (`recalculateGridBounds`) — called on any data change; recomputes `minGridX/Y`, `maxGridX/Y`, `S`, `OX`, `OY`, then triggers all three draw passes.

### Isometric Projection
```js
function iso(col, row, z) {
  return [
    OX + (col - row) * S,
    OY + (col + row) * 0.5 * S - z * S
  ];
}
```

### Face Lighting
| Face | Light multiplier |
|---|---|
| Top | 1.12 (brightest) |
| Right-front | 0.88 |
| Left-front | 0.70 (darkest) |

---

## 15. Keyboard & Mouse Interactions

| Input | Action |
|---|---|
| Click grid (cube tool) | Toggle tile at `(col, row, activeZ)` |
| Click grid (eraser) | Remove tile at `(col, row, activeZ)` |
| Click grid (col-top/left/right) | Toggle face collider |
| Click vertex (col-line) | Start/end line collider |
| Mouse move | Update hover preview; redraw |
| Mouse leave | Clear hover; redraw |
| Scroll wheel *(TODO)* | Zoom in/out |

---

*This document is the single source of truth and supersedes all prior versions. It is updated as features are implemented or revised.*