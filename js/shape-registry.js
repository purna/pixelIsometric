/**
 * shape-registry.js
 *
 * Registers every placeable shape type.
 * Each entry must supply:
 *   id          — unique string key
 *   label       — human-readable name
 *   accentColor — hex used in UI chip highlight
 *   createMesh  — (colorHex) → THREE.Mesh
 *   iconSVG     — (colorHex) → SVG string  (isometric-cube look)
 *
 * The icon faces are sized to a 52×44 viewBox to match v7.
 */
import * as THREE from 'three';

import { createCubeMaterial, createRiverMaterial, createWaterMaterial } from './material-instance.js';

const CELL = 1;   // scene units per grid cell

/** ── Geometry helpers ────────────────────────────────────────────── */

function boxGeo() { return new THREE.BoxGeometry(CELL, CELL, CELL); }

// Thickness-1 extrusion → boxGeometry + extrude along +Z
function boxGeoEx(sw, sh, sd) {
  const shape = new THREE.Shape();
  shape.moveTo(-sw / 2, 0);
  shape.lineTo(sw / 2, 0);
  shape.lineTo(sw / 2, sh);
  shape.lineTo(-sw / 2, sh);
  shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape, { depth: sd, bevelEnabled: false });
  g.translate(0, 0, -sd / 2);
  return g;
}

// Isometric cube SVG — shared face vertices in a 52×44 viewBox
function cubeSVG(topColor, faceOpacity) {
  const t = topColor, lAlpha = faceOpacity.left, rAlpha = faceOpacity.right;
  return `<svg viewBox="0 0 52 44" xmlns="http://www.w3.org/2000/svg">
    <polygon points="26,2 50,14 26,26 2,14"  fill="${t}" fill-opacity=".95"/>
    <polygon points="2,14 26,26 26,42 2,30"  fill="${t}" fill-opacity="${lAlpha}"/>
    <polygon points="50,14 26,26 26,42 50,30" fill="${t}" fill-opacity="${rAlpha}"/>
    <polygon points="26,2 50,14 26,26 2,14"   fill="none" stroke="#000" stroke-width="1.2"/>
    <polygon points="2,14 26,26 26,42 2,30"   fill="none" stroke="#000" stroke-width="1.2"/>
    <polygon points="50,14 26,26 26,42 50,30" fill="none" stroke="#000" stroke-width="1.2"/>
    <line x1="26" y1="26" x2="26" y2="42" stroke="#000" stroke-width="1.2"/>
  </svg>`;
}

function wireSVG(col, type) { return cubeSVG(col, { left: '.55', right: '.42' }); }

/** ── Shape type registry ─────────────────────────────────────────── */

function makeOutlineMat(color = 0x000000) {
  return new THREE.LineBasicMaterial({ color });
}

