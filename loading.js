import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const preloader = document.getElementById("preloader");
const veil = document.getElementById("preloaderVeil");
const canvas = document.getElementById("loadingCanvas");
const gearsCanvas = document.getElementById("gearsCanvas");
const pill = document.getElementById("preloaderPill");
const statusEl = document.getElementById("preloaderStatus");
const percentEl = document.getElementById("preloaderPercent");
const streak = document.getElementById("preloaderSweep");
const eyeMask = document.getElementById("eyeMask");
const eyeMaskRect = document.getElementById("eyeMaskRect");
const eyeHole = document.getElementById("eyeHole");

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const EYE = [
  [0.0024, 0.2141],
  [0.086, 0.2414],
  [0.1696, 0.2149],
  [0.0727, 0.1849],
];
const PERCENT_KEYS = [
  [0, 0], [0.67, 3], [1.5, 14], [2.33, 22], [3.17, 31], [3.67, 33],
  [4.67, 48], [5.5, 57], [6.17, 61], [7, 74], [7.67, 83], [8.27, 91],
  [8.73, 98], [8.97, 100],
];

const deg = (n) => (n * Math.PI) / 180;
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smoothstep = (x) => {
  x = clamp01(x);
  return x * x * (3 - 2 * x);
};

function percentAt(t) {
  if (t <= PERCENT_KEYS[0][0]) return 0;
  const last = PERCENT_KEYS[PERCENT_KEYS.length - 1];
  if (t >= last[0]) return 100;
  let i = 0;
  while (t > PERCENT_KEYS[i + 1][0]) i += 1;
  const [t0, p0] = PERCENT_KEYS[i];
  const [t1, p1] = PERCENT_KEYS[i + 1];
  return Math.round(p0 + (p1 - p0) * smoothstep((t - t0) / (t1 - t0)));
}

function spinAngle(t) {
  if (t < 7) return deg(90 * t);
  if (t < 9) {
    const u = (t - 7) / 2;
    return deg(630 + 90 * (1 - (1 - u) ** 2));
  }
  return deg(720);
}

const eyeUniform = { value: new THREE.Matrix4() };

