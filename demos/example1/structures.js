/**
 * structures.js
 *
 * Multi-face isometric structures (roofs, walls, doors, steps, wells, props…)
 * built from the Town tile set in config.js and drawn with textures.js.
 *
 * Coordinate system (matches two-d-view.js / the ramp prototype):
 *   screen x = (x - y) * S      screen y = (x + y) * 0.5 * S - z * S
 *   Visible faces point toward +x ("right"), +y ("left") and +z ("top").
 *   Every structure fits inside one 1×1 cell, 0 → 1 on x and y.
 *
 * Each structure is { id, name, group, build() } where build() returns a list
 * of primitives (box / cyl / face / line). Use rot (0-3) and mirror (swap x/y)
 * at draw time to get every orientation from one definition.
 */
import { faceTexture } from './textures.js';
import { DEFAULT_TILES } from './config.js';

/* ───────────────────────── math helpers ───────────────────────── */

const VIEW = [1, 1, 1];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const proj = ([x, y, z], S, ox, oy) => [ox + (x - y) * S, oy + (x + y) * 0.5 * S - z * S];
const projVec = ([x, y, z], S) => [(x - y) * S, (x + y) * 0.5 * S - z * S];

export function tileIndex(tiles = DEFAULT_TILES) {
  const map = {};
  tiles.forEach(t => { map[t.id] = t; });
  return map;
}

/* ───────────────────────── primitive builders ───────────────────────── */

// Axis-aligned box. tile = side tile id, tT = top tile id, refTop = z that the
// side texture's first row is anchored to (keeps plaster/stone bands aligned
// across wall pieces of different heights).
const box = (x0, y0, z0, x1, y1, z1, tile, o = {}) => ({ k: 'box', x0, y0, z0, x1, y1, z1, tile, layer: 0, ...o });
const cyl = (cx, cy, z0, z1, r, tile, o = {}) => ({ k: 'cyl', cx, cy, z0, z1, r, tile, layer: 0, ...o });
// Parallelogram face: o + a*u + b*v. u runs across, v runs DOWN the texture.
const quad = (o, u, v, tile, role, n, x = {}) => ({
  k: 'face', o, u, v, poly: [o, add(o, u), add(add(o, u), v), add(o, v)], tile, role, n, layer: 0, ...x,
});
// Triangle clipped out of the parallelogram o,u,v.
const tri = (poly, o, u, v, tile, role, n, x = {}) => ({ k: 'face', o, u, v, poly, tile, role, n, layer: 0, ...x });
const line = (pts, n, color = '#49342d', w = 2) => ({ k: 'line', pts, n, color, w, layer: 2 });

/* ───────────────────────── transforms ───────────────────────── */

function tp(p, { mirror, rot }) {
  let [x, y, z] = p;
  if (mirror) [x, y] = [y, x];
  for (let i = 0; i < (rot | 0); i++) [x, y] = [1 - y, x];
  return [x, y, z];
}
function tv(v, { mirror, rot }) {
  let [x, y, z] = v;
  if (mirror) [x, y] = [y, x];
  for (let i = 0; i < (rot | 0); i++) [x, y] = [-y, x];
  return [x, y, z];
}
function transformPrim(p, o) {
  if (!o.mirror && !o.rot) return p;
  if (p.k === 'box') {
    const a = tp([p.x0, p.y0, p.z0], o), b = tp([p.x1, p.y1, p.z1], o);
    return { ...p, x0: Math.min(a[0], b[0]), x1: Math.max(a[0], b[0]), y0: Math.min(a[1], b[1]), y1: Math.max(a[1], b[1]) };
  }
  if (p.k === 'cyl') {
    const c = tp([p.cx, p.cy, 0], o);
    return { ...p, cx: c[0], cy: c[1] };
  }
  if (p.k === 'face') {
    return { ...p, o: tp(p.o, o), u: tv(p.u, o), v: tv(p.v, o), poly: p.poly.map(q => tp(q, o)), n: p.n && tv(p.n, o) };
  }
  return { ...p, pts: p.pts.map(q => tp(q, o)), n: p.n && tv(p.n, o) };
}
const mirrorList = list => list.map(p => transformPrim(p, { mirror: true, rot: 0 }));

