import { TEXTURE_SIZE } from './config.js';

const textureCache = new Map();
const previewCache = new Map();

export function hexToRgb(hex) {
  const n = parseInt(String(hex).replace('#', ''), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex(r, g, b) {
  const c = v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

export function shade(hex, amount) {
  const c = hexToRgb(hex);
  const f = v => amount >= 0 ? v + (255 - v) * amount : v * (1 + amount);
  return rgbToHex(f(c.r), f(c.g), f(c.b));
}

export function normalizeTile(tile) {
  tile.bottom ??= shade(tile.top, -0.32);
  tile.split ??= 55;
  tile.topDither ??= { mode: 'noise', ink: 'bright', bright: 65, space: 42, thick: 32, blend: 65, blendMode: 'source-over' };
  tile.bottomDither ??= { mode: 'noise', ink: 'dark', bright: 55, space: 42, thick: 32, blend: 65, blendMode: 'source-over' };
  tile.topDither.blendMode ??= 'source-over';
  tile.bottomDither.blendMode ??= 'source-over';
  return tile;
}

function stringSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function hash2(x, y, seed) {
  let n = (x * 374761393 + y * 668265263 + seed * 69069) | 0;
  n = (n ^ (n >> 13)) * 1274126177;
  return ((n ^ (n >> 16)) >>> 0) / 4294967295;
}

function inkColor(base, s) {
  return shade(base, s.ink === 'dark' ? -(0.12 + (s.bright / 100) * 0.55) : (0.12 + (s.bright / 100) * 0.55));
}

function patternAt(x, y, s, seed) {
  if (!s || s.mode === 'solid') return false;
  const space = 1 + Math.round((s.space / 100) * 6);
  const thick = 1 + Math.round((s.thick / 100) * 3);
  const density = 0.12 + (s.bright / 100) * 0.62;
  const sx = x + (seed % 17);
  const sy = y + ((seed >> 4) % 19);
  if (s.mode === 'lines') return ((sx + sy) % space) < thick;
  if (s.mode === 'crosshatch') return ((sx + sy) % space) < thick || ((sx - sy + 1000) % space) < thick;
  if (s.mode === 'dots') return (sx % space === 0 && sy % space === 0) || (thick > 2 && sx % space === 1 && sy % space === 0);
  if (s.mode === 'noise') {
    const block = 1 + Math.round((s.space / 100) * 1.5);
    return hash2(Math.floor(x / block), Math.floor(y / block), seed) < density;
  }
  if (s.mode === 'random') {
    const block = 1 + Math.round((s.space / 100) * 3);
    return hash2(Math.floor(x / block), Math.floor(y / block), seed) < density;
  }
  if (s.mode === 'brick') {
    const bh = 2 + Math.round((100 - s.space) / 22);
    const bw = bh * 2;
    const row = Math.floor(y / bh);
    const offset = (row % 2) * Math.floor(bw / 2);
    return (y % bh === 0) || ((x + offset) % bw === 0);
  }
  if (s.mode === 'paving') {
    const block = 3 + Math.round((100 - s.space) / 18);
    return (x % block === 0) || (y % block === 0);
  }
  if (s.mode === 'checker') {
    const block = 1 + Math.round((100 - s.space) / 18);
    return (Math.floor(x / block) + Math.floor(y / block)) % 2 === 0;
  }
  if (s.mode === 'weave') {
    const block = 2 + Math.round((100 - s.space) / 20);
    const cx = Math.floor(x / block), cy = Math.floor(y / block);
    const horizontal = (cx + cy) % 2 === 0;
    return horizontal ? (y % block < thick) : (x % block < thick);
  }
  if (s.mode === 'plank') {
    const bh = 3 + Math.round((100 - s.space) / 25);
    const bw = bh * 5;
    const row = Math.floor(y / bh);
    const offset = Math.floor(hash2(row, 7, seed) * bw);
    return (y % bh === 0) || ((x + offset) % bw === 0);
  }
  if (s.mode === 'shingle') {
    const bh = 4 + Math.round((100 - s.space) / 20);
    const bw = bh + 2;
    const row = Math.floor(y / bh);
    const off = (row % 2) * Math.floor(bw / 2);
    const inRow = y % bh;
    return (inRow === bh - 1) || (inRow >= Math.floor(bh / 2) && (x + off) % bw === 0);
  }
  if (s.mode === 'stonework') {
    const bh = 5 + Math.round((100 - s.space) / 25);
    const row = Math.floor(y / bh);
    const bw = 7 + Math.floor(hash2(row, 3, seed) * 7);
    const off = Math.floor(hash2(row, 11, seed) * bw);
    return (y % bh === 0) || ((x + off) % bw === 0);
  }
  if (s.mode === 'lattice') {
    const gap = 5 + Math.round((100 - s.space) / 20);
    const edge = x < 2 || y < 2 || x >= TEXTURE_SIZE - 2 || y >= TEXTURE_SIZE - 2;
    return edge || ((x + y) % gap) < 1 || ((x - y + 1000) % gap) < 1;
  }
  return false;
}

function ditherKey(s) {
  return s ? `${s.mode},${s.ink},${s.bright},${s.space},${s.thick},${s.blend},${s.blendMode || 'source-over'}` : '';
}

function textureKey(tile, face) {
  return `${face}|${tile.id}|${tile.top}|${tile.bottom}|${tile.split}|${ditherKey(tile.topDither)}|${ditherKey(tile.bottomDither)}`;
}

function applyDither(g, tile, s, seed, y0, y1, base) {
  if (!s || s.mode === 'solid' || y1 <= y0) return;
  g.save();
  g.globalAlpha = 0.12 + (s.blend / 100) * 0.88;
  g.globalCompositeOperation = s.blendMode || 'source-over';
  g.fillStyle = inkColor(base, s);
  for (let y = Math.floor(y0); y < Math.ceil(y1); y++) {
    for (let x = 0; x < TEXTURE_SIZE; x++) if (patternAt(x, y, s, seed)) g.fillRect(x, y, 1, 1);
  }
  g.restore();
}

export function faceTexture(tile, face) {
  normalizeTile(tile);
  const key = textureKey(tile, face);
  const cached = textureCache.get(key);
  if (cached) return cached;

  const size = TEXTURE_SIZE;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const g = c.getContext('2d');
  const split = Math.max(0, Math.min(1, (Number(tile.split) || 0) / 100));
  const seed = stringSeed(tile.id + face);

  if (face === 'top') {
    g.fillStyle = tile.top;
    g.fillRect(0, 0, size, size);
    applyDither(g, tile, tile.topDither, seed, 0, size, tile.top);
  } else {
    const left = face === 'left';
    const topColor = left ? shade(tile.top, -0.12) : shade(tile.top, 0.02);
    const bottomBase = tile.bottom || tile.top;
    const bottomColor = left ? shade(bottomBase, -0.12) : shade(bottomBase, 0.02);
    const splitY = Math.round(size * split);
    g.fillStyle = topColor;
    g.fillRect(0, 0, size, splitY);
    g.fillStyle = bottomColor;
    g.fillRect(0, splitY, size, size - splitY);
    applyDither(g, tile, tile.topDither, seed + 37, 0, splitY, topColor);
    applyDither(g, tile, tile.bottomDither, seed + 101, splitY, size, bottomColor);
  }

  textureCache.set(key, c);
  return c;
}

export function drawTextureTri(g, points, texture, alpha = 1) {
  if (!texture) return;
  const [p0, p1, p2] = points;
  const size = texture.width;
  const ux = (p1[0] - p0[0]) / size;
  const uy = (p1[1] - p0[1]) / size;
  const vx = (p2[0] - p0[0]) / size;
  const vy = (p2[1] - p0[1]) / size;
  g.save();
  g.globalAlpha = alpha;
  g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.lineTo(p2[0], p2[1]); g.closePath(); g.clip();
  g.transform(ux, uy, vx, vy, p0[0], p0[1]);
  g.drawImage(texture, 0, 0);
  g.restore();
  g.save();
  g.globalAlpha = alpha;
  g.strokeStyle = 'rgba(0,0,0,.42)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.lineTo(p2[0], p2[1]); g.closePath(); g.stroke();
  g.restore();
}

export function drawTextureQuad(g, points, texture, alpha = 1) {
  if (!texture) return;
  const [p0, p1, , p3] = points;
  const size = texture.width;
  const ux = (p1[0] - p0[0]) / size;
  const uy = (p1[1] - p0[1]) / size;
  const vx = (p3[0] - p0[0]) / size;
  const vy = (p3[1] - p0[1]) / size;

  g.save();
  g.globalAlpha = alpha;
  g.beginPath();
  g.moveTo(points[0][0], points[0][1]);
  points.slice(1).forEach(pt => g.lineTo(pt[0], pt[1]));
  g.closePath();
  g.clip();
  g.transform(ux, uy, vx, vy, p0[0], p0[1]);
  g.drawImage(texture, 0, 0);
  g.restore();

  g.save();
  g.globalAlpha = alpha;
  g.strokeStyle = 'rgba(0,0,0,.4)';
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(points[0][0], points[0][1]);
  points.slice(1).forEach(pt => g.lineTo(pt[0], pt[1]));
  g.closePath();
  g.stroke();
  g.restore();
}

function previewKey(tile) {
  return `${tile.top}|${tile.bottom}|${tile.split}|${ditherKey(tile.topDither)}|${ditherKey(tile.bottomDither)}`;
}

export function tilePreviewURL(tile) {
  normalizeTile(tile);
  const key = previewKey(tile);
  if (previewCache.has(key)) return previewCache.get(key);

  const c = document.createElement('canvas');
  c.width = 80;
  c.height = 64;
  const g = c.getContext('2d');
  const top = [[40, 7], [70, 23], [40, 39], [10, 23]];
  const left = [[10, 23], [40, 39], [40, 57], [10, 41]];
  const right = [[40, 39], [70, 23], [70, 41], [40, 57]];
  drawTextureQuad(g, left, faceTexture(tile, 'left'));
  drawTextureQuad(g, right, faceTexture(tile, 'right'));
  drawTextureQuad(g, top, faceTexture(tile, 'top'));

  const url = c.toDataURL();
  previewCache.set(key, url);
  return url;
}