function patchEye(material) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.eyeLockupInverse = eyeUniform;
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform mat4 eyeLockupInverse;\nvarying vec3 vEyeLocal;"
      )
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvEyeLocal = (eyeLockupInverse * modelMatrix * vec4(transformed, 1.0)).xyz;"
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
varying vec3 vEyeLocal;
bool insideEye(vec2 p) {
  vec2 a = vec2(0.0024, 0.2141);
  vec2 b = vec2(0.0860, 0.2414);
  vec2 c = vec2(0.1696, 0.2149);
  vec2 d = vec2(0.0727, 0.1849);
  float c1 = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
  float c2 = (c.x - b.x) * (p.y - b.y) - (c.y - b.y) * (p.x - b.x);
  float c3 = (d.x - c.x) * (p.y - c.y) - (d.y - c.y) * (p.x - c.x);
  float c4 = (a.x - d.x) * (p.y - d.y) - (a.y - d.y) * (p.x - d.x);
  return (c1 >= 0.0 && c2 >= 0.0 && c3 >= 0.0 && c4 >= 0.0)
      || (c1 <= 0.0 && c2 <= 0.0 && c3 <= 0.0 && c4 <= 0.0);
}`
      )
      .replace(
        "#include <clipping_planes_fragment>",
        "#include <clipping_planes_fragment>\nif (insideEye(vEyeLocal.xy)) discard;"
      );
  };
  material.needsUpdate = true;
}

function addLights(scene) {
  scene.add(new THREE.AmbientLight(0xffffff, 0.15));
  const key = new THREE.DirectionalLight(0xffffff, 3.6);
  key.position.set(-0.55, 0.6, 0.75);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffcc99, 1.5);
  rim.position.set(0.9, 0.15, -0.35);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffffff, 0.45);
  fill.position.set(0.4, -0.3, 0.8);
  scene.add(fill);
}

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});
renderer.setClearColor(0x000000, 0);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(88, 1, 0.003, 100);
camera.position.set(0, 0, 6.66);
addLights(scene);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const gearsRenderer = new THREE.WebGLRenderer({
  canvas: gearsCanvas,
  antialias: true,
  alpha: true,
});
gearsRenderer.setClearColor(0x000000, 0);
gearsRenderer.setPixelRatio(Math.min(devicePixelRatio, 2));
gearsRenderer.setSize(36, 36, false);
gearsRenderer.outputColorSpace = THREE.SRGBColorSpace;
const gearsScene = new THREE.Scene();
gearsScene.environment = scene.environment;
const gearsCamera = new THREE.PerspectiveCamera(35, 1, 0.01, 50);
addLights(gearsScene);

const loader = new GLTFLoader();
const tipL = new THREE.Vector3();
const tipR = new THREE.Vector3();
const bottom = new THREE.Vector3();
let lockup = null;
let mixer = null;
let tipOffset = new THREE.Vector3();
let halfWidth = 1;
let bottomLocal = new THREE.Vector3(0, -1.08, 0);
let startedAt = 0;
let last = 0;
let finished = false;

function resize() {
  const w = innerWidth;
  const h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  eyeMask.setAttribute("width", w);
  eyeMask.setAttribute("height", h);
  eyeMaskRect.setAttribute("width", w);
  eyeMaskRect.setAttribute("height", h);
}

function projectToScreen(v) {
  const p = v.clone().project(camera);
  return {
    x: ((p.x + 1) / 2) * innerWidth,
    y: ((1 - p.y) / 2) * innerHeight,
    behind: p.z > 1,
  };
}

function updateEyeHole() {
  const pts = [];
  for (const [x, y] of EYE) {
    const p = new THREE.Vector3(x, y, 0);
    lockup.localToWorld(p);
    const s = projectToScreen(p);
    if (s.behind) {
      veil.style.mask = "";
      veil.style.webkitMask = "";
      return;
    }
    pts.push(`${s.x},${s.y}`);
  }
  eyeHole.setAttribute("points", pts.join(" "));
  veil.style.mask = "url(#eyeMask)";
  veil.style.webkitMask = "url(#eyeMask)";
}

function updateStreak() {
  tipL.set(tipOffset.x - halfWidth, tipOffset.y, tipOffset.z);
  tipR.set(tipOffset.x + halfWidth, tipOffset.y, tipOffset.z);
  lockup.localToWorld(tipL);
  lockup.localToWorld(tipR);
  const near = tipL.z > tipR.z ? tipL : tipR;
  const s = projectToScreen(near);
  const text = statusEl.getBoundingClientRect();
  streak.style.setProperty("--x", `${s.x - text.left - 8}px`);
}

function placePill() {
  bottom.copy(bottomLocal);
  lockup.localToWorld(bottom);
  const s = projectToScreen(bottom);
  pill.style.top = `${s.y + 20}px`;
}

function finish() {
  if (finished) return;
  finished = true;
  preloader.classList.add("is-done");
  setTimeout(() => preloader.remove(), 600);
}

function frame(now) {
  if (finished) return;
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const t = (now - startedAt) / 1000;

  if (reduceMotion) {
    lockup.rotation.y = 0;
    percentEl.textContent = `${percentAt(Math.min(t, 8.97) * (8.97 / 1.5))}%`;
    if (t > 1.5) pill.style.opacity = String(1 - smoothstep((t - 1.5) / 0.6));
    if (t > 2.1) finish();
    eyeUniform.value.copy(lockup.matrixWorld).invert();
    renderer.render(scene, camera);
    if (mixer) mixer.update(dt);
    gearsRenderer.render(gearsScene, gearsCamera);
    return;
  }

  lockup.rotation.y = spinAngle(t);
  camera.position.set(0, 0, 6.66);

  if (t < 9) {
    percentEl.textContent = `${percentAt(t)}%`;
    streak.style.opacity = "1";
    pill.style.opacity = "1";
    veil.style.mask = "";
    veil.style.webkitMask = "";
  } else if (t < 9.6) {
    percentEl.textContent = "100%";
    streak.style.opacity = "0";
    pill.style.opacity = String(1 - smoothstep((t - 9) / 0.6));
  } else {
    streak.style.opacity = "0";
    pill.style.opacity = "0";
    if (t < 10) {
      const u = (t - 9.6) / 0.4;
      camera.position.z = 6.66 + 0.24 * smoothstep(u);
    } else if (t < 11.4) {
      const u = (t - 10) / 1.4;
      const s = smoothstep(Math.min(1, u / 0.75));
      camera.position.x = 0.086 * s;
      camera.position.y = 0.796 * s;
      const zt = -0.04;
      const d0 = 6.9 - zt;
      const de = 0.004;
      camera.position.z = zt + d0 * Math.exp(Math.log(de / d0) * u ** 1.5);
      updateEyeHole();
    }
  }

  if (t < 9) updateStreak();
  if (t < 9.6) placePill();
  if (t >= 11.4) finish();

  eyeUniform.value.copy(lockup.matrixWorld).invert();
  renderer.render(scene, camera);
  if (mixer) mixer.update(dt);
  gearsRenderer.render(gearsScene, gearsCamera);
}

function begin() {
  resize();
  window.addEventListener("resize", resize);
  startedAt = performance.now();
  last = startedAt;
  requestAnimationFrame(frame);
}

loader.load("spychalski-lockup-3d-v2.glb", (gltf) => {
  lockup = gltf.scene;
  lockup.position.set(0, 0.583, 0);
  const seen = new Set();
  lockup.traverse((obj) => {
    if (!obj.isMesh) return;
    const list = [].concat(obj.material);
    list.forEach((mat) => {
      if (seen.has(mat)) return;
      seen.add(mat);
      patchEye(mat);
    });
  });
  scene.add(lockup);
  lockup.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(lockup);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  lockup.worldToLocal(center);
  halfWidth = size.x / 2;
  tipOffset.copy(center);
  bottomLocal.set(center.x, center.y - size.y / 2, center.z);
  begin();
});

loader.load("gears-3d-meshing.glb", (gltf) => {
  const model = gltf.scene;
  model.rotation.x = deg(10);
  model.rotation.y = deg(-30);
  gearsScene.add(model);
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const dist = (Math.max(size.x, size.y) / 2) / Math.tan(deg(35) / 2);
  gearsCamera.position.set(center.x, center.y, center.z + dist * 1.15);
  gearsCamera.lookAt(center);
  const clip = THREE.AnimationClip.findByName(gltf.animations, "turn");
  if (clip) {
    mixer = new THREE.AnimationMixer(model);
    const action = mixer.clipAction(clip);
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.play();
    mixer.timeScale = reduceMotion ? 0 : 0.5;
  }
});