export const SHAPE_TYPES = [
  /* ── Dither / split cube ── */
  {
    id: 'cube-dither',
    label: 'Dither',
    accentColor: '#e8a838',
    iconSVG(col) { return cubeSVG(col, { left: '.55', right: '.38' }); },
    createMesh(col) {
      const m = new THREE.Mesh(boxGeo(), createCubeMaterial(0));
      m.add(new THREE.LineSegments(new THREE.EdgesGeometry(boxGeo()), makeOutlineMat()));
      m.userData.shapeTypeId = 'cube-dither';
      return m;
    },
  },

  /* ── Solid cube ── */
  {
    id: 'cube-solid',
    label: 'Solid',
    accentColor: '#3ecfb2',
    iconSVG(col) { return cubeSVG(col, { left: '.60', right: '.42' }); },
    createMesh(col) {
      const m = new THREE.Mesh(boxGeo(), createCubeMaterial(1));
      m.add(new THREE.LineSegments(new THREE.EdgesGeometry(boxGeo()), makeOutlineMat()));
      m.userData.shapeTypeId = 'cube-solid';
      return m;
    },
  },

  /* ── Water / transparent block ── */
  {
    id: 'cube-water',
    label: 'Water',
    accentColor: '#5b9bd5',
    iconSVG(col) { return cubeSVG(col, { left: '.22', right: '.16' }); },
    createMesh(col) {
      const m = new THREE.Mesh(boxGeo(), createCubeMaterial(2));
      m.add(new THREE.LineSegments(new THREE.EdgesGeometry(boxGeo()),
        new THREE.LineBasicMaterial({ color: 0x88ccee })));
      m.userData.shapeTypeId = 'cube-water';
      return m;
    },
  },

  /* ── River tile (custom river shader) ─ */
  {
    id: 'cube-river',
    label: 'River',
    accentColor: '#4ba3c9',
    iconSVG(col) { return cubeSVG(col, { left: '.55', right: '.38' }); },
    createMesh(col) {
      const m = new THREE.Mesh(boxGeo(), createRiverMaterial());
      m.add(new THREE.LineSegments(new THREE.EdgesGeometry(boxGeo()), makeOutlineMat()));
      m.userData.shapeTypeId = 'cube-river';
      return m;
    },
  },

  /* ── Sphere ── */
  {
    id: 'sphere',
    label: 'Sphere',
    accentColor: '#9b7fd4',
    iconSVG(col) {
      return `<svg viewBox="0 0 52 44" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="26" cy="22" rx="22" ry="18" fill="${col}" fill-opacity=".85"/>
      <ellipse cx="26" cy="22" rx="22" ry="18" fill="none" stroke="#000" stroke-width="1.2"/>
      <path d="M6 22 Q26 10 46 22" fill="none" stroke="#000" stroke-width=".8" stroke-opacity=".4"/>
    </svg>`;
    },
    createMesh(col) {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(CELL * 0.5, 20, 20),
        new THREE.MeshStandardMaterial({ color: new THREE.Color(col), roughness: 0.5 })
      );
      m.userData.shapeTypeId = 'sphere';
      return m;
    },
  },

  /* ── Cylinder ── */
  {
    id: 'cylinder',
    label: 'Cylinder',
    accentColor: '#f0a040',
    iconSVG(col) {
      return `<svg viewBox="0 0 52 44" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="26" cy="8"  rx="17" ry="6"  fill="${col}" fill-opacity=".90"/>
      <ellipse cx="26" cy="36" rx="17" ry="6"  fill="${col}" fill-opacity=".55"/>
      <rect x="9" y="8" width="34" height="28" fill="${col}" fill-opacity=".65"/>
      <ellipse cx="26" cy="8"  rx="17" ry="6"  fill="none" stroke="#000" stroke-width="1.2"/>
      <ellipse cx="26" cy="36" rx="17" ry="6"  fill="none" stroke="#000" stroke-width="1.2"/>
    </svg>`;
    },
    createMesh(col) {
      const m = new THREE.Mesh(
        new THREE.CylinderGeometry(CELL * 0.45, CELL * 0.45, CELL, 20),
        new THREE.MeshStandardMaterial({ color: new THREE.Color(col), roughness: 0.6 })
      );
      m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), makeOutlineMat()));
      m.userData.shapeTypeId = 'cylinder';
      return m;
    },
  },

  /* ── Ramp / wedge ── */
  {
    id: 'ramp',
    label: 'Ramp',
    accentColor: '#a07840',
    iconSVG(col) {
      return `<svg viewBox="0 0 52 44" xmlns="http://www.w3.org/2000/svg">
      <polygon points="2,40 50,40 50,14 2,28"  fill="${col}" fill-opacity=".80"/>
      <polygon points="2,40 50,40 50,14 2,28"  fill="none" stroke="#000" stroke-width="1.2"/>
      <polygon points="50,14 2,28 2,40"       fill="none" stroke="#000" stroke-width="1.2"/>
    </svg>`;
    },
    createMesh(col) {
      const shape = new THREE.Shape();
      shape.moveTo(-0.5, 0);
      shape.lineTo(0.5, 0);
      shape.lineTo(0.5, 0.5);
      shape.lineTo(-0.5, 0);
      shape.closePath();
      const g = new THREE.ExtrudeGeometry(shape, { depth: CELL, bevelEnabled: false, steps: 1 });
      g.translate(0, 0, -CELL / 2);
      const m = new THREE.Mesh(g,
        new THREE.MeshStandardMaterial({ color: new THREE.Color(col), roughness: 0.7 }));
      m.add(new THREE.LineSegments(new THREE.EdgesGeometry(g), makeOutlineMat()));
      m.userData.shapeTypeId = 'ramp';
      return m;
    },
  },

  /* ── Terrain tile (0.25 high cube) ─ */
  {
    id: 'terrain-tile',
    label: 'Terrain',
    accentColor: '#5cb85c',
    iconSVG(col) {
      return `<svg viewBox="0 0 52 44" xmlns="http://www.w3.org/2000/svg">
      <polygon points="26,8 50,20 26,32 2,20"  fill="${col}" fill-opacity=".90"/>
      <polygon points="2,20 26,32 26,42 2,30"  fill="${col}" fill-opacity=".60"/>
      <polygon points="50,20 26,32 26,42 50,30" fill="${col}" fill-opacity=".42"/>
      <polygon points="26,8 50,20 26,32 2,20"   fill="none" stroke="#000" stroke-width="1.2"/>
      <polygon points="2,20 26,32 26,42 2,30"   fill="none" stroke="#000" stroke-width="1.2"/>
      <polygon points="50,20 26,32 26,42 50,30" fill="none" stroke="#000" stroke-width="1.2"/>
    </svg>`;
    },
    createMesh(col) {
      const h = CELL * 0.25;
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(CELL, h, CELL),
        new THREE.MeshStandardMaterial({ color: new THREE.Color(col), roughness: 0.7 })
      );
      m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), makeOutlineMat()));
      m.userData.shapeTypeId = 'terrain-tile';
      m.userData.terrainHeight = 0.25;
      return m;
    },
    getMeshHeight() { return CELL * 0.25; },
  },

  /* ── Wall (tall thin slab) ─ */
  {
    id: 'wall',
    label: 'Wall',
    accentColor: '#8b7355',
    iconSVG(col) {
      return `<svg viewBox="0 0 52 44" xmlns="http://www.w3.org/2000/svg">
      <polygon points="26,2 48,12 26,22 4,12" fill="${col}" fill-opacity=".90"/>
      <polygon points="4,12 26,22 26,42 4,32" fill="${col}" fill-opacity=".55"/>
      <polygon points="48,12 26,22 26,42 48,32" fill="${col}" fill-opacity=".42"/>
      <polygon points="4,12 48,12 48,22 4,22" fill="${col}" fill-opacity=".55"/>
      <line x1="26" y1="2"  x2="26" y2="42" stroke="#000" stroke-width="1.0" stroke-opacity=".3"/>
    </svg>`;
    },
    createMesh(col) {
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(CELL * 0.2, CELL * 2, CELL),
        new THREE.MeshStandardMaterial({ color: new THREE.Color(col), roughness: 0.75 })
      );
      m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), makeOutlineMat()));
      m.userData.shapeTypeId = 'wall';
      return m;
    },
  },

  /* ── Building (2×1×1 block) ─ */
  {
    id: 'building',
    label: 'Building',
    accentColor: '#c04040',
    iconSVG(col) {
      return `<svg viewBox="0 0 52 44" xmlns="http://www.w3.org/2000/svg">
      <polygon points="20,2 40 10 20 18 0 10" fill="${col}" fill-opacity=".92"/>
      <polygon points="0,10  20,18 20,44 0,36" fill="${col}" fill-opacity=".60"/>
      <polygon points="40,10 20,18 20,44 40,36" fill="${col}" fill-opacity=".45"/>
      <polygon points="20,2 40,10 20,18 0,10" fill="none" stroke="#000" stroke-width="1.2"/>
      <polygon points="0,10  20,18 20,44 0,36" fill="none" stroke="#000" stroke-width="1.2"/>
      <polygon points="40,10 20,18 20,44 40,36" fill="none" stroke="#000" stroke-width="1.2"/>
    </svg>`;
    },
    createMesh(col) {
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(CELL * 2, CELL * 1, CELL),
        new THREE.MeshStandardMaterial({ color: new THREE.Color(col), roughness: 0.7 })
      );
      m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), makeOutlineMat()));
      m.userData.shapeTypeId = 'building';
      return m;
    },
  },

  /* ── Arch / doorway ─ */
  {
    id: 'arch',
    label: 'Arch',
    accentColor: '#b08860',
    iconSVG(col) {
      return `<svg viewBox="0 0 52 44" xmlns="http://www.w3.org/2000/svg">
      <path d="M2,42 L8,42 L8,18 Q26,2 44,18 L44,42 L50,42" fill="none" stroke="${col}" stroke-width="5" stroke-linecap="round"/>
      <path d="M2,42 L8,42 L8,18 Q26,2 44,18 L44,42 L50,42" fill="none" stroke="#000" stroke-width="1.2" stroke-opacity=".3"/>
    </svg>`;
    },
    createMesh(col) {
      const g = makeArchGeometry(CELL, CELL, CELL);
      const m = new THREE.Mesh(g,
        new THREE.MeshStandardMaterial({ color: new THREE.Color(col), roughness: 0.75 }));
      m.add(new THREE.LineSegments(new THREE.EdgesGeometry(g), makeOutlineMat()));
      m.userData.shapeTypeId = 'arch';
      return m;
    },
  },
];

