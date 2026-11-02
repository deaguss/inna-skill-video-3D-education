// Turns script.json into a pose, camera, and props for any moment in time.
// Everything is computed from time alone, because each frame is rendered several times at slightly different times.
const smooth = (a, b, x) => {
  const u = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return u * u * (3 - 2 * u);
};
const lerp = (a, b, u) => a + (b - a) * u;
const lerpArray = (a, b, u) => a.map((v, i) => lerp(v, b[i], u));

const END_CARD_SECONDS = 3.4;
const SEAT_X = { left: -0.85, center: 0, right: 0.85 };
const HEAD_Y = 1.67;

export const FACES = {
  relaxed: { brow: 0, eye: 1, smile: 0.6 },
  curious: { brow: 0.05, browDiff: 0.03, eye: 1.05, smile: 0.2 },
  teasing: { brow: -0.1, browDiff: 0.035, eye: 0.92, smile: 0.85 },
  serious: { brow: -0.18, browY: -0.01, eye: 0.95, smile: 0.1 },
  calm: { brow: 0.02, eye: 0.92, smile: 0.5 },
  mischievous: { brow: -0.16, browDiff: 0.03, eye: 0.82, smile: 0.9 },
  confident: { brow: -0.14, browY: 0.01, eye: 0.92, smile: 0.95 },
  mocking: { brow: -0.1, browY: 0.02, eye: 0.6, smile: 1, width: 1.25 },
  shocked: { brow: 0.4, browY: 0.06, eye: 1.32, pupil: 0.62, smile: -0.4 },
  'forced smile': { brow: 0.32, browY: 0.03, eye: 1.12, pupil: 0.72, smile: 1.1, width: 1.3 },
  happy: { brow: 0.08, browY: 0.02, eye: 0.8, smile: 1.15, width: 1.2 },
  gloomy: { brow: 0.42, browY: -0.02, eye: 0.72, smile: -0.7 },
  determined: { brow: -0.14, eye: 1, smile: 0.8 },
  embarrassed: { brow: 0.3, browY: 0.01, eye: 0.92, smile: -0.25, width: 0.75 },
};

const blinkAt = (t, offset) => {
  const u = (t + offset) % 3.3;
  return u < 0.13 ? Math.sin((u / 0.13) * Math.PI) : 0;
};
const lipMotion = (local, duration) => {
  if (local > duration - 0.3 || local < 0.05) return 0;
  return Math.abs(Math.sin(local * 8.5)) * (0.55 + 0.45 * Math.sin(local * 3.3 + 1));
};

function seatedBase(x) {
  return {
    pos: [x, 0.6, -0.05],
    yaw: 0,
    lean: 0.06,
    roll: 0,
    aN: [-1.2, 0.1, -0.55],
    aP: [-1.2, -0.1, -0.55],
    lN: [-1.45, 1.45],
    lP: [-1.45, 1.45],
    hy: 0,
    hp: 0,
    hr: 0,
    gx: 0,
    gy: 0,
  };
}

const POSES = {
  idle: () => ({}),
  explain: (local) => {
    const g = Math.sin(local * 4.4);
    return { aP: [-1.15 + g * 0.1, 0.35 + g * 0.06, -1.2 + g * 0.1] };
  },
  point: () => ({ aP: [-1.5, -0.22, -0.08] }),
  think: () => ({ aP: [-1.55, -0.1, -1.95], hr: 0.06 }),
  wave: (local) => ({ aP: [0, 2.3 + Math.sin(local * 9) * 0.2, -0.3] }),
  cheer: (local) => ({ aN: [0, -2.8, -0.2], aP: [0, 2.8, -0.2], bounce: Math.abs(Math.sin(local * 6)) * 0.03 }),
  shocked: () => ({ aN: [-2.65, 0.48, -1.75], aP: [-2.65, -0.48, -1.75], lean: -0.06, hp: -0.1 }),
  laugh: (local) => {
    const g = Math.sin(local * 15);
    return { hp: -0.2 + g * 0.045, lean: -0.08 + g * 0.03, bounce: Math.abs(g) * 0.02 };
  },
  slump: () => ({ lean: 0.26, hp: 0.28, gy: -0.3 }),
  nod: (local) => ({ hp: Math.max(0, Math.sin(local * 7)) * 0.2 }),
};

function applyLook(pose, look, x, others) {
  const toward = (dir) => {
    pose.hy = 0.42 * dir;
    pose.gx = 0.6 * dir;
  };
  if (look === 'left') toward(-1);
  else if (look === 'right') toward(1);
  else if (look === 'up') {
    pose.hp = (pose.hp || 0) - 0.3;
    pose.gy = 0.6;
  } else if (look === 'down') {
    pose.hp = (pose.hp || 0) + 0.18;
    pose.gy = -0.4;
  } else if (look === 'other' && others.length) toward(Math.sign(others[0] - x) || 1);
}

