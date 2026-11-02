import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { clay } from './karakter.js';

function acak(benih) {
  let s = benih;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function format(nilai) {
  return `Rp${nilai.toFixed(1).replace('.', ',')} jt`;
}

function buatMonitor(induk, x, yaw, nama) {
  const c = document.createElement('canvas');
  c.width = 640;
  c.height = 400;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;

  const g = new THREE.Group();
  g.position.set(x, 0, 0.5);
  g.rotation.y = yaw;
  induk.add(g);
  const gelap = clay('#16181f', { roughness: 0.4 });
  const body = new THREE.Mesh(new RoundedBoxGeometry(1.14, 0.74, 0.06, 4, 0.025), gelap);
  body.position.y = 1.62;
  body.castShadow = true;
  g.add(body);
  const layar = new THREE.Mesh(
    new THREE.PlaneGeometry(1.06, 0.66),
    new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(1.35, 1.35, 1.35) }),
  );
  layar.position.set(0, 1.62, 0.032);
  g.add(layar);
  const tiang = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.42, 16), gelap);
  tiang.position.y = 1.06;
  g.add(tiang);
  const kaki = new THREE.Mesh(new RoundedBoxGeometry(0.4, 0.025, 0.26, 3, 0.01), gelap);
  kaki.position.y = 0.875;
  kaki.castShadow = true;
  g.add(kaki);

  let terakhir = -1;
  return {
    gambar(kurva, ke) {
      if (ke === terakhir) return;
      terakhir = ke;
      const x2 = c.getContext('2d');
      x2.fillStyle = '#0b0f1a';
      x2.fillRect(0, 0, c.width, c.height);
      const nilai = kurva[ke];
      const warna = ke === 0 ? '#cfd6e6' : nilai >= kurva[0] ? '#3ddc97' : '#ff5a5f';
      x2.fillStyle = '#8b94a8';
      x2.font = '600 26px "Segoe UI", Arial';
      x2.textBaseline = 'alphabetic';
      x2.fillText(`AKUN ${nama}`, 28, 44);
      x2.textAlign = 'right';
      x2.fillText(`Trade ${ke}/10`, c.width - 28, 44);
      x2.textAlign = 'left';
      x2.fillStyle = warna;
      x2.font = '800 78px "Segoe UI", Arial';
      x2.fillText(format(nilai), 26, 124);
      if (ke === 10) {
        const persen = (nilai / kurva[0] - 1) * 100;
        x2.textAlign = 'right';
        x2.font = '800 46px "Segoe UI", Arial';
        const tanda = persen >= 0 ? '+' : '-';
        x2.fillText(`${tanda}${Math.abs(persen).toFixed(1).replace('.', ',')}%`, c.width - 28, 122);
        x2.textAlign = 'left';
      }

      const ax = 30, ay = 150, aw = c.width - 60, ah = 225;
      const skalaY = (v) => ay + ah - (v / 11) * ah;
      x2.strokeStyle = 'rgba(160,170,190,.35)';
      x2.setLineDash([8, 8]);
      x2.lineWidth = 2;
      x2.beginPath();
      x2.moveTo(ax, skalaY(kurva[0]));
      x2.lineTo(ax + aw, skalaY(kurva[0]));
      x2.stroke();
      x2.setLineDash([]);
      x2.strokeStyle = warna;
      x2.lineWidth = 7;
      x2.lineJoin = 'round';
      x2.beginPath();
      for (let i = 0; i <= ke; i++) {
        const px = ax + (i / 10) * aw;
        if (i === 0) x2.moveTo(px, skalaY(kurva[i]));
        else x2.lineTo(px, skalaY(kurva[i]));
      }
      x2.stroke();
      tex.needsUpdate = true;
    },
  };
}