/* ── Arch geometry builder ─────────────────────────────────────────── */
/**
 * Builds a rectangular arch doorway BufferGeometry (similar to three_iso_arch1.html).
 * w = width in scene units, h = height, l = thickness (depth along Z).
 */
function makeArchGeometry(w, h, l) {
  const x0 = -w / 2, x1 = w / 2;
  const z0 = -l / 2, z1 = l / 2;

  const pillarW = Math.max(0.4, w * 0.22);
  const lintelH = Math.max(0.3, h * 0.22);
  const openingTop = h - lintelH;

  const verts = [], uvs = [];

  function pushQuad(p1, p2, p3, p4) {
    verts.push(...p1, ...p2, ...p3); uvs.push(0, 0, 1, 0, 1, 1);
    verts.push(...p1, ...p3, ...p4); uvs.push(0, 0, 1, 1, 0, 1);
  }

  pushQuad([x0, 0, z1], [x0 + pillarW, 0, z1], [x0 + pillarW, openingTop, z1], [x0, openingTop, z1]);
  pushQuad([x1 - pillarW, 0, z1], [x1, 0, z1], [x1, openingTop, z1], [x1 - pillarW, openingTop, z1]);
  pushQuad([x0, openingTop, z1], [x1, openingTop, z1], [x1, h, z1], [x0, h, z1]);

  pushQuad([x0 + pillarW, 0, z0], [x0, 0, z0], [x0, openingTop, z0], [x0 + pillarW, openingTop, z0]);
  pushQuad([x1, 0, z0], [x1 - pillarW, 0, z0], [x1 - pillarW, openingTop, z0], [x1, openingTop, z0]);
  pushQuad([x1, openingTop, z0], [x0, openingTop, z0], [x0, h, z0], [x1, h, z0]);

  pushQuad([x0, 0, z0], [x0, 0, z1], [x0, h, z1], [x0, h, z0]);
  pushQuad([x1, 0, z1], [x1, 0, z0], [x1, h, z0], [x1, h, z1]);
  pushQuad([x0, h, z1], [x1, h, z1], [x1, h, z0], [x0, h, z0]);

  pushQuad([x0 + pillarW, 0, z1], [x0 + pillarW, 0, z0], [x0 + pillarW, openingTop, z0], [x0 + pillarW, openingTop, z1]);
  pushQuad([x1 - pillarW, 0, z0], [x1 - pillarW, 0, z1], [x1 - pillarW, openingTop, z1], [x1 - pillarW, openingTop, z0]);
  pushQuad([x0 + pillarW, openingTop, z0], [x1 - pillarW, openingTop, z0], [x1 - pillarW, openingTop, z1], [x0 + pillarW, openingTop, z1]);

  pushQuad([x0, 0, z0], [x0, 0, z1], [x0 + pillarW, 0, z1], [x0 + pillarW, 0, z0]);
  pushQuad([x1 - pillarW, 0, z0], [x1 - pillarW, 0, z1], [x1, 0, z1], [x1, 0, z0]);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));
  geo.computeVertexNormals();
  return geo;
}

/** ── Helpers ──────────────────────────────────────────────────────── */

export function getShapeType(id) { return SHAPE_TYPES.find(s => s.id === id); }
export function allShapeTypes() { return SHAPE_TYPES; }
