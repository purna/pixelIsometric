import * as THREE from 'three';
import { DITHER_GLSL } from './shader-source.js';

function makeOutlineMat(color = 0x000000) {
  return new THREE.LineBasicMaterial({ color });
}

export function createCubeMaterial(mode = 0) {
  const uniforms = {
    baseColor:  { value: new THREE.Color('#8a7a60') },
    colorA:     { value: new THREE.Color('#3ecfb2') },
    colorB:     { value: new THREE.Color('#c94b6e') },
    splitY:     { value: 0.0 },
    materialMode: { value: mode },
    tMode:    { value: 4 }, tInkMode: { value: 0 }, tInkColor: { value: new THREE.Color('#ffffff') },
    tSpace:   { value: 6.0 }, tThick: { value: 1.0 }, tBright: { value: 1.0 }, tAlpha: { value: 0.5 },
    bMode:    { value: 1 }, bInkMode: { value: 0 }, bInkColor: { value: new THREE.Color('#000000') },
    bSpace:   { value: 4.0 }, bThick: { value: 1.0 }, bBright: { value: -1.0 }, bAlpha: { value: 0.7 }
  };

  const mat = new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0.1, transparent: mode === 2, opacity: mode === 2 ? 0.6 : 1.0 });
  mat.onBeforeCompile = (shader) => {
    for (const [k, v] of Object.entries(uniforms)) shader.uniforms[k] = v;

    shader.vertexShader = `
      varying float vLocalY;
      varying vec2 myUv;
      ${shader.vertexShader}
    `.replace(`#include <begin_vertex>`, `#include <begin_vertex>
      vLocalY = position.y;
      myUv = uv;`);

    shader.fragmentShader = `
      uniform vec3 baseColor; uniform vec3 colorA; uniform vec3 colorB; uniform float splitY; uniform int materialMode;
      uniform int tMode; uniform int tInkMode; uniform vec3 tInkColor; uniform float tSpace; uniform float tThick; uniform float tBright; uniform float tAlpha;
      uniform int bMode; uniform int bInkMode; uniform vec3 bInkColor; uniform float bSpace; uniform float bThick; uniform float bBright; uniform float bAlpha;
      varying float vLocalY;
      varying vec2 myUv;
      ${shader.fragmentShader}
    `;

    shader.fragmentShader = shader.fragmentShader.replace(
      `vec4 diffuseColor = vec4( diffuse, opacity );`,
      `
      bool isTop = true;
      vec3 overlayCol = colorA;

      if (materialMode == 0) {
        isTop = vLocalY > splitY;
        overlayCol = isTop ? colorA : colorB;
      } else if (materialMode == 1) {
        overlayCol = colorA;
      }

      vec3 finalColor = mix(baseColor, overlayCol, 0.55);
      vec4 diffuseColor = vec4( finalColor, opacity );
      `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      `#include <dithering_fragment>`,
      `#include <dithering_fragment>

      int dMode = isTop ? tMode : bMode;
      int dInkMode = isTop ? tInkMode : bInkMode;
      vec3 dInkColor = isTop ? tInkColor : bInkColor;
      float dSpace = isTop ? tSpace : bSpace;
      float dThick = isTop ? tThick : bThick;
      float dBright = isTop ? tBright : bBright;
      float dAlpha = isTop ? tAlpha : bAlpha;

      if (dMode > 0) {
        bool isDither = false;
        vec2 scaledUv = myUv * (100.0 / dSpace);
        float lineThreshold = dThick / dSpace;

        if (dMode == 1) {
          vec2 gridUv = floor(scaledUv);
          float noise = fract(sin(dot(gridUv, vec2(12.9898, 78.233))) * 43758.5453);
          isDither = noise > 0.5;
        } else if (dMode == 2) {
          isDither = fract(scaledUv.y) < lineThreshold;
        } else if (dMode == 3) {
          isDither = fract(scaledUv.x) < lineThreshold;
        } else if (dMode == 4) {
          isDither = (fract(scaledUv.y) < lineThreshold) || (fract(scaledUv.x) < lineThreshold);
        }

        if (isDither) {
          vec3 targetCol;
          if (dInkMode == 1) {
            float baseLum = dot(overlayCol, vec3(0.299, 0.587, 0.114));
            float fragLum = dot(gl_FragColor.rgb, vec3(0.299, 0.587, 0.114));
            float lightingScale = fragLum / max(baseLum, 0.001);
            targetCol = dInkColor * lightingScale;
          } else {
            vec3 brightShift = dBright > 0.0 ? vec3(1.0) : vec3(0.0);
            targetCol = mix(gl_FragColor.rgb, brightShift, abs(dBright));
          }
          gl_FragColor.rgb = mix(gl_FragColor.rgb, targetCol, dAlpha);
        }
      }
      `
    );
  };

  mat.userData = { materialType: 'cube', uniforms: uniforms };
  return mat;
}

export function createWaterMaterial() {
  const mat = new THREE.MeshStandardMaterial({
    color: 0x33b5e5, transparent: true, opacity: 0.5,
    roughness: 0.1, metalness: 0.1
  });
  mat.userData = { materialType: 'water' };
  return mat;
}

export function createRiverMaterial() {
  const mat = new THREE.MeshStandardMaterial({
    color: 0x4ba3c9, transparent: true, opacity: 0.7,
    roughness: 0.1, metalness: 0.05
  });
  mat.userData = { materialType: 'river' };
  return mat;
}

export function copyCubeMaterialUniforms(src, dst) {
  if (!src.userData?.uniforms || !dst.userData?.uniforms) return;
  const su = src.userData.uniforms;
  const du = dst.userData.uniforms;
  const keys = Object.keys(su);
  for (const k of keys) {
    if (k === 'pStart' || k === 'pEnd') {
      du[k].value.copy(su[k].value);
    } else if (Array.isArray(su[k].value)) {
      du[k].value.set(...su[k].value);
    } else if (typeof su[k].value.clone === 'function') {
      du[k].value.copy(su[k].value);
    } else {
      du[k].value = su[k].value;
    }
  }
}
