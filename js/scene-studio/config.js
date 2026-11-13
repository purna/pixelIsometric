export const LIBRARY_STORAGE = 'pixelIsometric.sceneStudio.library.v2';
export const SCENE_STORAGE = 'pixelIsometric.sceneStudio.scene.v1';
export const TEXTURE_SIZE = 40;

export const dither = (mode = 'solid', ink = 'bright', bright = 60, space = 45, thick = 30, blend = 65, blendMode = 'source-over') => ({
  mode, ink, bright, space, thick, blend, blendMode,
});

export const DEFAULT_SETS = [
  { id: 'classic', name: 'Classic' },
  { id: 'desert', name: 'Desert' },
  { id: 'snow', name: 'Snow' },
  { id: 'jungle', name: 'Jungle' },
  { id: 'town', name: 'Town' },
];

export const DEFAULT_GROUPS = [
  { id: 'terrain', name: 'Terrain', setId: 'classic' },
  { id: 'brick', name: 'Brick & Paving', setId: 'classic' },
  { id: 'roofs', name: 'Roof Systems', setId: 'classic' },
  { id: 'walls', name: 'Walls & Steps', setId: 'classic' },
  { id: 'structures', name: 'Structures', setId: 'classic' },
  { id: 'details', name: 'Details', setId: 'classic' },
  { id: 'desert-ground', name: 'Desert Ground', setId: 'desert' },
  { id: 'desert-build', name: 'Desert Build', setId: 'desert' },
  { id: 'snow-ground', name: 'Snow Ground', setId: 'snow' },
  { id: 'snow-build', name: 'Snow Build', setId: 'snow' },
  { id: 'jungle-ground', name: 'Jungle Ground', setId: 'jungle' },
  { id: 'jungle-build', name: 'Jungle Build', setId: 'jungle' },
  { id: 'town-ground', name: 'Town Ground', setId: 'town' },
  { id: 'town-stone', name: 'Town Stonework', setId: 'town' },
  { id: 'town-walls', name: 'Town Walls', setId: 'town' },
  { id: 'town-roofs', name: 'Town Roofs', setId: 'town' },
  { id: 'town-props', name: 'Town Props', setId: 'town' },
];

const tile = (id, name, groupId, top, bottom, split, topDither, bottomDither) => ({
  id, name, groupId, top, bottom, split, topDither, bottomDither,
});

