export const LIBRARY_STORAGE = 'pixelIsometric.sceneStudio.library.v2';
export const SCENE_STORAGE = 'pixelIsometric.sceneStudio.scene.v1';
export const TEXTURE_SIZE = 40;

export const dither = (mode = 'solid', ink = 'bright', bright = 60, space = 45, thick = 30, blend = 65, blendMode = 'source-over') => ({
  mode, ink, bright, space, thick, blend, blendMode,
});

export const DEFAULT_GROUPS = [
  { id: 'terrain', name: 'Terrain' },
  { id: 'brick', name: 'Brick & Paving' },
  { id: 'roofs', name: 'Roof Systems' },
  { id: 'walls', name: 'Walls & Steps' },
  { id: 'structures', name: 'Structures' },
  { id: 'details', name: 'Details' },
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
];