function lift(list, dz) {
  const L = p => [p[0], p[1], p[2] + dz];
  return list.map(p => {
    if (p.k === 'box') return { ...p, z0: p.z0 + dz, z1: p.z1 + dz, refTop: (p.refTop ?? p.z1) + dz };
    if (p.k === 'cyl') return { ...p, z0: p.z0 + dz, z1: p.z1 + dz };
    if (p.k === 'face') return { ...p, o: L(p.o), poly: p.poly.map(L) };
    return { ...p, pts: p.pts.map(L) };
  });
}

/* ───────────────────────── composite builders ───────────────────────── */

// Open-topped hollow block (wells, keeps, pillars, planters).
function hollow({ h, rim, tile, floorZ, floorTop, x0 = 0, y0 = 0, x1 = 1, y1 = 1, floorTile }) {
  return [
    box(x0 + rim, y0 + rim, 0, x1 - rim, y1 - rim, floorZ, floorTile || tile, { tT: floorTop }),
    box(x0, y0, 0, x0 + rim, y1, h, tile, { tT: tile }),                         // back (low x)
    box(x0 + rim, y0, 0, x1, y0 + rim, h, tile, { tT: tile }),                   // back (low y)
    box(x1 - rim, y0 + rim, 0, x1, y1, h, tile, { tT: tile }),                   // front (high x)
    box(x0 + rim, y1 - rim, 0, x1 - rim, y1, h, tile, { tT: tile }),             // front (high y)
  ];
}

const WT = 0.2, WH = 0.9, RAIL = 0.1, DH = 0.62;

// Wall running along y at the low-x edge (visible face points +x).
// kind: plain | door | doorOpen | doorway | window
function wallY(kind = 'plain', y0 = 0, y1 = 1) {
  const L = y1 - y0, T = 'plaster-stone-wall', TR = 'timber-trim', top = WH - RAIL;
  const body = (a, b, za, zb) => box(0, a, za, WT, b, zb, T, { tT: TR, refTop: WH });
  const P = [];
  if (kind === 'plain') {
    P.push(body(y0, y1, 0, top));
  } else {
    const win = kind === 'window';
    const ya = y0 + (win ? 0.3 : 0.32) * L, yb = y0 + (win ? 0.7 : 0.68) * L;
    const sill = win ? 0.4 : 0, head = win ? 0.78 : DH;
    P.push(body(y0, ya, 0, top), body(yb, y1, 0, top), body(ya, yb, head, top));
    if (win) {
      P.push(body(ya, yb, 0, sill));
      P.push(quad([0.06, ya, head], [0, yb - ya, 0], [0, 0, -(head - sill)], 'lattice-window', 'right', [1, 0, 0], { layer: -1 }));
      P.push(box(-0.02, ya - 0.035, sill - 0.03, WT + 0.02, yb + 0.035, sill, TR, { tT: TR }));
    } else {
      P.push(quad([0.05, ya, DH], [0, yb - ya, 0], [0, 0, -DH], 'doorway-dark', 'right', [1, 0, 0], { layer: -1 }));
      if (kind === 'door') P.push(box(0.04, ya, 0, 0.11, yb, DH - 0.02, 'door-wood', { tT: 'door-wood' }));
      if (kind === 'doorOpen') P.push(box(WT, ya, 0, WT + 0.34, ya + 0.05, DH - 0.02, 'door-wood', { tT: 'door-wood' }));
    }
    P.push(box(-0.015, ya - 0.035, sill, WT + 0.015, ya, head, TR, { tT: TR }));
    P.push(box(-0.015, yb, sill, WT + 0.015, yb + 0.035, head, TR, { tT: TR }));
  }
  P.push(box(-0.02, y0, top, WT + 0.02, y1, WH, TR, { tT: TR }));               // top rail
  return P;
}

// L-shaped corner: one wall along y, one along x (made by mirroring).
const corner = (kind = 'plain', otherKind = 'plain') => [...wallY(kind, 0, 1), ...mirrorList(wallY(otherKind, WT, 1))];

function gableRoof(tile = 'roof-shingle-red', h = 0.45) {
  const ym = 0.5;
  return [
    quad([0, ym, h], [1, 0, 0], [0, -ym, -h], tile, 'top', [0, -h, ym], { shadeA: 0.14 }),   // −y slope
    quad([0, ym, h], [1, 0, 0], [0, ym, -h], tile, 'top', [0, h, ym]),                       // +y slope
    tri([[1, 0, 0], [1, 1, 0], [1, ym, h]], [1, 0, h], [0, 1, 0], [0, 0, -h], 'gable-plaster', 'right', [1, 0, 0]),
    tri([[0, 0, 0], [0, 1, 0], [0, ym, h]], [0, 0, h], [0, 1, 0], [0, 0, -h], 'gable-plaster', 'right', [-1, 0, 0]),
    line([[1, 0, 0], [1, ym, h], [1, 1, 0]], [1, 0, 0]),
    line([[0, 0, 0], [0, ym, h], [0, 1, 0]], [-1, 0, 0]),
  ];
}

