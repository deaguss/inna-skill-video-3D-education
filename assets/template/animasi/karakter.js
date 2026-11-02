import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const bola = new THREE.SphereGeometry(1, 40, 28);

const RINGAN = new URLSearchParams(location.search).has('ringan');

export function clay(warna, opsi = {}) {
  if (RINGAN) return new THREE.MeshStandardMaterial({ color: warna, roughness: 0.62, ...opsi });
  return new THREE.MeshPhysicalMaterial({
    color: warna,
    roughness: 0.62,
    sheen: 0.5,
    sheenRoughness: 0.7,
    sheenColor: new THREE.Color(warna).lerp(new THREE.Color('#ffffff'), 0.5),
    ...opsi,
  });
}

function pasang(geo, mat, induk, pos = [0, 0, 0], skala = 1) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(...pos);
  if (Array.isArray(skala)) m.scale.set(...skala);
  else m.scale.setScalar(skala);
  m.castShadow = true;
  m.receiveShadow = true;
  induk.add(m);
  return m;
}

function buatLengan(sisi, torso, baju, kulit) {
  const bahu = new THREE.Group();
  bahu.position.set(sisi * 0.36, 0.53, 0);
  torso.add(bahu);
  pasang(new THREE.CapsuleGeometry(0.1, 0.2, 8, 20), baju, bahu, [0, -0.15, 0]);
  const siku = new THREE.Group();
  siku.position.y = -0.34;
  bahu.add(siku);
  pasang(new THREE.CapsuleGeometry(0.075, 0.2, 8, 20), kulit, siku, [0, -0.13, 0]);
  pasang(bola, kulit, siku, [0, -0.32, 0], 0.095);
  return { bahu, siku };
}

function buatKaki(sisi, root, celana, sepatu) {
  const paha = new THREE.Group();
  paha.position.set(sisi * 0.15, 0, 0);
  root.add(paha);
  pasang(new THREE.CapsuleGeometry(0.11, 0.24, 8, 20), celana, paha, [0, -0.2, 0]);
  const lutut = new THREE.Group();
  lutut.position.y = -0.42;
  paha.add(lutut);
  pasang(new THREE.CapsuleGeometry(0.095, 0.22, 8, 20), celana, lutut, [0, -0.18, 0]);
  pasang(bola, sepatu, lutut, [0, -0.4, 0.06], [0.11, 0.07, 0.17]);
  return { paha, lutut };
}

function buatRambut(gaya, kepala, warna) {
  const mat = clay(warna, { roughness: 0.75 });
  const tutup = new THREE.SphereGeometry(0.445, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.5);
  const cap = pasang(tutup, mat, kepala, [0, 0.04, -0.03]);
  cap.rotation.x = -0.55;

  if (gaya === 'jabrik') {
    const duri = new THREE.ConeGeometry(0.15, 0.36, 16);
    const arah = [
      [0, 1, 0.25], [0.45, 0.85, 0.25], [-0.45, 0.85, 0.25], [0.8, 0.55, 0.05], [-0.8, 0.55, 0.05],
      [0.25, 0.95, -0.35], [-0.25, 0.95, -0.35], [0.65, 0.6, -0.5], [-0.65, 0.6, -0.5], [0, 0.65, -0.8],
      [0.15, 0.8, 0.6], [-0.2, 0.75, 0.62],
    ];
    for (const a of arah) {
      const v = new THREE.Vector3(...a).normalize();
      const m = pasang(duri, mat, kepala, v.clone().multiplyScalar(0.46).toArray());
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v);
    }
  }

  if (gaya === 'bob') {
    pasang(bola, mat, kepala, [0, -0.06, -0.14], [0.5, 0.5, 0.42]);
    pasang(bola, mat, kepala, [-0.4, -0.2, 0.06], [0.14, 0.3, 0.2]);
    pasang(bola, mat, kepala, [0.4, -0.2, 0.06], [0.14, 0.3, 0.2]);
    pasang(bola, mat, kepala, [0, 0.31, 0.24], [0.34, 0.12, 0.17]);
  }

}