export function buatDunia(scene) {
  const dinding = new THREE.Mesh(new THREE.PlaneGeometry(60, 24), clay('#55617a', { roughness: 0.9 }));
  dinding.position.set(0, 12, -3.2);
  dinding.receiveShadow = true;
  scene.add(dinding);

  const lantai = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), clay('#2c2422', { roughness: 0.55 }));
  lantai.rotation.x = -Math.PI / 2;
  lantai.position.z = 6;
  lantai.receiveShadow = true;
  scene.add(lantai);

  const mMeja = clay('#a3968c', { roughness: 0.5 });
  const meja = new THREE.Mesh(new RoundedBoxGeometry(5.6, 0.09, 1.25, 4, 0.04), mMeja);
  meja.position.set(0, 0.82, 0.85);
  meja.castShadow = true;
  meja.receiveShadow = true;
  scene.add(meja);
  const panel = new THREE.Mesh(new RoundedBoxGeometry(5.5, 0.74, 0.05, 3, 0.02), clay('#6f655e', { roughness: 0.55 }));
  panel.position.set(0, 0.41, 1.4);
  panel.castShadow = true;
  panel.receiveShadow = true;
  scene.add(panel);
  const karpet = new THREE.Mesh(new THREE.CircleGeometry(3.6, 64), clay('#4c3a56', { roughness: 0.9 }));
  karpet.rotation.x = -Math.PI / 2;
  karpet.scale.set(1.5, 0.8, 1);
  karpet.position.set(0, 0.006, 2.7);
  karpet.receiveShadow = true;
  scene.add(karpet);
  const mKaki = clay('#23252d');
  for (const kx of [-2.6, 2.6]) {
    for (const kz of [0.35, 1.35]) {
      const k = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.8, 12), mKaki);
      k.position.set(kx, 0.4, kz);
      k.castShadow = true;
      scene.add(k);
    }
  }

  const monitorRaka = buatMonitor(scene, -1.9, 0.32, 'RAKA');
  const monitorDina = buatMonitor(scene, 1.9, -0.32, 'DINA');

  const mLaptop = clay('#7f8694', { roughness: 0.4, metalness: 0.3 });
  const laptop = new THREE.Group();
  laptop.position.set(-1.25, 0.88, 0.62);
  laptop.rotation.y = 0.35;
  scene.add(laptop);
  const alas = new THREE.Mesh(new RoundedBoxGeometry(0.66, 0.03, 0.44, 3, 0.012), mLaptop);
  alas.castShadow = true;
  laptop.add(alas);
  const engsel = new THREE.Group();
  engsel.position.set(0, 0.012, 0.21);
  laptop.add(engsel);
  const tutup = new THREE.Mesh(new RoundedBoxGeometry(0.66, 0.42, 0.02, 3, 0.009), mLaptop);
  tutup.position.y = 0.21;
  tutup.castShadow = true;
  engsel.add(tutup);

  const mTuts = clay('#2b2e39', { roughness: 0.5 });
  const papan = new THREE.Mesh(new RoundedBoxGeometry(0.72, 0.025, 0.25, 3, 0.01), clay('#1c1e27'));
  papan.position.set(0.95, 0.875, 0.56);
  papan.castShadow = true;
  scene.add(papan);
  const tuts = new THREE.InstancedMesh(new RoundedBoxGeometry(0.05, 0.016, 0.05, 2, 0.006), mTuts, 12 * 4);
  const mx = new THREE.Matrix4();
  for (let i = 0; i < 48; i++) {
    mx.setPosition(0.95 - 0.33 + (i % 12) * 0.06, 0.893, 0.47 + Math.floor(i / 12) * 0.06);
    tuts.setMatrixAt(i, mx);
  }
  scene.add(tuts);

  const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.16, 28), clay('#e9e3d8', { roughness: 0.4 }));
  mug.position.set(1.42, 0.945, 0.8);
  mug.castShadow = true;
  scene.add(mug);

  const mKoin = new THREE.MeshStandardMaterial({ color: '#f2bd3e', metalness: 0.55, roughness: 0.38 });
  const geoKoin = new THREE.CylinderGeometry(0.13, 0.13, 0.034, 40);
  const MAKS = 24;
  const buatTumpukan = (x, z, jumlah, benih) => {
    const im = new THREE.InstancedMesh(geoKoin, mKoin, jumlah);
    im.castShadow = true;
    im.receiveShadow = true;
    im.frustumCulled = false;
    scene.add(im);
    const r = acak(benih);
    const geser = Array.from({ length: jumlah }, () => [(r() - 0.5) * 0.022, (r() - 0.5) * 0.022, r() * 2 - 1, r()]);
    return { im, x, z, geser };
  };
  const tumpukanRaka = buatTumpukan(-0.2, 0.78, MAKS, 11);
  const tumpukanDina = buatTumpukan(0.2, 0.78, MAKS, 29);
  const taruhanRaka = buatTumpukan(-0.5, 0.74, 6, 37);
  const taruhanDina = buatTumpukan(0.5, 0.74, 1, 53);

  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const p = new THREE.Vector3();
  const s = new THREE.Vector3();
  const tulis = (t, i, x, y, z, skala = 1, putar = 0) => {
    e.set(putar, 0, putar * 0.6);
    q.setFromEuler(e);
    s.setScalar(skala);
    mx.compose(p.set(x, y, z), q, s);
    t.im.setMatrixAt(i, mx);
  };
  const TINGGI = 0.034;
  const DASAR = 0.882;

  function aturTumpukan(t, jumlahPerLangkah, langkah, waktu) {
    for (let k = 0; k < MAKS; k++) {
      let hadir = k < jumlahPerLangkah[0];
      let sejak = -99;
      for (let i = 1; i < jumlahPerLangkah.length; i++) {
        if (langkah[i] > waktu) break;
        const baru = k < jumlahPerLangkah[i];
        if (baru !== hadir) {
          hadir = baru;
          sejak = langkah[i];
        }
      }
      const [gx, gz, arah, acakan] = t.geser[k];
      const y0 = DASAR + k * TINGGI;
      const d = waktu - sejak;
      if (hadir) {
        const jatuh = d < 0.28 ? (1 - d / 0.28) ** 2 * 1.1 : 0;
        tulis(t, k, t.x + gx, y0 + jatuh, t.z + gz);
      } else if (d < 0.75) {
        const y = Math.max(DASAR, y0 + 1.6 * d - 4.6 * d * d);
        tulis(t, k, t.x + gx + arah * 1.1 * d, y, t.z + gz + 0.5 * acakan * d, 1, arah * d * 7);
      } else {
        tulis(t, k, 0, -5, 0, 0.001);
      }
    }
    t.im.instanceMatrix.needsUpdate = true;
  }

  function aturTaruhan(t, jumlah, tampil, geserZ) {
    for (let k = 0; k < jumlah; k++) {
      const [gx, gz] = t.geser[k];
      if (tampil) tulis(t, k, t.x + gx, DASAR + k * TINGGI, t.z + gz + geserZ);
      else tulis(t, k, 0, -5, 0, 0.001);
    }
    t.im.instanceMatrix.needsUpdate = true;
  }

  const mBatangR = clay('#ff5a5f', { roughness: 0.45 });
  const mBatangD = clay('#3ddc97', { roughness: 0.45 });
  const buatBatang = (x, mat) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1, 0.5), mat);
    m.position.set(x, 0, 2.0);
    m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);
    return m;
  };
  const batangRaka = buatBatang(-0.62, mBatangR);
  const batangDina = buatBatang(0.62, mBatangD);

  const lampuRaka = new THREE.PointLight('#ff5a5f', 0, 4);
  lampuRaka.position.set(-1.7, 1.5, 0.9);
  scene.add(lampuRaka);
  const lampuDina = new THREE.PointLight('#3ddc97', 0, 4);
  lampuDina.position.set(1.7, 1.5, 0.9);
  scene.add(lampuDina);

  return {
    monitorRaka,
    monitorDina,
    engsel,
    lampuRaka,
    lampuDina,
    aturKoin(k) {
      aturTumpukan(tumpukanRaka, k.rakaJumlah, k.langkah, k.waktu);
      aturTumpukan(tumpukanDina, k.dinaJumlah, k.langkah, k.waktu);
      aturTaruhan(taruhanRaka, 6, k.taruhanRaka != null, k.taruhanRaka || 0);
      aturTaruhan(taruhanDina, 1, k.taruhanDina != null, k.taruhanDina || 0);
    },
    aturBatang(raka, dina) {
      batangRaka.visible = raka > 0;
      batangDina.visible = dina > 0;
      batangRaka.scale.y = Math.max(raka, 0.001);
      batangRaka.position.y = raka / 2;
      batangDina.scale.y = Math.max(dina, 0.001);
      batangDina.position.y = dina / 2;
    },
  };
}
