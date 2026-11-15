import { dither } from '../scene-studio/config.js';

const t = (id, name, groupId, top, bottom, split, topDither, bottomDither) => ({
  id, name, groupId, top, bottom, split, topDither, bottomDither
});

const decal = (id, name, kind, ink, accent = '#ffffff') => ({
  id, name, groupId: 'details', decal: kind, ink, accent,
  top: '#2a2a2a', bottom: '#151515', split: 100,
  topDither: dither('solid'), bottomDither: dither('solid')
});


/* ── Jungle ───────────────────────────────────────────────── */
const JUNGLE = {
  id: 'jungle',
  brand: 'JUNGLE WORLD BUILDER',
  subtitle: 'isometric rainforest · rivers · temple ruins',
  name: 'Jungle',
  accent: '#58d68d',
  accentBg: '#123a2a',
  canvasTop: '#12241a',
  canvasBottom: '#070d09',
  terrain: {
    base: 'jungle-floor', low: 'jungle-mud', high: 'jungle-grass',
    rock: 'jungle-rock', peak: 'jungle-stone', water: 'jungle-water'
  },
  tree: { trunk: 'jungle-wood', leaf: 'jungle-leaf' },
  palette: [
    'jungle-floor', 'jungle-grass', 'jungle-mud', 'jungle-rock',
    'jungle-stone', 'jungle-water', 'jungle-thatch', 'jungle-leaf',
    'jungle-wood', 'dirt'
  ],
  extraTiles: [
    t('jungle-floor', 'Jungle Floor', 'terrain', '#4f7d3f', '#2c4a28', 55,
      dither('noise', 'bright', 58, 44, 30, 62), dither('crosshatch', 'dark', 46, 38, 26, 60, 'multiply')),
    t('jungle-grass', 'Jungle Grass', 'terrain', '#63a24f', '#315f2f', 58,
      dither('noise', 'bright', 62, 46, 28, 60), dither('lines', 'dark', 48, 34, 22, 58, 'multiply')),
    t('jungle-mud', 'Jungle Mud', 'terrain', '#6a5236', '#392b1c', 52,
      dither('paving', 'dark', 46, 38, 24, 64, 'multiply'), dither('noise', 'dark', 48, 46, 32, 62)),
    t('jungle-rock', 'Jungle Rock', 'terrain', '#788a68', '#3f4d36', 54,
      dither('stonework', 'dark', 46, 38, 20, 70, 'multiply'), dither('stonework', 'dark', 52, 38, 20, 66, 'multiply')),
    t('jungle-water', 'Jungle Water', 'terrain', '#3f9fa8', '#1f5c66', 62,
      dither('lines', 'bright', 56, 28, 22, 54), dither('solid', 'dark', 44, 45, 30, 55)),
    t('jungle-thatch', 'Jungle Thatch', 'details', '#b89a4a', '#6e5824', 52,
      dither('lines', 'dark', 50, 30, 26, 62, 'multiply'), dither('plank', 'dark', 46, 38, 22, 60, 'multiply')),
    t('jungle-leaf', 'Jungle Leaf', 'details', '#4f8a4a', '#244724', 58,
      dither('crosshatch', 'bright', 52, 34, 26, 62), dither('noise', 'dark', 46, 44, 30, 60, 'multiply'))
  ],
  recolor: {
    'mossy-flagstone': ['#7f9b6d', '#4a6440', 55],
    'plank-floor': ['#6f4e32', '#3f2c1d', 50],
    'plank-floor-worn': ['#5f422a', '#332418', 50],
    'courtyard-water': ['#3f9fa8', '#1f5c66', 62],
    'moss-block': ['#6f8f5f', '#3f5a36', 52],
    'moss-block-light': ['#8aa877', '#4f6a42', 52],
    'stone-steps-town': ['#7d8f6b', '#3f4d36', 48],
    'stone-pillar': ['#6f8f5f', '#3f5a36', 55],
    'stone-well': ['#7f9b6d', '#4a6440', 50],
    'plaster-stone-wall': ['#c9b36a', '#4a6440', 60],
    'timber-wall': ['#8a5a3a', '#4b2f20', 55],
    'timber-trim': ['#6f4630', '#3d271b', 58],
    'lattice-window': ['#6f4630', '#3d271b', 70],
    'door-wood': ['#5f3b25', '#3a2316', 50],
    'doorway-dark': ['#2e3b2a', '#1d261b', 50],
    'roof-shingle-red': ['#6f8a4a', '#3f5429', 50],
    'roof-shingle-plum': ['#8a7a3f', '#5a4a24', 50],
    'roof-ridge': ['#9a7d45', '#5f4a28', 48],
    'gable-plaster': ['#c9b36a', '#6f8a4a', 55],
    'table-wood': ['#6f4e32', '#3f2c1d', 40],
    'stool-wood': ['#5f422a', '#332418', 45],
    'planter-soil': ['#3a2c1d', '#241a10', 55],
    'sandstone': ['#7d8f6b', '#3f4d36', 55],
    'desert-roof': ['#6f8a4a', '#3f5429', 52]
  },
  details: [
    decal('flowers', 'Flowers', 'flowers', '#ffd35c', '#ff7aa8'),
    decal('grass-tufts', 'Grass Tufts', 'grass', '#6fbf5a'),
    decal('leaves', 'Fallen Leaves', 'leaves', '#3f7a34', '#7fbf5a'),
    decal('cracks', 'Cracks', 'cracks', '#4a351f'),
    decal('moss', 'Moss', 'moss', '#4f8a4a'),
    decal('puddle', 'Puddle', 'puddle', '#4fb3c4'),
    decal('pebbles', 'Pebbles', 'pebbles', '#9a9482')
  ],
  examples: [
    ['rainforest', 'Rainforest'], ['river', 'Jungle river'],
    ['ruins', 'Temple ruins'], ['highlands', 'Cloud forest'], ['empty', 'Empty']
  ]
};