function pyramidRoof(tile = 'roof-shingle-red', h = 0.75) {
  const a = [0.5, 0.5, h];
  return [
    quad([0, 0.5, h], [1, 0, 0], [0, 0.5, -h], tile, 'top', [0, h, 0.5]),
    quad([0.5, 0, h], [0, 1, 0], [0.5, 0, -h], tile, 'top', [h, 0, 0.5], { shadeA: 0.16 }),
    quad([0, 0.5, h], [1, 0, 0], [0, -0.5, -h], tile, 'top', [0, -h, 0.5], { shadeA: 0.1 }),
    quad([0.5, 0, h], [0, 1, 0], [-0.5, 0, -h], tile, 'top', [-h, 0, 0.5], { shadeA: 0.1 }),
  ].map((f, i) => {
    const polys = [
      [[0, 1, 0], [1, 1, 0], a], [[1, 0, 0], [1, 1, 0], a], [[0, 0, 0], [1, 0, 0], a], [[0, 0, 0], [0, 1, 0], a],
    ];
    return { ...f, poly: polys[i] };
  });
}

/* ───────────────────────── structure library ───────────────────────── */

const slab = (tile, z = 0.06) => [box(0, 0, 0, 1, 1, z, tile, { tT: tile })];

export const STRUCTURE_GROUPS = [
  { id: 'blocks', name: 'Blocks' },
  { id: 'floors', name: 'Floors' },
  { id: 'stonework', name: 'Stonework' },
  { id: 'roofs', name: 'Roofs' },
  { id: 'walls', name: 'Walls, Doors & Windows' },
  { id: 'rooms', name: 'Corners & Rooms' },
  { id: 'props', name: 'Props' },
];