function cameraFor(scene, local, cast) {
  const spec = scene.camera || {};
  const [kind, who] = String(spec.shot || 'wide').split(':');
  const x = who && cast[who] ? cast[who].x : 0;
  const SHOTS = {
    wide: { pos: [0, 2, 10.2], target: [0, 1.6, 0.4], fov: 28, ap: 0.04 },
    medium: { pos: [x, 1.65, 6.4], target: [x, 1.55, 0], fov: 26, ap: 0.05 },
    closeup: { pos: [x, 1.72, 4.1], target: [x, HEAD_Y + 0.05, 0], fov: 26, ap: 0.09 },
    desk: { pos: [x, 1.6, 5.2], target: [x, 1.1, 0.8], fov: 24, ap: 0.03 },
  };
  const shot = SHOTS[kind] || SHOTS.wide;
  const u = smooth(0, scene.duration, local);
  const offset = shot.pos.map((v, i) => v - shot.target[i]);
  let scale = 1;
  let angle = 0;
  if (spec.move === 'push') scale = lerp(1.14, 1, u);
  if (spec.move === 'pull') scale = lerp(1, 1.14, u);
  if (spec.move === 'orbit') angle = lerp(-0.35, 0.35, u);
  const ox = (offset[0] * Math.cos(angle) + offset[2] * Math.sin(angle)) * scale;
  const oz = (offset[2] * Math.cos(angle) - offset[0] * Math.sin(angle)) * scale;
  return {
    pos: [shot.target[0] + ox, shot.target[1] + offset[1] * scale, shot.target[2] + oz],
    target: shot.target,
    fov: shot.fov,
    ap: shot.ap,
  };
}

export function makeStory(script) {
  const cast = {};
  for (const [id, member] of Object.entries(script.cast)) {
    cast[id] = { ...member, x: SEAT_X[member.seat] ?? 0 };
  }

  let clock = 0.15;
  const scenes = script.scenes.map((s) => {
    const words = s.voice.split(/\s+/).length;
    const duration = (s.duration_seconds ?? Math.max(1.4, words / 2.5 + 0.5)) + (s.hold || 0);
    const result = { ...s, start: clock, duration };
    clock += duration;
    return result;
  });
  const storyEnd = clock;
  const total = storyEnd + END_CARD_SECONDS;

  const sceneAt = (t) => {
    let i = 0;
    while (i < scenes.length - 1 && scenes[i + 1].start <= t) i++;
    return scenes[i];
  };
  const previousActing = (scene) => {
    for (let j = scenes.indexOf(scene); j >= 0; j--) {
      if (scenes[j].speaker !== 'narrator' || scenes[j].actions) return scenes[j];
    }
    return null;
  };

  function poseFor(id, scene, ref, local, frozen, t, offset) {
    const member = cast[id];
    const base = seatedBase(member.x);
    const action = (ref && ref.actions && ref.actions[id]) || {};
    const held = frozen ? (ref ? ref.duration : 0) : local;
    const moves = (POSES[action.pose] || POSES.idle)(held);
    const enter = smooth(0, 0.3, held);
    const pose = { ...base };
    for (const key of ['aN', 'aP']) if (moves[key]) pose[key] = lerpArray(base[key], moves[key], enter);
    for (const key of ['lean', 'hp', 'hr', 'gy']) if (moves[key] !== undefined) pose[key] = lerp(base[key], moves[key], enter);
    if (moves.bounce) pose.pos = [pose.pos[0], pose.pos[1] + moves.bounce, pose.pos[2]];

    const isSpeaker = ref && ref.speaker === id;
    const others = Object.keys(cast).filter((o) => o !== id).map((o) => cast[o].x);
    applyLook(pose, action.look || (isSpeaker ? 'camera' : 'other'), member.x, others);

    const expression = action.expression || (isSpeaker ? ref.expression : 'calm');
    pose.face = { ...(FACES[expression] || FACES.calm) };
    if (expression === 'forced smile' || action.sweat) pose.sweat = (t * 0.65) % 1;
    if (!frozen) {
      pose.face.blink = blinkAt(t, offset);
      if (scene.speaker === id) pose.face.open = lipMotion(local, scene.duration) * 0.7;
      if (action.pose === 'laugh') pose.face.open = 0.75 + Math.sin(local * 15) * 0.2;
    }
    return pose;
  }

  function stateAt(t) {
    const scene = sceneAt(t);
    const local = Math.max(0, t - scene.start);
    const frozen = scene.speaker === 'narrator' && !scene.actions;
    const ref = previousActing(scene);
    const poses = {};
    Object.keys(cast).forEach((id, i) => {
      poses[id] = poseFor(id, scene, ref, local, frozen, t, i * 1.4);
    });
    return { scene, local, poses, camera: cameraFor(scene, local, cast) };
  }

  return { cast, scenes, total, storyEnd, stateAt, HEAD_Y };
}