/* ── Snow ─────────────────────────────────────────────────── */
const SNOW = {
  id: 'snow',
  brand: 'SNOW WORLD BUILDER',
  subtitle: 'isometric snowfield · frozen rivers · ice peaks',
  name: 'Snow',
  accent: '#9ed8f0',
  accentBg: '#16303a',
  canvasTop: '#172530',
  canvasBottom: '#080d12',
  terrain: {
    base: 'snow-field', low: 'snow-ice', high: 'snow-pack',
    rock: 'snow-rock', peak: 'snow-rock', water: 'snow-water'
  },
  tree: { trunk: 'snow-trunk', leaf: 'snow-pine' },
  palette: [
    'snow-field', 'snow-pack', 'snow-ice', 'snow-rock', 'snow-water',
    'ice-brick', 'snow-roof', 'snow-pine', 'snow-trunk', 'paving'
  ],
  extraTiles: [
    t('snow-field', 'Snow Field', 'terrain', '#f4fbff', '#c9dbe6', 62,
      dither('noise', 'bright', 66, 46, 28, 58), dither('noise', 'dark', 44, 46, 32, 58)),
    t('snow-ice', 'Blue Ice', 'terrain', '#cfeaf3', '#8fb9cc', 58,
      dither('crosshatch', 'bright', 60, 34, 26, 60), dither('weave', 'dark', 44, 34, 24, 60, 'multiply')),
    t('snow-water', 'Frozen Water', 'terrain', '#9fd8e8', '#5f91a8', 62,
      dither('lines', 'bright', 58, 28, 22, 55), dither('solid', 'dark', 42, 44, 30, 55)),
    t('snow-rock', 'Snow Rock', 'terrain', '#a8bcc9', '#5f7480', 52,
      dither('stonework', 'dark', 46, 38, 20, 68, 'multiply'), dither('stonework', 'dark', 52, 38, 20, 64, 'multiply')),
    t('snow-pine', 'Pine Needles', 'details', '#2f5d4a', '#1c3a2e', 58,
      dither('crosshatch', 'bright', 50, 34, 24, 60), dither('noise', 'dark', 46, 44, 30, 60, 'multiply')),
    t('snow-trunk', 'Frozen Pine Wood', 'details', '#5a4630', '#3a2c1e', 50,
      dither('lines', 'dark', 48, 30, 24, 62, 'multiply'), dither('plank', 'dark', 46, 38, 22, 60, 'multiply'))
  ],
  recolor: {
    'mossy-flagstone': ['#c9dbe6', '#8fa5b3', 55],
    'plank-floor': ['#6f5a48', '#44362a', 50],
    'plank-floor-worn': ['#5a4838', '#382c22', 50],
    'courtyard-water': ['#9fd8e8', '#5f91a8', 62],
    'moss-block': ['#b8c9d5', '#6f8592', 52],
    'moss-block-light': ['#d8e6ee', '#8fa5b3', 52],
    'stone-steps-town': ['#a8bcc9', '#5f7480', 48],
    'stone-pillar': ['#a8bcc9', '#5f7480', 55],
    'stone-well': ['#c9dbe6', '#8fa5b3', 50],
    'plaster-stone-wall': ['#e8eef2', '#8fa5b3', 60],
    'timber-wall': ['#6f5a48', '#44362a', 55],
    'timber-trim': ['#5a4636', '#382a20', 58],
    'lattice-window': ['#5a4636', '#382a20', 70],
    'door-wood': ['#4a3828', '#2c2118', 50],
    'doorway-dark': ['#2e3b44', '#1d262c', 50],
    'roof-shingle-red': ['#b8d4e2', '#6f8fa3', 50],
    'roof-shingle-plum': ['#9fb8c9', '#5f7480', 50],
    'roof-ridge': ['#d8e6ee', '#8fa5b3', 48],
    'gable-plaster': ['#e8eef2', '#c9dbe6', 55],
    'table-wood': ['#6f5a48', '#44362a', 40],
    'stool-wood': ['#5a4838', '#382c22', 45],
    'planter-soil': ['#3a2c1e', '#241a10', 55],
    'sandstone': ['#a8bcc9', '#5f7480', 55],
    'desert-roof': ['#b8d4e2', '#6f8fa3', 52],
    'grass': ['#e8f2f7', '#9fb6c4', 62],
    'dirt': ['#8a8f92', '#4a5155', 55]
  },
  details: [
    decal('snow-drift', 'Snow Drift', 'snowdrift', '#ffffff', '#d8eef8'),
    decal('ice-cracks', 'Ice Cracks', 'icecracks', '#8fd8f0'),
    decal('pebbles', 'Pebbles', 'pebbles', '#9aa7ae'),
    decal('frozen-grass', 'Frozen Grass', 'grass', '#9fb8a0'),
    decal('footprints', 'Footprints', 'footprints', '#7d99ad'),
    decal('frost', 'Frost', 'moss', '#e8f7ff', '#ffffff')
  ],
  examples: [
    ['snowfield', 'Snowfield'], ['river', 'Frozen river'],
    ['ruins', 'Frozen ruins'], ['highlands', 'Ice peaks'], ['empty', 'Empty']
  ]
};

