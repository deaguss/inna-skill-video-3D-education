import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { buatKarakter } from './karakter.js';
import { buatDunia } from './dunia.js';
import { buatCerita, WARNA } from './cerita.js';
import { gambarKhusus } from './overlay.js';

const W = 720;
const H = 1280;
const FPS = 30;
const SHUTTER = 0.5;
const param = new URLSearchParams(location.search);
const RINGAN = param.has('ringan');
const SKALA = Number(param.get('skala') || 1);
const RW = Math.round(W * SKALA);
const RH = Math.round(H * SKALA);

const naskah = await (await fetch('/naskah.json')).json();
const cerita = buatCerita(naskah);

const kanvas = document.createElement('canvas');
const renderer = new THREE.WebGLRenderer({ canvas: kanvas, antialias: false, preserveDrawingBuffer: true });
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

const kunci = new THREE.DirectionalLight('#ffe7c9', 2.6);
const POS_KUNCI = new THREE.Vector3(-3.4, 6.2, 7);
kunci.position.copy(POS_KUNCI);
kunci.target.position.set(0, 1, 0.8);
kunci.castShadow = true;
kunci.shadow.mapSize.setScalar(RINGAN ? 1024 : 2048);
Object.assign(kunci.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 22 });
kunci.shadow.bias = -0.0004;
kunci.shadow.normalBias = 0.02;
scene.add(kunci, kunci.target);

const tepi = new THREE.DirectionalLight('#8fb8ff', 1.7);
tepi.position.set(3.5, 4.5, -5);
scene.add(tepi);

const dunia = buatDunia(scene);
const raka = buatKarakter({ kulit: '#cf9165', baju: '#e8604a', celana: '#2d3350', rambut: '#262029', gaya: 'jabrik', kursi: true });
const dina = buatKarakter({ kulit: '#dfa97e', baju: '#2fa596', celana: '#39304a', rambut: '#5a2b20', gaya: 'bob', kursi: true, pipi: true });
scene.add(raka.root, dina.root);

const kamera = new THREE.PerspectiveCamera(28, W / H, 0.1, 120);

const rtAdegan = new THREE.WebGLRenderTarget(RW, RH, { type: THREE.HalfFloatType });
const rtAkum = new THREE.WebGLRenderTarget(RW, RH, { type: THREE.HalfFloatType, depthBuffer: false });

