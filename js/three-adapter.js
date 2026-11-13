/**
 * three-adapter.js
 * Three.js scene initialisation: scene, orthographic camera, renderer,
 * ambient + directional light, grid helper, axes helper, raycaster.
 * All runtime references are exported as named members so other
 * modules can import them directly.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const CELL_SIZE = 1;
const GRID_N    = 20;

/* ── Module-level bindings (exported — values assigned in initThree) ── */
export let scene, camera, renderer, controls;
export let raycaster, mouse;
export let gridHelper, axesHelper;
export let ambientLight, directionalLight;
export let drawingPlane;     // alias → interactionPlane (assigned in initThree)
let interactionPlane;         // internal name; drawingPlane mirrors it
let outlineMat, tileOutlineGroup;
let halfGridSize;

export const CELL   = CELL_SIZE;
export const GRID_N_const = GRID_N;
export const CELL_SIZE_const = CELL_SIZE;
export let halfGridSizeValue = 0;

/* ────────────────────────────────────────────────────────────
 * initThree
 * ──────────────────────────────────────────────────────────── */
export function initThree(container, ui) {
  scene = new THREE.Scene();
  scene.background = new THREE.Color('#0d0d10');
  scene.fog        = new THREE.FogExp2('#0d0d10', 0.02);

  // Orthographic isometric camera
  const aspect      = container.clientWidth / container.clientHeight;
  const frustumSize = 14;
  camera = new THREE.OrthographicCamera(
    -frustumSize * aspect / 2,  frustumSize * aspect / 2,
     frustumSize / 2,          -frustumSize / 2,
    1, 1000
  );
  camera.position.set(12, 12, 12);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping  = true;
  controls.dampingFactor  = 0.05;
  controls.enableRotate   = true; // This should be true to allow button-based rotation
  controls.enableZoom     = true;
  controls.enablePan      = false;

  // Add zoomin/zoomOut methods for the floating menu
  controls.zoomIn = function(delta) {
    const zoomSpeed = 0.9;
    camera.zoom = Math.max(0.1, Math.min(5, camera.zoom * zoomSpeed));
    camera.updateProjectionMatrix();
  };
  controls.zoomOut = function(delta) {
    const zoomSpeed = 1.1;
    camera.zoom = Math.max(0.1, Math.min(5, camera.zoom * zoomSpeed));
    camera.updateProjectionMatrix();
  };

  ambientLight    = new THREE.AmbientLight(0xffffff, 0.75);
  scene.add(ambientLight);
  directionalLight = new THREE.DirectionalLight(0xffffff, 0.80);
  directionalLight.position.set(8, 16, 8);
  scene.add(directionalLight);

  gridHelper = new THREE.GridHelper(GRID_N * CELL_SIZE, GRID_N, 0x3ecfb2, 0x1a1a28);
  gridHelper.position.y = -0.01;
  scene.add(gridHelper);

  halfGridSize     = (GRID_N * CELL_SIZE) / 2;
  halfGridSizeValue = halfGridSize;
  outlineMat       = new THREE.LineBasicMaterial({ color: 0x1f1f2e });
  tileOutlineGroup  = new THREE.Group();
  for (let c = 0; c < GRID_N; c++) {
    for (let r = 0; r < GRID_N; r++) {
      const wx  = (c * CELL_SIZE) + CELL_SIZE / 2 - halfGridSize;
      const wz  = (r * CELL_SIZE) + CELL_SIZE / 2 - halfGridSize;
      const hx  = CELL_SIZE / 2;
      const pts = [
        new THREE.Vector3(wx - hx, 0, wz - hx),
        new THREE.Vector3(wx + hx, 0, wz - hx),
        new THREE.Vector3(wx + hx, 0, wz + hx),
        new THREE.Vector3(wx - hx, 0, wz + hx),
        new THREE.Vector3(wx - hx, 0, wz - hx),
      ];
      tileOutlineGroup.add(
        new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), outlineMat)
      );
    }
  }
  scene.add(tileOutlineGroup);

  axesHelper = new THREE.AxesHelper(4);
  scene.add(axesHelper);

  raycaster = new THREE.Raycaster();
  mouse     = new THREE.Vector2();

  // Invisible interaction plane at y = 0
  const planeGeo  = new THREE.PlaneGeometry(GRID_N * CELL_SIZE, GRID_N * CELL_SIZE, 1, 1);
  planeGeo.rotateX(-Math.PI / 2);
  interactionPlane = new THREE.Mesh(planeGeo,
    new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide })
  );
  scene.add(interactionPlane);
  drawingPlane = interactionPlane;   // exported alias

  // Global for any legacy grid-reading code
  window.halfGridSize = halfGridSize;

  return { scene, camera, renderer, controls,
           drawingPlane, gridHelper, axesHelper };
}

/* ────────────────────────────────────────────────────────────
 * resize
 * ──────────────────────────────────────────────────────────── */
export function resize(container) {
  const aspect      = container.clientWidth / container.clientHeight;
  const frustumSize = 14;
  camera.left        = -frustumSize * aspect / 2;
  camera.right       =  frustumSize * aspect / 2;
  camera.top         =  frustumSize / 2;
  camera.bottom      = -frustumSize / 2;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}
