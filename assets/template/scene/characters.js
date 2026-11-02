import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const sphere = new THREE.SphereGeometry(1, 40, 28);

const LIGHT = new URLSearchParams(location.search).has('light');

export function clay(color, options = {}) {
  if (LIGHT) return new THREE.MeshStandardMaterial({ color: color, roughness: 0.62, ...options });
  return new THREE.MeshPhysicalMaterial({
    color: color,
    roughness: 0.62,
    sheen: 0.5,
    sheenRoughness: 0.7,
    sheenColor: new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.5),
    ...options,
  });
}

function attach(geo, mat, parent, pos = [0, 0, 0], scale = 1) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(...pos);
  if (Array.isArray(scale)) m.scale.set(...scale);
  else m.scale.setScalar(scale);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function makeArm(side, torso, shirt, skin) {
  const shoulder = new THREE.Group();
  shoulder.position.set(side * 0.36, 0.53, 0);
  torso.add(shoulder);
  attach(new THREE.CapsuleGeometry(0.1, 0.2, 8, 20), shirt, shoulder, [0, -0.15, 0]);
  const elbow = new THREE.Group();
  elbow.position.y = -0.34;
  shoulder.add(elbow);
  attach(new THREE.CapsuleGeometry(0.075, 0.2, 8, 20), skin, elbow, [0, -0.13, 0]);
  attach(sphere, skin, elbow, [0, -0.32, 0], 0.095);
  return { shoulder, elbow };
}

function makeLeg(side, root, pants, shoes) {
  const thigh = new THREE.Group();
  thigh.position.set(side * 0.15, 0, 0);
  root.add(thigh);
  attach(new THREE.CapsuleGeometry(0.11, 0.24, 8, 20), pants, thigh, [0, -0.2, 0]);
  const knee = new THREE.Group();
  knee.position.y = -0.42;
  thigh.add(knee);
  attach(new THREE.CapsuleGeometry(0.095, 0.22, 8, 20), pants, knee, [0, -0.18, 0]);
  attach(sphere, shoes, knee, [0, -0.4, 0.06], [0.11, 0.07, 0.17]);
  return { thigh, knee };
}

function makeHair(style, head, color) {
  const mat = clay(color, { roughness: 0.75 });
  const cover = new THREE.SphereGeometry(0.445, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.5);
  const cap = attach(cover, mat, head, [0, 0.04, -0.03]);
  cap.rotation.x = -0.55;

  if (style === 'spiky') {
    const spike = new THREE.ConeGeometry(0.15, 0.36, 16);
    const direction = [
      [0, 1, 0.25], [0.45, 0.85, 0.25], [-0.45, 0.85, 0.25], [0.8, 0.55, 0.05], [-0.8, 0.55, 0.05],
      [0.25, 0.95, -0.35], [-0.25, 0.95, -0.35], [0.65, 0.6, -0.5], [-0.65, 0.6, -0.5], [0, 0.65, -0.8],
      [0.15, 0.8, 0.6], [-0.2, 0.75, 0.62],
    ];
    for (const a of direction) {
      const v = new THREE.Vector3(...a).normalize();
      const m = attach(spike, mat, head, v.clone().multiplyScalar(0.46).toArray());
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v);
    }
  }

  if (style === 'short') {
    attach(sphere, mat, head, [0, 0.38, 0.0], [0.42, 0.12, 0.36]);
  }

  if (style === 'long') {
    attach(sphere, mat, head, [0, -0.18, -0.2], [0.47, 0.62, 0.32]);
    attach(sphere, mat, head, [-0.42, -0.25, 0.02], [0.12, 0.38, 0.16]);
    attach(sphere, mat, head, [0.42, -0.25, 0.02], [0.12, 0.38, 0.16]);
    attach(sphere, mat, head, [-0.1, 0.31, 0.24], [0.3, 0.1, 0.16]);
  }

  if (style === 'bob') {
    attach(sphere, mat, head, [0, -0.06, -0.14], [0.5, 0.5, 0.42]);
    attach(sphere, mat, head, [-0.4, -0.2, 0.06], [0.14, 0.3, 0.2]);
    attach(sphere, mat, head, [0.4, -0.2, 0.06], [0.14, 0.3, 0.2]);
    attach(sphere, mat, head, [0, 0.31, 0.24], [0.34, 0.12, 0.17]);
  }

}