export function buatKarakter({ kulit, baju, celana, rambut, gaya, kursi = false, pipi = false }) {
  const root = new THREE.Group();
  const mKulit = clay(kulit);
  const mBaju = clay(baju);
  const mCelana = clay(celana);
  const mSepatu = clay('#22252c');

  const torso = new THREE.Group();
  root.add(torso);
  pasang(new THREE.CapsuleGeometry(0.3, 0.28, 10, 28), mBaju, torso, [0, 0.3, 0], [1.05, 1, 0.78]);
  pasang(new THREE.CylinderGeometry(0.1, 0.11, 0.16, 20), mKulit, torso, [0, 0.72, 0]);

  const lenganN = buatLengan(-1, torso, mBaju, mKulit);
  const lenganP = buatLengan(1, torso, mBaju, mKulit);
  const kakiN = buatKaki(-1, root, mCelana, mSepatu);
  const kakiP = buatKaki(1, root, mCelana, mSepatu);

  const kepala = new THREE.Group();
  kepala.position.y = 1.07;
  kepala.rotation.order = 'YXZ';
  torso.add(kepala);
  pasang(bola, mKulit, kepala, [0, 0, 0], [0.42, 0.4, 0.42]);
  pasang(bola, mKulit, kepala, [-0.42, 0, 0], [0.075, 0.09, 0.055]);
  pasang(bola, mKulit, kepala, [0.42, 0, 0], [0.075, 0.09, 0.055]);
  pasang(bola, mKulit, kepala, [0, -0.04, 0.42], 0.052);
  buatRambut(gaya, kepala, rambut);

  if (pipi) {
    const mPipi = clay('#e58c84', { roughness: 0.8 });
    pasang(bola, mPipi, kepala, [-0.25, -0.1, 0.325], [0.06, 0.035, 0.012]);
    pasang(bola, mPipi, kepala, [0.25, -0.1, 0.325], [0.06, 0.035, 0.012]);
  }

  const mPutih = new THREE.MeshStandardMaterial({ color: '#f7f4ee', roughness: 0.3 });
  const mHitam = new THREE.MeshStandardMaterial({ color: '#17151a', roughness: 0.2 });
  const mKilau = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  const buatMata = (s) => {
    const g = new THREE.Group();
    g.position.set(s * 0.16, 0.06, 0.365);
    g.rotation.y = s * 0.3;
    kepala.add(g);
    pasang(bola, mPutih, g, [0, 0, 0], [0.095, 0.105, 0.045]);
    const pupil = new THREE.Group();
    g.add(pupil);
    pasang(bola, mHitam, pupil, [0, 0, 0.03], [0.058, 0.064, 0.025]).castShadow = false;
    pasang(bola, mKilau, pupil, [0.022, 0.026, 0.052], 0.016).castShadow = false;
    return { g, pupil };
  };
  const mataN = buatMata(-1);
  const mataP = buatMata(1);

  const mAlis = clay(rambut, { roughness: 0.8 });
  const alisGeo = new THREE.CapsuleGeometry(0.024, 0.12, 6, 12);
  const alisN = pasang(alisGeo, mAlis, kepala, [-0.16, 0.22, 0.345]);
  const alisP = pasang(alisGeo, mAlis, kepala, [0.16, 0.22, 0.345]);

  const mulut = new THREE.Group();
  mulut.position.set(0, -0.175, 0.385);
  kepala.add(mulut);
  const lengkung = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-0.085, 0.02, -0.022),
    new THREE.Vector3(0, -0.03, 0.012),
    new THREE.Vector3(0.085, 0.02, -0.022),
  );
  const mBibir = new THREE.MeshStandardMaterial({ color: '#5a2526', roughness: 0.5, side: THREE.DoubleSide });
  const arc = pasang(new THREE.TubeGeometry(lengkung, 24, 0.012, 8), mBibir, mulut);
  const mDalam = new THREE.MeshStandardMaterial({ color: '#4a1a1e', roughness: 0.6 });
  const buka = pasang(bola, mDalam, mulut, [0, -0.012, 0], [0.08, 0.05, 0.022]);

  const keringat = pasang(bola, new THREE.MeshStandardMaterial({ color: '#a9dcf5', roughness: 0.08 }), kepala, [0.37, 0.15, 0.2], [0.032, 0.05, 0.032]);
  keringat.visible = false;

  if (kursi) {
    const mKursi = clay('#2a2d36', { roughness: 0.7 });
    pasang(new RoundedBoxGeometry(0.72, 0.85, 0.12, 4, 0.05), mKursi, root, [0, 0.42, -0.42]);
    pasang(new RoundedBoxGeometry(0.72, 0.1, 0.65, 4, 0.04), mKursi, root, [0, -0.12, -0.08]);
    pasang(new THREE.CylinderGeometry(0.04, 0.04, 0.42, 14), mKursi, root, [0, -0.38, -0.08]);
    pasang(new THREE.CylinderGeometry(0.3, 0.34, 0.05, 24), mKursi, root, [0, -0.58, -0.08]);
  }

  return {
    root,
    set(p) {
      root.position.set(...p.pos);
      root.rotation.y = p.yaw || 0;
      torso.rotation.set(p.lean || 0, 0, p.roll || 0);
      kepala.rotation.set(p.hp || 0, p.hy || 0, p.hr || 0);
      const [aN, aP] = [p.aN, p.aP];
      lenganN.bahu.rotation.set(aN[0], 0, aN[1]);
      lenganN.siku.rotation.x = aN[2];
      lenganP.bahu.rotation.set(aP[0], 0, aP[1]);
      lenganP.siku.rotation.x = aP[2];
      kakiN.paha.rotation.x = p.lN[0];
      kakiN.lutut.rotation.x = p.lN[1];
      kakiP.paha.rotation.x = p.lP[0];
      kakiP.lutut.rotation.x = p.lP[1];

      const m = p.muka;
      const buka01 = Math.min(1, m.mata * (1 - (m.kedip || 0)));
      for (const mata of [mataN, mataP]) {
        mata.g.scale.set(m.mata, Math.max(0.07, m.mata * (1 - (m.kedip || 0))), 1);
        mata.pupil.position.set((p.gx || 0) * 0.03, (p.gy || 0) * 0.03, 0);
        const skalaPupil = m.pupil ?? 1;
        mata.pupil.scale.set(skalaPupil, skalaPupil, 1);
        mata.pupil.visible = buka01 > 0.18;
      }
      const alisY = 0.22 + (m.alisY || 0);
      alisN.position.y = alisY + (m.alisBeda || 0);
      alisP.position.y = alisY - (m.alisBeda || 0);
      alisN.rotation.z = Math.PI / 2 + (m.alis || 0);
      alisP.rotation.z = Math.PI / 2 - (m.alis || 0);

      const terbuka = m.buka || 0;
      buka.visible = terbuka > 0.04;
      arc.visible = terbuka <= 0.04;
      buka.scale.set(0.08 * (m.lebar || 1), 0.012 + 0.085 * terbuka, 0.022);
      const s = m.senyum || 0;
      arc.scale.set(m.lebar || 1, Math.abs(s) < 0.1 ? 0.1 : s, 1);

      keringat.visible = p.keringat != null;
      if (p.keringat != null) keringat.position.y = 0.17 - p.keringat * 0.26;
    },
  };
}