export const STRUCTURES = [
  // Blocks
  { id: 'block-moss', name: 'Mossy Stone Block', group: 'blocks', build: () => [box(0, 0, 0, 1, 1, 1, 'moss-block', { tT: 'moss-block' })] },
  { id: 'block-light', name: 'Light Stone Block', group: 'blocks', build: () => [box(0, 0, 0, 1, 1, 1, 'moss-block-light', { tT: 'moss-block-light' })] },
  { id: 'block-hollow', name: 'Hollow Stone Block', group: 'blocks',
    build: () => hollow({ h: 1, rim: 0.2, tile: 'moss-block', floorZ: 0.4, floorTop: 'doorway-dark' }) },

  // Floors
  { id: 'floor-flagstone', name: 'Flagstone Floor', group: 'floors', build: () => slab('mossy-flagstone') },
  { id: 'floor-plank', name: 'Plank Floor', group: 'floors', build: () => slab('plank-floor') },
  { id: 'floor-plank-worn', name: 'Worn Plank Floor', group: 'floors', build: () => slab('plank-floor-worn') },

  // Stonework
  { id: 'well', name: 'Well', group: 'stonework',
    build: () => hollow({ h: 0.55, rim: 0.2, tile: 'stone-well', floorZ: 0.36, floorTop: 'courtyard-water', floorTile: 'stone-well' }) },
  { id: 'keep-doorway', name: 'Stone Keep (doorway)', group: 'stonework',
    build: () => [
      ...hollow({ h: 1, rim: 0.22, tile: 'moss-block', floorZ: 0.45, floorTop: 'doorway-dark' }),
      quad([1.003, 0.3, 0.62], [0, 0.4, 0], [0, 0, -0.62], 'doorway-dark', 'right', [1, 0, 0], { layer: 1 }),
      quad([1.004, 0.26, 0.68], [0, 0.48, 0], [0, 0, -0.07], 'timber-trim', 'right', [1, 0, 0], { layer: 1 }),
      quad([1.004, 0.26, 0.62], [0, 0.04, 0], [0, 0, -0.62], 'timber-trim', 'right', [1, 0, 0], { layer: 1 }),
      quad([1.004, 0.7, 0.62], [0, 0.04, 0], [0, 0, -0.62], 'timber-trim', 'right', [1, 0, 0], { layer: 1 }),
    ] },
  { id: 'keep-door', name: 'Stone Keep (wooden door)', group: 'stonework',
    build: () => [
      ...hollow({ h: 1, rim: 0.22, tile: 'moss-block', floorZ: 0.45, floorTop: 'doorway-dark' }),
      quad([1.003, 0.3, 0.62], [0, 0.4, 0], [0, 0, -0.62], 'door-wood', 'right', [1, 0, 0], { layer: 1 }),
      quad([1.004, 0.26, 0.68], [0, 0.48, 0], [0, 0, -0.07], 'timber-trim', 'right', [1, 0, 0], { layer: 1 }),
      quad([1.004, 0.26, 0.62], [0, 0.04, 0], [0, 0, -0.62], 'timber-trim', 'right', [1, 0, 0], { layer: 1 }),
      quad([1.004, 0.7, 0.62], [0, 0.04, 0], [0, 0, -0.62], 'timber-trim', 'right', [1, 0, 0], { layer: 1 }),
    ] },
  { id: 'pillar-short', name: 'Short Pillar', group: 'stonework',
    build: () => hollow({ h: 0.45, rim: 0.09, tile: 'stone-pillar', floorZ: 0.25, floorTop: 'doorway-dark', x0: 0.3, y0: 0.3, x1: 0.7, y1: 0.7 }) },
  { id: 'pillar-tall', name: 'Tall Pillar', group: 'stonework',
    build: () => hollow({ h: 0.9, rim: 0.09, tile: 'stone-pillar', floorZ: 0.7, floorTop: 'doorway-dark', x0: 0.3, y0: 0.3, x1: 0.7, y1: 0.7 }) },
  { id: 'steps', name: 'Stone Steps', group: 'stonework',
    build: () => [0, 1, 2].map(i => box(0, 0, i / 3, (3 - i) / 3, 1, (i + 1) / 3, 'stone-steps-town', { tT: 'stone-steps-town' })) },

  // Roofs
  { id: 'roof-gable', name: 'Gable Roof (red)', group: 'roofs', build: () => gableRoof('roof-shingle-red') },
  { id: 'roof-gable-plum', name: 'Gable Roof (plum)', group: 'roofs', build: () => gableRoof('roof-shingle-plum') },
  { id: 'roof-pyramid', name: 'Pyramid Roof (red)', group: 'roofs', build: () => pyramidRoof('roof-shingle-red') },
  { id: 'roof-pyramid-plum', name: 'Pyramid Roof (plum)', group: 'roofs', build: () => pyramidRoof('roof-shingle-plum') },
  { id: 'gable-end', name: 'Gable End', group: 'roofs',
    build: () => [
      box(0.5, 0, 0, 0.6, 1, 0.05, 'timber-trim', { tT: 'timber-trim' }),
      tri([[0.6, 0, 0.05], [0.6, 1, 0.05], [0.6, 0.5, 0.5]], [0.6, 0, 0.5], [0, 1, 0], [0, 0, -0.45], 'gable-plaster', 'right', [1, 0, 0], { layer: 1 }),
      line([[0.6, 0, 0.05], [0.6, 0.5, 0.5], [0.6, 1, 0.05]], [1, 0, 0], '#64453a', 3),
    ] },
  { id: 'ridge', name: 'Roof Ridge', group: 'roofs', build: () => [box(0, 0.42, 0, 1, 0.58, 0.1, 'roof-ridge', { tT: 'roof-ridge' })] },
  { id: 'ridge-corner', name: 'Roof Ridge Corner', group: 'roofs',
    build: () => [box(0.42, 0.42, 0, 1, 0.58, 0.1, 'roof-ridge', { tT: 'roof-ridge' }), box(0.42, 0.58, 0, 0.58, 1, 0.1, 'roof-ridge', { tT: 'roof-ridge' })] },
  { id: 'roof-cap', name: 'Roof Cap', group: 'roofs',
    build: () => [...slab('roof-ridge'), quad([0.2, 0.2, 0.065], [0.6, 0, 0], [0, 0.6, 0], 'gable-plaster', 'top', [0, 0, 1], { layer: 1 })] },

  // Walls
  { id: 'wall-plain', name: 'Plaster Wall', group: 'walls', build: () => wallY('plain') },
  { id: 'wall-door', name: 'Wall with Door', group: 'walls', build: () => wallY('door') },
  { id: 'wall-door-open', name: 'Wall with Open Door', group: 'walls', build: () => wallY('doorOpen') },
  { id: 'wall-doorway', name: 'Wall with Doorway', group: 'walls', build: () => wallY('doorway') },
  { id: 'wall-window', name: 'Wall with Lattice Window', group: 'walls', build: () => wallY('window') },

  // Corners & rooms
  { id: 'corner-plain', name: 'Plaster Corner', group: 'rooms', build: () => corner('plain') },
  { id: 'corner-door', name: 'Corner with Door', group: 'rooms', build: () => corner('door') },
  { id: 'corner-door-open', name: 'Corner with Open Door', group: 'rooms', build: () => corner('doorOpen', 'window') },
  { id: 'corner-window', name: 'Corner with Window', group: 'rooms', build: () => corner('window') },
  { id: 'room-plank-corner', name: 'Room Corner (plank)', group: 'rooms',
    build: () => [...slab('plank-floor'), ...lift(corner('plain'), 0.06)] },
  { id: 'room-plank-door', name: 'Room Corner (door)', group: 'rooms',
    build: () => [...slab('plank-floor'), ...lift(corner('doorway', 'window'), 0.06)] },

  // Props
  { id: 'table', name: 'Wood Table', group: 'props',
    build: () => [
      box(0.1, 0.2, 0.5, 0.9, 0.8, 0.57, 'table-wood', { tT: 'table-wood' }),
      ...[[0.14, 0.24], [0.8, 0.24], [0.14, 0.7], [0.8, 0.7]].map(([x, y]) => box(x, y, 0, x + 0.06, y + 0.06, 0.5, 'table-wood', { tT: 'table-wood' })),
    ] },
  { id: 'stool', name: 'Wood Stool', group: 'props',
    build: () => [
      cyl(0.5, 0.5, 0.26, 0.32, 0.2, 'stool-wood', { tT: 'stool-wood' }),
      ...[[0.36, 0.42], [0.6, 0.34], [0.52, 0.62]].map(([x, y]) => box(x, y, 0, x + 0.06, y + 0.06, 0.26, 'stool-wood', { tT: 'stool-wood' })),
    ] },
  { id: 'planter', name: 'Planter', group: 'props',
    build: () => hollow({ h: 0.45, rim: 0.12, tile: 'stone-well', floorZ: 0.34, floorTop: 'planter-soil', floorTile: 'stone-well' }) },
];