/* ── Temperate ────────────────────────────────────────────── */
const TEMPERATE = {
  id: 'temperate',
  brand: 'TEMPERATE WORLD BUILDER',
  subtitle: 'isometric meadows · rivers · village ruins',
  name: 'Temperate',
  accent: '#8fce62',
  accentBg: '#263a18',
  canvasTop: '#17241a',
  canvasBottom: '#080d09',
  terrain: {
    base: 'temperate-grass', low: 'dirt', high: 'meadow',
    rock: 'stone', peak: 'stone', water: 'water'
  },
  tree: { trunk: 'oak-wood', leaf: 'oak-leaf' },
  palette: [
    'temperate-grass', 'meadow', 'dirt', 'stone', 'paving',
    'water', 'oak-wood', 'oak-leaf', 'thatch', 'roof-red'
  ],
  extraTiles: [
    t('temperate-grass', 'Temperate Grass', 'terrain', '#6eaa5a', '#355d3a', 58,
      dither('noise', 'bright', 66, 46, 28, 60), dither('noise', 'dark', 48, 44, 32, 60)),
    t('meadow', 'Meadow', 'terrain', '#8fbf63', '#4f7d3a', 55,
      dither('noise', 'bright', 62, 48, 30, 60), dither('lines', 'dark', 46, 34, 24, 58, 'multiply')),
    t('oak-leaf', 'Oak Leaves', 'details', '#4f8a4a', '#2f5c2f', 58,
      dither('crosshatch', 'bright', 54, 34, 26, 62), dither('noise', 'dark', 46, 44, 30, 60, 'multiply')),
    t('oak-wood', 'Oak Wood', 'details', '#8f6b43', '#4a3320', 50,
      dither('lines', 'dark', 50, 30, 24, 62, 'multiply'), dither('plank', 'dark', 46, 38, 22, 60, 'multiply')),
    t('thatch', 'Thatch', 'details', '#b88955', '#6b4327', 52,
      dither('lines', 'dark', 50, 30, 26, 62, 'multiply'), dither('plank', 'dark', 46, 38, 22, 60, 'multiply')),
    t('roof-red', 'Red Roof Tiles', 'details', '#9f4150', '#53242f', 46,
      dither('lines', 'bright', 62, 30, 26, 66, 'overlay'), dither('crosshatch', 'dark', 55, 34, 24, 64, 'multiply'))
  ],
  recolor: {
    'mossy-flagstone': ['#9aa88a', '#5f6b52', 55],
    'plank-floor': ['#a86b45', '#6f4430', 50],
    'plank-floor-worn': ['#8a5238', '#5a3424', 50],
    'courtyard-water': ['#5db3d5', '#24618a', 62],
    'moss-block': ['#9aa88a', '#5f6b52', 52],
    'moss-block-light': ['#b8c2a8', '#7f8a70', 52],
    'stone-steps-town': ['#a7adb3', '#5b646b', 48],
    'stone-pillar': ['#a7adb3', '#5b646b', 55],
    'stone-well': ['#9aa88a', '#5f6b52', 50],
    'plaster-stone-wall': ['#d6b66a', '#7d6631', 60],
    'timber-wall': ['#a27b6d', '#64453a', 55],
    'timber-trim': ['#8c7063', '#49342d', 58],
    'lattice-window': ['#8c7063', '#49342d', 70],
    'door-wood': ['#78564a', '#49342d', 50],
    'doorway-dark': ['#385150', '#2a4346', 50],
    'roof-shingle-red': ['#9f4150', '#53242f', 50],
    'roof-shingle-plum': ['#775066', '#49342d', 50],
    'roof-ridge': ['#9e7570', '#64453a', 48],
    'gable-plaster': ['#d6b66a', '#c9a05a', 55],
    'table-wood': ['#b88955', '#63432a', 40],
    'stool-wood': ['#8c7063', '#49342d', 45],
    'planter-soil': ['#64453a', '#49342d', 55],
    'sandstone': ['#a7adb3', '#5b646b', 55],
    'desert-roof': ['#9f4150', '#53242f', 52]
  },
  details: [
    decal('flowers', 'Flowers', 'flowers', '#ffd35c', '#e85c6a'),
    decal('grass-tufts', 'Grass Tufts', 'grass', '#5f9e4c'),
    decal('leaves', 'Fallen Leaves', 'leaves', '#4f8a4a', '#8fbf63'),
    decal('cracks', 'Cracks', 'cracks', '#5a4428'),
    decal('moss', 'Moss', 'moss', '#6f9e4a'),
    decal('pebbles', 'Pebbles', 'pebbles', '#9a9482'),
    decal('paving-detail', 'Paving Lines', 'paving', '#b0a68f')
  ],
  examples: [
    ['meadow', 'Meadow'], ['river', 'River valley'],
    ['ruins', 'Village ruins'], ['highlands', 'Rolling hills'], ['empty', 'Empty']
  ]
};

export const THEMES = { jungle: JUNGLE, snow: SNOW, temperate: TEMPERATE };
export const getTheme = id => THEMES[id] || TEMPERATE;