const vertex = 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }';
const matAkum = new THREE.ShaderMaterial({
  uniforms: { t: { value: rtAdegan.texture }, bobot: { value: 1 } },
  vertexShader: vertex,
  fragmentShader: 'uniform sampler2D t; uniform float bobot; varying vec2 vUv; void main(){ gl_FragColor=vec4(texture2D(t,vUv).rgb*bobot,1.); }',
  blending: THREE.CustomBlending,
  blendEquation: THREE.AddEquation,
  blendSrc: THREE.OneFactor,
  blendDst: THREE.OneFactor,
  depthTest: false,
  depthWrite: false,
  transparent: true,
  toneMapped: false,
});
const matAkhir = new THREE.ShaderMaterial({
  uniforms: { t: { value: rtAkum.texture } },
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
const quadAkum = new FullScreenQuad(matAkum);
const quadAkhir = new FullScreenQuad(matAkhir);

const halton = (i, b) => {
  let f = 1, r = 0;
  while (i > 0) {
    f /= b;
    r += f * (i % b);
    i = Math.floor(i / b);
  }
  return r;
};

function terapkan(k) {
  raka.set(k.raka);
  dina.set(k.dina);
  dunia.aturKoin(k.koin);
  dunia.aturBatang(k.bar[0], k.bar[1]);
  dunia.engsel.rotation.x = k.engsel;
  const tr = k.trade;
  dunia.lampuRaka.intensity = tr === 0 ? 0 : 2.4 + Math.sin(k.koin.waktu * 6) * 0.5;
  dunia.lampuDina.intensity = tr === 0 ? 0 : 1.2;
  kamera.position.set(...k.kamera.pos);
  kamera.lookAt(...k.kamera.target);
  kamera.fov = k.kamera.fov;
  kamera.updateProjectionMatrix();
  kamera.updateMatrixWorld();
}

const kanvasKomposit = document.createElement('canvas');
kanvasKomposit.width = W;
kanvasKomposit.height = H;
document.body.appendChild(kanvasKomposit);
const ctx = kanvasKomposit.getContext('2d');
const FONT = '"Segoe UI", Arial, sans-serif';

function kotakTeks(baris, tengahX, y, ukuran, warnaTeks = '#fff', latar = 'rgba(10,12,20,.72)', tebal = 700) {
  ctx.font = `${tebal} ${ukuran}px ${FONT}`;
  const tinggiBaris = ukuran * 1.26;
  const lebar = Math.max(...baris.map((b) => ctx.measureText(b).width)) + ukuran * 1.0;
  const tinggi = baris.length * tinggiBaris + ukuran * 0.5;
  ctx.fillStyle = latar;
  ctx.beginPath();
  ctx.roundRect(tengahX - lebar / 2, y, lebar, tinggi, ukuran * 0.35);
  ctx.fill();
  ctx.fillStyle = warnaTeks;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  baris.forEach((b, i) => ctx.fillText(b, tengahX, y + ukuran * 0.25 + tinggiBaris * (i + 0.5)));
  return tinggi;
}

function pecahBaris(teks, ukuran, lebarMaks) {
  ctx.font = `700 ${ukuran}px ${FONT}`;
  const kata = teks.split(' ');
  const hasil = [];
  let baris = '';
  for (const k of kata) {
    const coba = baris ? `${baris} ${k}` : k;
    if (ctx.measureText(coba).width > lebarMaks && baris) {
      hasil.push(baris);
      baris = k;
    } else baris = coba;
  }
  if (baris) hasil.push(baris);
  return hasil;
}

const proyeksi = (x, y, z) => {
  const v = new THREE.Vector3(x, y, z).project(kamera);
  return [((v.x + 1) / 2) * W, ((1 - v.y) / 2) * H];
};
const halus = (a, b, x) => {
  const u = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return u * u * (3 - 2 * u);
};
const rp = (v) => `Rp${v.toFixed(1).replace('.', ',')} jt`;

function pop(u) {
  const e = Math.min(1, Math.max(0, u));
  return e === 0 ? 0 : 1 + 2.2 * (e - 1) ** 3 + 1.2 * (e - 1) ** 2;
}

function gambarOverlay(k, t) {
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(kanvas, 0, 0, W, H);
  const { a, lokal } = k;

  gambarKhusus({ ctx, kotakTeks, proyeksi, halus, pop, rp, W, FONT, WARNA, cerita }, k);

  const sisa = a.durasi - lokal;
  if (t < cerita.akhirCerita) {
    ctx.globalAlpha = halus(0, 0.08, lokal) * halus(0, 0.08, sisa + 0.08);
    const baris = pecahBaris(a.subtitle, 35, 610);
    kotakTeks(baris, W / 2, 150, 35);
    ctx.globalAlpha = 1;
  }

  const gelap = halus(cerita.akhirCerita - 0.55, cerita.akhirCerita + 0.15, t);
  if (gelap > 0) {
    ctx.fillStyle = `rgba(5,7,14,${gelap})`;
    ctx.fillRect(0, 0, W, H);
    const m = halus(cerita.akhirCerita + 0.1, cerita.akhirCerita + 0.5, t);
    if (m > 0) {
      ctx.globalAlpha = m;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffd27a';
      ctx.font = `800 52px ${FONT}`;
      ctx.fillText('Sinyal sama, hasil beda.', W / 2, 510);
      ctx.fillStyle = '#cdd4e3';
      const uk = 28;
      const baris = pecahBaris(naskah.penutup_layar, uk, 580);
      ctx.font = `500 ${uk}px ${FONT}`;
      baris.forEach((b, i) => ctx.fillText(b, W / 2, 610 + i * uk * 1.45));
      ctx.globalAlpha = 1;
    }
  }
}

function render(i, N) {
  const t = i / FPS;
  const pusat = cerita.keadaan(t);
  dunia.monitorRaka.gambar(cerita.kurvaRaka, pusat.trade);
  dunia.monitorDina.gambar(cerita.kurvaDina, pusat.trade);

  renderer.setRenderTarget(rtAkum);
  renderer.setClearColor(0x000000, 1);
  renderer.clear();
  matAkum.uniforms.bobot.value = 1 / N;

  const lensa = new THREE.Matrix4();
  const dasarP = new THREE.Matrix4();
  for (let s = 0; s < N; s++) {
    const ts = t + ((s + 0.5) / N - 0.5) * (SHUTTER / FPS);
    const k = cerita.keadaan(ts);
    terapkan(k);

    const hx = halton(s + 1, 2);
    const hy = halton(s + 1, 3);
    const r = Math.sqrt(hx) * (N >= 6 ? k.kamera.ap : 0);
    const sudut = hy * Math.PI * 2;
    const ox = Math.cos(sudut) * r;
    const oy = Math.sin(sudut) * r;
    const fokus = new THREE.Vector3(...k.kamera.target).distanceTo(kamera.position);

    kamera.translateX(ox);
    kamera.translateY(oy);
    kamera.updateMatrixWorld();
    dasarP.copy(kamera.projectionMatrix);
    lensa.identity();
    lensa.elements[8] = ox / fokus;
    lensa.elements[9] = oy / fokus;
    kamera.projectionMatrix.multiplyMatrices(dasarP, lensa);
    kamera.projectionMatrix.elements[8] += (2 * (halton(s + 1, 5) - 0.5)) / RW;
    kamera.projectionMatrix.elements[9] += (2 * (halton(s + 1, 7) - 0.5)) / RH;
    kamera.projectionMatrixInverse.copy(kamera.projectionMatrix).invert();

    kunci.position.copy(POS_KUNCI);
    if (N >= 6) {
      kunci.position.x += (halton(s + 1, 11) - 0.5) * 1.1;
      kunci.position.z += (halton(s + 1, 13) - 0.5) * 1.1;
    }

    renderer.setRenderTarget(rtAdegan);
    renderer.autoClear = true;
    renderer.render(scene, kamera);
    renderer.getContext().finish();

    renderer.setRenderTarget(rtAkum);
    renderer.autoClear = false;
    quadAkum.render(renderer);
    renderer.autoClear = true;
  }

  renderer.setRenderTarget(null);
  quadAkhir.render(renderer);

  terapkan(pusat);
  gambarOverlay(pusat, t);
  return kanvasKomposit.toDataURL('image/png');
}

window.renderFrame = render;
window.infoCerita = {
  total: cerita.total,
  fps: FPS,
  adegan: cerita.adegan.map((a) => ({ id: a.id, mulai: +a.mulai.toFixed(2), durasi: +a.durasi.toFixed(2) })),
  gpu: (() => {
    const gl = renderer.getContext();
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  })(),
};
window.siap = true;
