/**
 * two-d-view.js
 *
 * Lightweight 2D isometric canvas view. It reads the same placedCubes map as
 * the 3D scene, so painting in either mode edits the same level data.
 */
import { renderer } from './three-adapter.js';
import { getPlacedMap, getActiveTool, getHeightIdx, placeShapeAtGrid, eraseAtGrid } from './drawing.js';
import { getActiveMaterial } from './material-manager.js';

const CELL = 1;
const GRID_N = window.GRID_N || 20;

let canvas = null;
let ctx = null;
let host = null;
let visible = false;
let hoverCell = null;
let S = 32;
let OX = 0;
let OY = 0;

export function init2DView(container) {
  host = container;
  canvas = document.createElement('canvas');
  canvas.id = 'view-2d-canvas';
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:none;z-index:2;cursor:crosshair;';
  container.appendChild(canvas);
  ctx = canvas.getContext('2d');

  canvas.addEventListener('mousemove', onMove);
  canvas.addEventListener('mouseleave', () => { hoverCell = null; });
  canvas.addEventListener('mousedown', onDown);
  canvas.addEventListener('mouseup', (e) => e.stopPropagation());
  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(loop);
}

export function set2DVisible(value) {
  visible = !!value;
  if (!canvas) return;
  canvas.style.display = visible ? 'block' : 'none';
  if (renderer?.domElement) renderer.domElement.style.display = visible ? 'none' : 'block';
  if (visible) resize();
}

export function is2DVisible() { return visible; }

function resize() {
  if (!canvas || !host) return;
  const w = host.clientWidth || 1;
  const h = host.clientHeight || 1;
  canvas.width = w;
  canvas.height = h;
  S = Math.max(12, Math.min(w, h) / (GRID_N * 1.45));
  OX = w / 2;
  OY = h / 2 - GRID_N * S * 0.22;
}

function iso(x, y, z) {
  return [OX + (x - y) * S, OY + (x + y) * 0.5 * S - z * S];
}

function loop() {
  if (visible) draw();
  requestAnimationFrame(loop);
}

function draw() {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#0d0d10';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawGrid();

  const placed = getPlacedMap();
  const items = [];
  for (const [key, mesh] of placed) {
    const [gx, h, gz] = key.split(',').map(Number);
    items.push({ gx, h, gz, mesh });
  }
  items.sort((a, b) => (a.gx + a.gz - b.gx - b.gz) || (a.h - b.h));
  items.forEach(item => drawCube(item.gx, item.gz, item.h, item.mesh, 1));

  if (hoverCell && getActiveTool() !== 'erase' && !getActiveTool().startsWith('col-')) {
    drawCube(hoverCell.gx, hoverCell.gz, getHeightIdx(), null, 0.35);
  }
}

function drawGrid() {
  const z = getHeightIdx();
  ctx.lineWidth = 1;
  for (let x = 0; x <= GRID_N; x++) {
    for (let y = 0; y <= GRID_N; y++) {
      if (x < GRID_N) {
        const a = iso(x, y, z), b = iso(x + 1, y, z);
        ctx.strokeStyle = 'rgba(255,255,255,0.055)';
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      }
      if (y < GRID_N) {
        const a = iso(x, y, z), b = iso(x, y + 1, z);
        ctx.strokeStyle = 'rgba(255,255,255,0.055)';
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      }
    }
  }
}

function materialColors(mesh) {
  const u = mesh?.material?.userData?.uniforms;
  const hex = (c, fallback) => c?.value?.getStyle ? c.value.getStyle() : fallback;
  return {
    top: hex(u?.colorA, '#3ecfb2'),
    side: hex(u?.colorB, '#2a8f7c'),
    base: hex(u?.baseColor, '#8a7a60'),
    alpha: mesh?.material?.transparent ? (mesh.material.opacity ?? 0.6) : 1,
  };
}

function shade(hex, factor) {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const r = parseInt(n.slice(0, 2), 16), g = parseInt(n.slice(2, 4), 16), b = parseInt(n.slice(4, 6), 16);
  return `rgb(${Math.min(255, r * factor | 0)},${Math.min(255, g * factor | 0)},${Math.min(255, b * factor | 0)})`;
}

function drawCube(gx, gz, h, mesh, alpha) {
  const colors = mesh ? materialColors(mesh) : materialColors({ material: getActiveMaterial() });
  const z = h;
  const p = (x, y, zz) => iso(x, y, zz);
  const top = [p(gx, gz, z + 1), p(gx + 1, gz, z + 1), p(gx + 1, gz + 1, z + 1), p(gx, gz + 1, z + 1)];
  const left = [p(gx, gz + 1, z), p(gx + 1, gz + 1, z), p(gx + 1, gz + 1, z + 1), p(gx, gz + 1, z + 1)];
  const right = [p(gx + 1, gz, z), p(gx + 1, gz + 1, z), p(gx + 1, gz + 1, z + 1), p(gx + 1, gz, z + 1)];

  ctx.globalAlpha = alpha * (colors.alpha ?? 1);
  fillPoly(left, shade(colors.side, 0.72));
  fillPoly(right, shade(colors.side, 0.9));
  fillPoly(top, shade(colors.top, 1.08));
  ctx.globalAlpha = 1;

  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 1;
  [top, left, right].forEach(poly => strokePoly(poly));
}

function fillPoly(points, color) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function strokePoly(points) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.stroke();
}

function cellFromEvent(e) {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const z = getHeightIdx();
  const u = (mx - OX) / S;
  const v = (my - OY) / S + z;
  const gx = Math.floor(v + u / 2);
  const gz = Math.floor(v - u / 2);
  if (gx < 0 || gx >= GRID_N || gz < 0 || gz >= GRID_N) return null;
  return { gx, gz };
}

function onMove(e) {
  e.stopPropagation();
  hoverCell = cellFromEvent(e);
}

function onDown(e) {
  e.stopPropagation();
  if (e.button !== 0) return;
  const cell = cellFromEvent(e);
  if (!cell) return;
  const tool = getActiveTool();
  if (tool === 'erase') eraseAtGrid(cell.gx, cell.gz);
  else if (!tool.startsWith('col-') && tool !== 'move' && tool !== 'select') placeShapeAtGrid(cell.gx, cell.gz);
}