export const getStructure = id => STRUCTURES.find(s => s.id === id);

/* ───────────────────────── 90° variants ───────────────────────── */

// Pieces that look identical when turned a quarter-turn get no separate variant.
const ROT_SYMMETRIC = new Set([
  'block-moss', 'block-light', 'block-hollow', 'floor-flagstone', 'floor-plank', 'floor-plank-worn',
  'well', 'pillar-short', 'pillar-tall', 'roof-pyramid', 'roof-pyramid-plum', 'roof-cap', 'stool', 'planter',
]);

/** A copy of a structure turned `turns` × 90° (new id "<id>-r90", name "<name> (90°)"). */
export function rotatedVariant(structure, turns = 1) {
  const t = ((turns % 4) + 4) % 4;
  return {
    ...structure,
    id: `${structure.id}-r${t * 90}`,
    name: `${structure.name} (${t * 90}°)`,
    build: () => structure.build().map(p => transformPrim(p, { rot: t, mirror: false })),
  };
}

/** The 90° versions only. */
export const STRUCTURES_ROT90 = STRUCTURES.filter(s => !ROT_SYMMETRIC.has(s.id)).map(s => rotatedVariant(s, 1));

/** Library with each structure followed by its 90° version (symmetric pieces appear once). */
export const STRUCTURES_WITH_90 = STRUCTURES.flatMap(s => (ROT_SYMMETRIC.has(s.id) ? [s] : [s, rotatedVariant(s, 1)]));


/* ───────────────────────── rendering ───────────────────────── */

function spans(len, off) {
  const out = [];
  let a = 0;
  while (a < len - 1e-6) {
    const ph = (((a + off) % 1) + 1) % 1;
    const seg = Math.min(1 - ph, len - a);
    if (seg > 1e-4) out.push([a, ph, seg]);
    a += Math.max(seg, 1e-4);
  }
  return out;
}

