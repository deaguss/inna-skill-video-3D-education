import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { makeCharacter } from './characters.js';
import { makeWorld } from './world.js';
import { makeStory } from './story.js';
import { drawOverlays } from './overlay.js';

const W = 720;
const H = 1280;
const FPS = 30;
const SHUTTER = 0.5;
const param = new URLSearchParams(location.search);
const LIGHT = param.has('light');
const SCALE = Number(param.get('scale') || 1);
const RW = Math.round(W * SCALE);
const RH = Math.round(H * SCALE);

const script = await (await fetch('/script.json')).json();
const story = makeStory(script);

const canvas = document.createElement('canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
renderer.setSize(RW, RH, false);
renderer.setPixelRatio(1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#05070e');
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.5;

const keyLight = new THREE.DirectionalLight('#ffe7c9', 2.6);
const KEY_LIGHT_POS = new THREE.Vector3(-3.4, 6.2, 7);
keyLight.position.copy(KEY_LIGHT_POS);
keyLight.target.position.set(0, 1, 0.8);
keyLight.castShadow = true;
keyLight.shadow.mapSize.setScalar(LIGHT ? 1024 : 2048);
Object.assign(keyLight.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 22 });
keyLight.shadow.bias = -0.0004;
keyLight.shadow.normalBias = 0.02;
scene.add(keyLight, keyLight.target);

const rimLight = new THREE.DirectionalLight('#8fb8ff', 1.7);
rimLight.position.set(3.5, 4.5, -5);
scene.add(rimLight);

const world = makeWorld(scene, script);
const characters = {};
for (const [id, member] of Object.entries(story.cast)) {
  characters[id] = makeCharacter({
    skin: member.skin,
    shirt: member.shirt,
    pants: member.pants,
    hair: member.hair,
    style: member.hairStyle,
    cheeks: member.cheeks,
    chair: true,
  });
  scene.add(characters[id].root);
}

const camera = new THREE.PerspectiveCamera(28, W / H, 0.1, 120);

const rtScene = new THREE.WebGLRenderTarget(RW, RH, { type: THREE.HalfFloatType });
const rtAccum = new THREE.WebGLRenderTarget(RW, RH, { type: THREE.HalfFloatType, depthBuffer: false });

const vertex = 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }';
const matAccum = new THREE.ShaderMaterial({
  uniforms: { t: { value: rtScene.texture }, blendWeight: { value: 1 } },
  vertexShader: vertex,
  fragmentShader: 'uniform sampler2D t; uniform float blendWeight; varying vec2 vUv; void main(){ gl_FragColor=vec4(texture2D(t,vUv).rgb*blendWeight,1.); }',
  blending: THREE.CustomBlending,
  blendEquation: THREE.AddEquation,
  blendSrc: THREE.OneFactor,
  blendDst: THREE.OneFactor,
  depthTest: false,
  depthWrite: false,
  transparent: true,
  toneMapped: false,
});
const matFinal = new THREE.ShaderMaterial({
  uniforms: { t: { value: rtAccum.texture } },
  vertexShader: vertex,
  fragmentShader: `uniform sampler2D t; varying vec2 vUv;
    void main(){
      vec3 c=texture2D(t,vUv).rgb;
      vec2 d=vUv-.5; d.x*=.75;
      c*=1.-smoothstep(.32,.82,length(d))*.5;
      gl_FragColor=vec4(c,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
  depthTest: false,
  depthWrite: false,
});
const quadAccum = new FullScreenQuad(matAccum);
const quadFinal = new FullScreenQuad(matFinal);

const halton = (i, b) => {
  let f = 1, r = 0;
  while (i > 0) {
    f /= b;
    r += f * (i % b);
    i = Math.floor(i / b);
  }
  return r;
};

function applyState(state) {
  for (const [id, character] of Object.entries(characters)) character.set(state.poses[id]);
  world.updateProps(state);
  camera.position.set(...state.camera.pos);
  camera.lookAt(...state.camera.target);
  camera.fov = state.camera.fov;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
}

const compositeCanvas = document.createElement('canvas');
compositeCanvas.width = W;
compositeCanvas.height = H;
document.body.appendChild(compositeCanvas);
const ctx = compositeCanvas.getContext('2d');
const FONT = '"Segoe UI", Arial, sans-serif';

function textBox(lines, centerX, y, size, textColor = '#fff', bg = 'rgba(10,12,20,.72)', fontWeight = 700) {
  ctx.font = `${fontWeight} ${size}px ${FONT}`;
  const lineHeight = size * 1.26;
  const width = Math.max(...lines.map((b) => ctx.measureText(b).width)) + size;
  const height = lines.length * lineHeight + size * 0.5;
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(centerX - width / 2, y, width, height, size * 0.35);
  ctx.fill();
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach((b, i) => ctx.fillText(b, centerX, y + size * 0.25 + lineHeight * (i + 0.5)));
}

function wrapLines(text, size, maxWidth, weight = 700) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    const trial = line ? `${line} ${word}` : word;
    if (ctx.measureText(trial).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = trial;
  }
  if (line) lines.push(line);
  return lines;
}

const project = (x, y, z) => {
  const v = new THREE.Vector3(x, y, z).project(camera);
  return [((v.x + 1) / 2) * W, ((1 - v.y) / 2) * H];
};
const smooth = (a, b, x) => {
  const u = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return u * u * (3 - 2 * u);
};
function pop(u) {
  const e = Math.min(1, Math.max(0, u));
  return e === 0 ? 0 : 1 + 2.2 * (e - 1) ** 3 + 1.2 * (e - 1) ** 2;
}

function drawFrame(state, t) {
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(canvas, 0, 0, W, H);
  const { scene: current, local } = state;
  drawOverlays({ ctx, textBox, wrapLines, project, pop, W, FONT, cast: story.cast, HEAD_Y: story.HEAD_Y }, state);

  if (t < story.storyEnd && current.subtitle) {
    const remaining = current.duration - local;
    ctx.globalAlpha = smooth(0, 0.08, local) * smooth(0, 0.08, remaining + 0.08);
    textBox(wrapLines(current.subtitle, 35, 610), W / 2, 150, 35);
    ctx.globalAlpha = 1;
  }

  const fade = smooth(story.storyEnd - 0.55, story.storyEnd + 0.15, t);
  if (fade > 0) {
    ctx.fillStyle = `rgba(5,7,14,${fade})`;
    ctx.fillRect(0, 0, W, H);
    const m = smooth(story.storyEnd + 0.1, story.storyEnd + 0.5, t);
    if (m > 0) {
      ctx.globalAlpha = m;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffd27a';
      const title = wrapLines(script.end_title || script.title, 52, 620, 800);
      ctx.font = `800 52px ${FONT}`;
      title.forEach((b, i) => ctx.fillText(b, W / 2, 510 + i * 64));
      const size = 28;
      const body = wrapLines(script.end_card || '', size, 580, 500);
      ctx.fillStyle = '#cdd4e3';
      ctx.font = `500 ${size}px ${FONT}`;
      const top = 530 + title.length * 64;
      body.forEach((b, i) => ctx.fillText(b, W / 2, top + i * size * 1.45));
      ctx.globalAlpha = 1;
    }
  }
}

function render(i, N) {
  const t = i / FPS;
  renderer.setRenderTarget(rtAccum);
  renderer.setClearColor(0x000000, 1);
  renderer.clear();
  matAccum.uniforms.blendWeight.value = 1 / N;

  const lens = new THREE.Matrix4();
  const baseProj = new THREE.Matrix4();
  for (let s = 0; s < N; s++) {
    const ts = t + ((s + 0.5) / N - 0.5) * (SHUTTER / FPS);
    const state = story.stateAt(ts);
    applyState(state);

    const r = Math.sqrt(halton(s + 1, 2)) * (N >= 6 ? state.camera.ap : 0);
    const angle = halton(s + 1, 3) * Math.PI * 2;
    const ox = Math.cos(angle) * r;
    const oy = Math.sin(angle) * r;
    const focus = new THREE.Vector3(...state.camera.target).distanceTo(camera.position);

    camera.translateX(ox);
    camera.translateY(oy);
    camera.updateMatrixWorld();
    baseProj.copy(camera.projectionMatrix);
    lens.identity();
    lens.elements[8] = ox / focus;
    lens.elements[9] = oy / focus;
    camera.projectionMatrix.multiplyMatrices(baseProj, lens);
    camera.projectionMatrix.elements[8] += (2 * (halton(s + 1, 5) - 0.5)) / RW;
    camera.projectionMatrix.elements[9] += (2 * (halton(s + 1, 7) - 0.5)) / RH;
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();

    keyLight.position.copy(KEY_LIGHT_POS);
    if (N >= 6) {
      keyLight.position.x += (halton(s + 1, 11) - 0.5) * 1.1;
      keyLight.position.z += (halton(s + 1, 13) - 0.5) * 1.1;
    }

    renderer.setRenderTarget(rtScene);
    renderer.autoClear = true;
    renderer.render(scene, camera);
    renderer.getContext().finish();

    renderer.setRenderTarget(rtAccum);
    renderer.autoClear = false;
    quadAccum.render(renderer);
    renderer.autoClear = true;
  }

  renderer.setRenderTarget(null);
  quadFinal.render(renderer);

  const center = story.stateAt(t);
  applyState(center);
  drawFrame(center, t);
  return compositeCanvas.toDataURL('image/png');
}

window.renderFrame = render;
window.storyInfo = {
  total: story.total,
  fps: FPS,
  scenes: story.scenes.map((s) => ({ id: s.id, start: +s.start.toFixed(2), duration: +s.duration.toFixed(2) })),
  gpu: (() => {
    const gl = renderer.getContext();
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  })(),
};
window.ready = true;
