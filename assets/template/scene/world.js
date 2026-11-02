import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { clay } from './characters.js';

function makeProp(prop) {
  const material = prop.glow
    ? new THREE.MeshBasicMaterial({ color: new THREE.Color(prop.color) })
    : clay(prop.color, { roughness: 0.5 });
  let geometry;
  if (prop.shape === 'sphere') geometry = new THREE.SphereGeometry(prop.size, 48, 32);
  else if (prop.shape === 'bar') geometry = new THREE.BoxGeometry(1, 1, 1);
  else geometry = new RoundedBoxGeometry(prop.size[0], prop.size[1], prop.size[2], 4, 0.03);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = !prop.glow;
  mesh.receiveShadow = !prop.glow;
  mesh.visible = false;
  return mesh;
}

export function makeWorld(scene, script) {
  const set = script.set || {};

  const wall = new THREE.Mesh(new THREE.PlaneGeometry(60, 24), clay(set.wall || '#55617a', { roughness: 0.9 }));
  wall.position.set(0, 12, -3.2);
  wall.receiveShadow = true;
  scene.add(wall);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), clay(set.floor || '#4c3a56', { roughness: 0.85 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.z = 6;
  floor.receiveShadow = true;
  scene.add(floor);

  const desk = new THREE.Mesh(new RoundedBoxGeometry(5.6, 0.09, 1.25, 4, 0.04), clay(set.desk || '#a3968c', { roughness: 0.5 }));
  desk.position.set(0, 0.82, 0.85);
  desk.castShadow = true;
  desk.receiveShadow = true;
  scene.add(desk);

  const panel = new THREE.Mesh(new RoundedBoxGeometry(5.5, 0.74, 0.05, 3, 0.02), clay(set.panel || '#6f655e', { roughness: 0.55 }));
  panel.position.set(0, 0.41, 1.4);
  panel.castShadow = true;
  panel.receiveShadow = true;
  scene.add(panel);

  const props = [];
  for (const s of script.scenes) {
    for (const prop of s.props || []) {
      const mesh = makeProp(prop);
      scene.add(mesh);
      props.push({ id: s.id, prop, mesh });
    }
  }

  return {
    updateProps(state) {
      const smooth = (u) => u * u * (3 - 2 * u);
      for (const { id, prop, mesh } of props) {
        mesh.visible = id === state.scene.id && state.local >= (prop.at || 0);
        if (!mesh.visible) continue;
        const u = Math.min(1, (state.local - (prop.at || 0)) / (prop.shape === 'bar' ? 1 : 0.4));
        if (prop.shape === 'bar') {
          const height = Math.max(prop.size[1] * smooth(u), 0.001);
          mesh.scale.set(prop.size[0], height, prop.size[2]);
          mesh.position.set(prop.pos[0], prop.pos[1] + height / 2, prop.pos[2]);
        } else {
          mesh.scale.setScalar(Math.max(smooth(u), 0.001));
          mesh.position.set(...prop.pos);
        }
      }
    },
  };
}