export const DEFAULT_TILES = [
  tile('grass', 'Grass', 'terrain', '#6eaa5a', '#355d3a', 58,
    dither('noise', 'bright', 72, 42, 32, 68), dither('noise', 'dark', 58, 42, 32, 68)),
  tile('stone', 'Stone', 'terrain', '#a7adb3', '#5b646b', 52,
    dither('crosshatch', 'bright', 66, 38, 28, 64), dither('lines', 'dark', 54, 34, 24, 60)),
  tile('water', 'Water', 'terrain', '#5db3d5', '#24618a', 62,
    dither('lines', 'bright', 58, 28, 22, 55), dither('solid', 'dark', 45, 45, 30, 55)),
  tile('sand', 'Sand', 'terrain', '#e5c77b', '#9b7339', 48,
    dither('dots', 'bright', 62, 38, 30, 62), dither('noise', 'dark', 50, 45, 35, 60)),
  tile('snow', 'Snow', 'terrain', '#eff6fb', '#9fb6c6', 68,
    dither('noise', 'bright', 70, 45, 28, 58), dither('solid', 'dark', 40, 45, 30, 55)),
  tile('lava', 'Lava', 'terrain', '#ec713f', '#7c1f1b', 60,
    dither('crosshatch', 'bright', 78, 34, 30, 74), dither('noise', 'dark', 60, 42, 34, 72)),
  tile('dirt', 'Dirt', 'terrain', '#8a6a46', '#4c3524', 55,
    dither('random', 'bright', 55, 48, 36, 62), dither('noise', 'dark', 48, 45, 34, 64)),

  tile('brick-red', 'Red Brick', 'brick', '#b5564a', '#5d2c2b', 50,
    dither('brick', 'bright', 62, 38, 28, 70, 'multiply'), dither('brick', 'dark', 50, 38, 28, 70, 'multiply')),
  tile('brick-pale', 'Pale Brick', 'brick', '#c9b48e', '#7d674a', 52,
    dither('brick', 'bright', 58, 42, 26, 66, 'overlay'), dither('brick', 'dark', 48, 42, 26, 66, 'multiply')),
  tile('paving', 'Paving', 'brick', '#8c8f96', '#4e5359', 55,
    dither('paving', 'bright', 64, 34, 30, 68, 'overlay'), dither('paving', 'dark', 52, 36, 28, 66, 'multiply')),
  tile('cobble', 'Cobblestone', 'brick', '#9aa2a8', '#596267', 48,
    dither('checker', 'bright', 60, 26, 34, 70, 'soft-light'), dither('noise', 'dark', 50, 40, 32, 64, 'multiply')),

  tile('roof', 'Roof Tiles', 'roofs', '#9f4150', '#53242f', 46,
    dither('lines', 'bright', 62, 30, 26, 66, 'overlay'), dither('crosshatch', 'dark', 55, 34, 24, 64, 'multiply')),
  tile('roof-slate', 'Slate Roof', 'roofs', '#596a7b', '#2a3440', 50,
    dither('weave', 'bright', 55, 30, 26, 72, 'overlay'), dither('weave', 'dark', 48, 30, 26, 72, 'multiply')),
  tile('roof-terracotta', 'Terracotta Roof', 'roofs', '#b85a48', '#6a2e27', 50,
    dither('lines', 'bright', 58, 22, 30, 72, 'overlay'), dither('crosshatch', 'dark', 45, 32, 24, 68, 'multiply')),

  tile('wall', 'Painted Wall', 'walls', '#d6b66a', '#7d6631', 58,
    dither('solid', 'bright', 50, 40, 30, 55), dither('lines', 'dark', 50, 36, 24, 60)),
  tile('wall-plaster', 'Plaster Wall', 'walls', '#d6c89f', '#7b6f4f', 66,
    dither('noise', 'bright', 46, 50, 30, 55, 'soft-light'), dither('lines', 'dark', 42, 34, 22, 60, 'multiply')),
  tile('wall-stone', 'Stone Wall', 'walls', '#a7b0b4', '#546066', 52,
    dither('brick', 'bright', 62, 40, 28, 68, 'overlay'), dither('paving', 'dark', 48, 38, 30, 64, 'multiply')),
  tile('steps', 'Stone Steps', 'walls', '#b1b6b8', '#5c6367', 48,
    dither('lines', 'bright', 56, 28, 32, 66, 'overlay'), dither('brick', 'dark', 46, 40, 26, 64, 'multiply')),

  tile('brick', 'Brick', 'structures', '#c97259', '#7c3429', 56,
    dither('lines', 'bright', 64, 35, 30, 68), dither('crosshatch', 'dark', 52, 38, 26, 65)),
  tile('wood', 'Wood', 'structures', '#b88955', '#63432a', 54,
    dither('lines', 'bright', 58, 32, 24, 62), dither('lines', 'dark', 48, 32, 24, 62)),
  tile('metal', 'Metal', 'details', '#8d99a6', '#48515a', 50,
    dither('crosshatch', 'bright', 68, 36, 26, 62), dither('dots', 'dark', 48, 42, 30, 58)),

  tile('desert-sand', 'Desert Sand', 'desert-ground', '#e0b96e', '#9a6a32', 50,
    dither('dots', 'bright', 58, 38, 30, 60), dither('noise', 'dark', 48, 44, 32, 62)),
  tile('sandstone', 'Sandstone', 'desert-build', '#c89b62', '#79562f', 55,
    dither('brick', 'bright', 60, 38, 28, 66, 'overlay'), dither('brick', 'dark', 48, 36, 26, 64, 'multiply')),
  tile('desert-roof', 'Desert Roof', 'desert-build', '#b77f4d', '#6b4327', 52,
    dither('lines', 'bright', 56, 26, 30, 66), dither('crosshatch', 'dark', 44, 34, 24, 60)),

  tile('snow-pack', 'Snow Pack', 'snow-ground', '#f4fbff', '#a8c0d2', 64,
    dither('noise', 'bright', 68, 46, 30, 58), dither('solid', 'dark', 38, 46, 30, 52)),
  tile('ice-brick', 'Ice Brick', 'snow-build', '#b8e2f2', '#5b8fa8', 54,
    dither('brick', 'bright', 60, 38, 28, 66, 'screen'), dither('brick', 'dark', 45, 38, 28, 64, 'multiply')),
  tile('snow-roof', 'Snow Roof', 'snow-build', '#d9ecf5', '#7896a8', 58,
    dither('weave', 'bright', 55, 30, 26, 64, 'screen'), dither('crosshatch', 'dark', 42, 34, 24, 60, 'multiply')),

  tile('jungle-moss', 'Jungle Moss', 'jungle-ground', '#4f8a4a', '#244724', 60,
    dither('noise', 'bright', 60, 48, 34, 66), dither('random', 'dark', 48, 46, 34, 64)),
  tile('jungle-stone', 'Jungle Stone', 'jungle-build', '#7d8f6b', '#3f4d36', 56,
    dither('crosshatch', 'bright', 58, 36, 28, 64), dither('paving', 'dark', 46, 38, 28, 62, 'multiply')),
  tile('jungle-wood', 'Jungle Wood', 'jungle-build', '#8f6b43', '#4a3320', 54,
    dither('lines', 'bright', 56, 30, 24, 62), dither('noise', 'dark', 46, 42, 32, 60)),
  // ── Town set (palette sampled from tilemap_example.png) ──────────────
  // Ground & floors
  tile('mossy-flagstone', 'Mossy Flagstone', 'town-ground', '#a9b195', '#647968', 55,
    dither('stonework', 'dark', 48, 40, 20, 70, 'multiply'), dither('stonework', 'dark', 52, 40, 20, 66, 'multiply')),
  tile('plank-floor', 'Plank Floor', 'town-ground', '#8c7063', '#64453a', 50,
    dither('plank', 'dark', 50, 42, 20, 72, 'multiply'), dither('plank', 'dark', 55, 42, 20, 66, 'multiply')),
  tile('plank-floor-worn', 'Worn Planks', 'town-ground', '#78564a', '#49342d', 50,
    dither('plank', 'dark', 58, 55, 20, 72, 'multiply'), dither('plank', 'dark', 50, 50, 20, 64, 'multiply')),
  tile('courtyard-water', 'Well Water', 'town-ground', '#4d7fbb', '#2a4346', 62,
    dither('lines', 'bright', 52, 28, 22, 55), dither('solid', 'dark', 45, 45, 30, 55)),

  // Stone blocks, steps, pillars, wells
  tile('moss-block', 'Mossy Stone Block', 'town-stone', '#95a083', '#56675e', 52,
    dither('stonework', 'dark', 46, 38, 20, 72, 'multiply'), dither('stonework', 'dark', 54, 38, 20, 68, 'multiply')),
  tile('moss-block-light', 'Light Stone Block', 'town-stone', '#a9b195', '#71846e', 52,
    dither('stonework', 'dark', 40, 38, 20, 68, 'multiply'), dither('stonework', 'dark', 48, 38, 20, 66, 'multiply')),
  tile('stone-steps-town', 'Stone Steps', 'town-stone', '#849277', '#465d57', 48,
    dither('lines', 'dark', 45, 30, 26, 64, 'multiply'), dither('stonework', 'dark', 50, 38, 20, 66, 'multiply')),
  tile('stone-pillar', 'Stone Pillar', 'town-stone', '#95a083', '#385150', 55,
    dither('stonework', 'dark', 44, 60, 20, 66, 'multiply'), dither('stonework', 'dark', 52, 60, 20, 66, 'multiply')),
  tile('stone-well', 'Well Rim', 'town-stone', '#a9b195', '#647968', 50,
    dither('stonework', 'dark', 42, 34, 20, 68, 'multiply'), dither('stonework', 'dark', 50, 34, 20, 66, 'multiply')),

  // Walls: plaster over stone, timber frames, lattice windows, doors
  tile('plaster-stone-wall', 'Plaster & Stone Wall', 'town-walls', '#bea55b', '#56675e', 60,
    dither('noise', 'dark', 36, 50, 30, 50, 'soft-light'), dither('stonework', 'dark', 50, 38, 20, 70, 'multiply')),
  tile('timber-wall', 'Timber Frame', 'town-walls', '#a27b6d', '#64453a', 55,
    dither('lines', 'dark', 40, 34, 22, 56, 'multiply'), dither('lines', 'dark', 48, 34, 22, 60, 'multiply')),
  tile('timber-trim', 'Timber Trim', 'town-walls', '#8c7063', '#49342d', 58,
    dither('plank', 'dark', 44, 40, 20, 60, 'multiply'), dither('plank', 'dark', 50, 40, 20, 62, 'multiply')),
  tile('lattice-window', 'Lattice Window', 'town-walls', '#a27b6d', '#78564a', 70,
    dither('lattice', 'dark', 62, 40, 20, 80, 'multiply'), dither('plank', 'dark', 48, 40, 20, 62, 'multiply')),
  tile('door-wood', 'Wooden Door', 'town-walls', '#78564a', '#49342d', 50,
    dither('lines', 'dark', 52, 26, 24, 66, 'multiply'), dither('lines', 'dark', 52, 26, 24, 66, 'multiply')),
  tile('doorway-dark', 'Dark Doorway', 'town-walls', '#385150', '#2a4346', 50,
    dither('noise', 'dark', 30, 45, 30, 50), dither('noise', 'dark', 30, 45, 30, 50)),

  // Roofs
  tile('roof-shingle-red', 'Red Shingle Roof', 'town-roofs', '#893f49', '#775066', 50,
    dither('shingle', 'dark', 56, 42, 26, 72, 'multiply'), dither('shingle', 'dark', 50, 42, 26, 68, 'multiply')),
  tile('roof-shingle-plum', 'Plum Shingle Roof', 'town-roofs', '#775066', '#49342d', 50,
    dither('shingle', 'dark', 56, 42, 26, 72, 'multiply'), dither('shingle', 'dark', 50, 42, 26, 68, 'multiply')),
  tile('roof-ridge', 'Roof Ridge', 'town-roofs', '#9e7570', '#64453a', 48,
    dither('lines', 'dark', 48, 30, 26, 60, 'multiply'), dither('lines', 'dark', 44, 30, 26, 60, 'multiply')),
  tile('gable-plaster', 'Gable Plaster', 'town-roofs', '#bea55b', '#aa865a', 55,
    dither('noise', 'dark', 36, 50, 30, 50, 'soft-light'), dither('lines', 'dark', 42, 34, 22, 56, 'multiply')),

  // Props
  tile('table-wood', 'Wood Table', 'town-props', '#aa865a', '#64453a', 40,
    dither('plank', 'dark', 46, 42, 20, 62, 'multiply'), dither('lines', 'dark', 48, 32, 24, 62, 'multiply')),
  tile('stool-wood', 'Wood Stool', 'town-props', '#8c7063', '#49342d', 45,
    dither('plank', 'dark', 44, 40, 20, 62, 'multiply'), dither('lines', 'dark', 48, 32, 24, 62, 'multiply')),
  tile('planter-soil', 'Planter Soil', 'town-props', '#64453a', '#49342d', 55,
    dither('noise', 'bright', 46, 48, 30, 60), dither('noise', 'dark', 48, 45, 34, 60)),
];