const keyOf = p => {
  if (p.k === 'box') return (p.x0 + p.x1 + p.y0 + p.y1 + p.z0 + p.z1) / 2;
  if (p.k === 'cyl') return p.cx + p.cy + (p.z0 + p.z1) / 2;
  const pts = p.poly || p.pts;
  let s = 0;
  pts.forEach(q => { s += q[0] + q[1] + q[2]; });
  return s / pts.length;
};

function* boxFaces(b) {
  const refTop = b.refTop ?? b.z1;
  const h = b.z1 - b.z0;
  yield { k: 'face', role: 'top', tile: b.tT || b.tile, o: [b.x0, b.y0, b.z1], u: [b.x1 - b.x0, 0, 0], v: [0, b.y1 - b.y0, 0],
    poly: [[b.x0, b.y0, b.z1], [b.x1, b.y0, b.z1], [b.x1, b.y1, b.z1], [b.x0, b.y1, b.z1]] };
  yield { k: 'face', role: 'right', tile: b.tile, o: [b.x1, b.y0, b.z1], u: [0, b.y1 - b.y0, 0], v: [0, 0, -h], v0: refTop - b.z1,
    poly: [[b.x1, b.y0, b.z1], [b.x1, b.y1, b.z1], [b.x1, b.y1, b.z0], [b.x1, b.y0, b.z0]] };
  yield { k: 'face', role: 'left', tile: b.tile, o: [b.x0, b.y1, b.z1], u: [b.x1 - b.x0, 0, 0], v: [0, 0, -h], v0: refTop - b.z1,
    poly: [[b.x0, b.y1, b.z1], [b.x1, b.y1, b.z1], [b.x1, b.y1, b.z0], [b.x0, b.y1, b.z0]] };
}

function drawFace(g, f, T, S, ox, oy) {
  const tile = T(f.tile);
  const tex = faceTexture(tile, f.role);
  const size = tex.width;
  const lu = Math.hypot(...f.u), lv = Math.hypot(...f.v);
  if (lu < 1e-6 || lv < 1e-6) return;
  const uh = f.u.map(c => c / lu), vh = f.v.map(c => c / lv);
  const pu = projVec(uh, S), pv = projVec(vh, S);
  const pts = f.poly.map(p => proj(p, S, ox, oy));
  const path = () => { g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); };

  g.save();
  path(); g.clip();
  g.imageSmoothingEnabled = false;
  for (const [a, fu, su] of spans(lu, 0)) {
    for (const [b, fv, sv] of spans(lv, f.v0 || 0)) {
      const w = [f.o[0] + uh[0] * a + vh[0] * b, f.o[1] + uh[1] * a + vh[1] * b, f.o[2] + uh[2] * a + vh[2] * b];
      const p = proj(w, S, ox, oy);
      g.save();
      g.transform(pu[0] / size, pu[1] / size, pv[0] / size, pv[1] / size, p[0], p[1]);
      g.drawImage(tex, fu * size, fv * size, su * size, sv * size, 0, 0, su * size + 0.6, sv * size + 0.6);
      g.restore();
    }
  }
  if (f.shadeA) { path(); g.fillStyle = `rgba(0,0,0,${f.shadeA})`; g.fill(); }
  g.restore();

  g.save();
  path();
  g.strokeStyle = 'rgba(0,0,0,.38)';
  g.lineWidth = 1;
  g.stroke();
  g.restore();
}

function drawCyl(g, p, T, S, ox, oy) {
  const [cx, cy] = proj([p.cx, p.cy, 0], S, ox, oy);
  const rx = p.r * Math.SQRT2 * S, ry = (p.r * S) / Math.SQRT2;
  const yTop = cy - p.z1 * S, yBot = cy - p.z0 * S;
  const side = g.createPattern(faceTexture(T(p.tile), 'left'), 'repeat');
  const top = g.createPattern(faceTexture(T(p.tT || p.tile), 'top'), 'repeat');
  g.save();
  g.imageSmoothingEnabled = false;
  g.beginPath();
  g.moveTo(cx + rx, yTop); g.lineTo(cx + rx, yBot);
  g.ellipse(cx, yBot, rx, ry, 0, 0, Math.PI, false);
  g.lineTo(cx - rx, yTop); g.closePath();
  g.fillStyle = side; g.fill();
  g.strokeStyle = 'rgba(0,0,0,.38)'; g.lineWidth = 1; g.stroke();
  g.beginPath(); g.ellipse(cx, yTop, rx, ry, 0, 0, Math.PI * 2);
  g.fillStyle = top; g.fill(); g.stroke();
  g.restore();
}