export function makeCharacter({ skin, shirt, pants, hair, style, chair = false, cheeks = false }) {
  const root = new THREE.Group();
  const matSkin = clay(skin);
  const matShirt = clay(shirt);
  const matPants = clay(pants);
  const matShoes = clay('#22252c');

  const torso = new THREE.Group();
  root.add(torso);
  attach(new THREE.CapsuleGeometry(0.3, 0.28, 10, 28), matShirt, torso, [0, 0.3, 0], [1.05, 1, 0.78]);
  attach(new THREE.CylinderGeometry(0.1, 0.11, 0.16, 20), matSkin, torso, [0, 0.72, 0]);

  const armNeg = makeArm(-1, torso, matShirt, matSkin);
  const armPos = makeArm(1, torso, matShirt, matSkin);
  const legNeg = makeLeg(-1, root, matPants, matShoes);
  const legPos = makeLeg(1, root, matPants, matShoes);

  const head = new THREE.Group();
  head.position.y = 1.07;
  head.rotation.order = 'YXZ';
  torso.add(head);
  attach(sphere, matSkin, head, [0, 0, 0], [0.42, 0.4, 0.42]);
  attach(sphere, matSkin, head, [-0.42, 0, 0], [0.075, 0.09, 0.055]);
  attach(sphere, matSkin, head, [0.42, 0, 0], [0.075, 0.09, 0.055]);
  attach(sphere, matSkin, head, [0, -0.04, 0.42], 0.052);
  makeHair(style, head, hair);

  if (cheeks) {
    const matCheeks = clay('#e58c84', { roughness: 0.8 });
    attach(sphere, matCheeks, head, [-0.25, -0.1, 0.325], [0.06, 0.035, 0.012]);
    attach(sphere, matCheeks, head, [0.25, -0.1, 0.325], [0.06, 0.035, 0.012]);
  }

  const matWhite = new THREE.MeshStandardMaterial({ color: '#f7f4ee', roughness: 0.3 });
  const matBlack = new THREE.MeshStandardMaterial({ color: '#17151a', roughness: 0.2 });
  const matGlint = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  const makeEye = (s) => {
    const g = new THREE.Group();
    g.position.set(s * 0.16, 0.06, 0.365);
    g.rotation.y = s * 0.3;
    head.add(g);
    attach(sphere, matWhite, g, [0, 0, 0], [0.095, 0.105, 0.045]);
    const pupil = new THREE.Group();
    g.add(pupil);
    attach(sphere, matBlack, pupil, [0, 0, 0.03], [0.058, 0.064, 0.025]).castShadow = false;
    attach(sphere, matGlint, pupil, [0.022, 0.026, 0.052], 0.016).castShadow = false;
    return { g, pupil };
  };
  const eyeNeg = makeEye(-1);
  const eyePos = makeEye(1);

  const matBrow = clay(hair, { roughness: 0.8 });
  const browGeo = new THREE.CapsuleGeometry(0.024, 0.12, 6, 12);
  const browNeg = attach(browGeo, matBrow, head, [-0.16, 0.22, 0.345]);
  const browPos = attach(browGeo, matBrow, head, [0.16, 0.22, 0.345]);

  const mouth = new THREE.Group();
  mouth.position.set(0, -0.175, 0.385);
  head.add(mouth);
  const mouthCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-0.085, 0.02, -0.022),
    new THREE.Vector3(0, -0.03, 0.012),
    new THREE.Vector3(0.085, 0.02, -0.022),
  );
  const matLip = new THREE.MeshStandardMaterial({ color: '#5a2526', roughness: 0.5, side: THREE.DoubleSide });
  const arc = attach(new THREE.TubeGeometry(mouthCurve, 24, 0.012, 8), matLip, mouth);
  const matInner = new THREE.MeshStandardMaterial({ color: '#4a1a1e', roughness: 0.6 });
  const open = attach(sphere, matInner, mouth, [0, -0.012, 0], [0.08, 0.05, 0.022]);

  const sweat = attach(sphere, new THREE.MeshStandardMaterial({ color: '#a9dcf5', roughness: 0.08 }), head, [0.37, 0.15, 0.2], [0.032, 0.05, 0.032]);
  sweat.visible = false;

  if (chair) {
    const matChair = clay('#2a2d36', { roughness: 0.7 });
    attach(new RoundedBoxGeometry(0.72, 0.85, 0.12, 4, 0.05), matChair, root, [0, 0.42, -0.42]);
    attach(new RoundedBoxGeometry(0.72, 0.1, 0.65, 4, 0.04), matChair, root, [0, -0.12, -0.08]);
    attach(new THREE.CylinderGeometry(0.04, 0.04, 0.42, 14), matChair, root, [0, -0.38, -0.08]);
    attach(new THREE.CylinderGeometry(0.3, 0.34, 0.05, 24), matChair, root, [0, -0.58, -0.08]);
  }

  return {
    root,
    set(p) {
      root.position.set(...p.pos);
      root.rotation.y = p.yaw || 0;
      torso.rotation.set(p.lean || 0, 0, p.roll || 0);
      head.rotation.set(p.hp || 0, p.hy || 0, p.hr || 0);
      const [aN, aP] = [p.aN, p.aP];
      armNeg.shoulder.rotation.set(aN[0], 0, aN[1]);
      armNeg.elbow.rotation.x = aN[2];
      armPos.shoulder.rotation.set(aP[0], 0, aP[1]);
      armPos.elbow.rotation.x = aP[2];
      legNeg.thigh.rotation.x = p.lN[0];
      legNeg.knee.rotation.x = p.lN[1];
      legPos.thigh.rotation.x = p.lP[0];
      legPos.knee.rotation.x = p.lP[1];

      const m = p.face;
      const open01 = Math.min(1, m.eye * (1 - (m.blink || 0)));
      for (const eye of [eyeNeg, eyePos]) {
        eye.g.scale.set(m.eye, Math.max(0.07, m.eye * (1 - (m.blink || 0))), 1);
        eye.pupil.position.set((p.gx || 0) * 0.03, (p.gy || 0) * 0.03, 0);
        const pupilScale = m.pupil ?? 1;
        eye.pupil.scale.set(pupilScale, pupilScale, 1);
        eye.pupil.visible = open01 > 0.18;
      }
      const browY = 0.22 + (m.browY || 0);
      browNeg.position.y = browY + (m.browDiff || 0);
      browPos.position.y = browY - (m.browDiff || 0);
      browNeg.rotation.z = Math.PI / 2 + (m.brow || 0);
      browPos.rotation.z = Math.PI / 2 - (m.brow || 0);

      const openAmount = m.open || 0;
      open.visible = openAmount > 0.04;
      arc.visible = openAmount <= 0.04;
      open.scale.set(0.08 * (m.width || 1), 0.012 + 0.085 * openAmount, 0.022);
      const s = m.smile || 0;
      arc.scale.set(m.width || 1, Math.abs(s) < 0.1 ? 0.1 : s, 1);

      sweat.visible = p.sweat != null;
      if (p.sweat != null) sweat.position.y = 0.17 - p.sweat * 0.26;
    },
  };
}