export function resolvePrims(structure, { rot = 0, mirror = false } = {}) {
  return structure.build().map(p => transformPrim(p, { rot, mirror }));
}

function primPoints(p) {
  if (p.k === 'box') return [[p.x0, p.y0, p.z0], [p.x1, p.y1, p.z1], [p.x1, p.y0, p.z0], [p.x0, p.y1, p.z1]];
  if (p.k === 'cyl') return [[p.cx - p.r, p.cy - p.r, p.z0], [p.cx + p.r, p.cy + p.r, p.z1]];
  return p.poly || p.pts;
}

export function structureBounds(prims, S) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  prims.forEach(p => primPoints(p).forEach(q => {
    const [x, y] = proj(q, S, 0, 0);
    minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }));
  return { minX, maxX, minY, maxY };
}

/**
 * Draw one structure. (x, y) is where the centre of its 1×1 footprint lands
 * on screen, so a row of structures shares one ground line.
 */
export function drawStructure(g, structure, tiles, { x = 0, y = 0, S = 40, rot = 0, mirror = false, alpha = 1 } = {}) {
  const idx = tiles instanceof Array ? tileIndex(tiles) : tiles;
  const fallback = { id: '_missing', top: '#ff00ff', bottom: '#aa00aa', split: 50 };
  const T = id => idx[id] || fallback;
  const ox = x, oy = y - 0.5 * S;
  const prims = resolvePrims(structure, { rot, mirror });
  const items = [];
  prims.forEach(p => {
    if (p.k === 'box') for (const f of boxFaces(p)) items.push({ ...f, layer: p.layer, key: keyOf(p), _box: true });
    else items.push({ ...p, key: keyOf(p) });
  });
  // box faces keep their box's sort key so a box's three faces stay together
  items.sort((a, b) => (a.layer - b.layer) || (a.key - b.key));

  g.save();
  g.globalAlpha = alpha;
  items.forEach(it => {
    if (it.n && dot(it.n, VIEW) <= 1e-9) return;
    if (it.k === 'face') drawFace(g, it, T, S, ox, oy);
    else if (it.k === 'cyl') drawCyl(g, it, T, S, ox, oy);
    else if (it.k === 'line') {
      g.beginPath();
      it.pts.map(p => proj(p, S, ox, oy)).forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
      g.strokeStyle = it.color; g.lineWidth = it.w; g.lineJoin = 'round'; g.stroke();
    }
  });
  g.restore();
}

/** Contact sheet of structures (used by the demo page and for palette art). */
export function drawStructureSheet(g, structures, tiles, { S = 36, cols = 6, cellW = 130, cellH = 128, rot = 0, mirror = false, labels = true, bg = '#0d0d10' } = {}) {
  const rows = Math.ceil(structures.length / cols);
  g.fillStyle = bg;
  g.fillRect(0, 0, cols * cellW, rows * cellH);
  structures.forEach((s, i) => {
    const cx = (i % cols) * cellW + cellW / 2;
    const cy = Math.floor(i / cols) * cellH + cellH * 0.64;
    drawStructure(g, s, tiles, { x: cx, y: cy, S, rot, mirror });
    if (labels) {
      g.fillStyle = '#a0a0c0';
      g.font = '9px Inter, system-ui, sans-serif';
      g.textAlign = 'center';
      g.fillText(s.name, cx, Math.floor(i / cols) * cellH + cellH - 6);
    }
  });
  return { width: cols * cellW, height: rows * cellH };
}

const structurePreviewCache = new Map();
/** Small data-URL thumbnail for a structure palette button. */
export function structurePreviewURL(structure, tiles = DEFAULT_TILES, { rot = 0, mirror = false, w = 88, h = 72, S = 24 } = {}) {
  const key = `${structure.id}|${rot}|${mirror}|${w}x${h}|${S}`;
  if (structurePreviewCache.has(key)) return structurePreviewCache.get(key);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  drawStructure(c.getContext('2d'), structure, tiles, { x: w / 2, y: h * 0.7, S, rot, mirror });
  const url = c.toDataURL();
  structurePreviewCache.set(key, url);
  return url;
}
