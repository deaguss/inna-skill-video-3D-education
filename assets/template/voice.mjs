// Keep one voice clip per scene in voices/, named by scene id: voices/01.wav, voices/02.mp3, and so on.
//   node voice.mjs measure                    write duration_seconds for each scene to script.json
//   node voice.mjs mux video.mp4 result.mp4   add the clips to the video at each scene's start time
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import ffmpegPath from 'ffmpeg-static';
import { makeStory } from './scene/story.js';

const PAUSE = 0.35;
const root = path.dirname(fileURLToPath(import.meta.url));
const scriptPath = path.join(root, 'script.json');
const script = JSON.parse(fs.readFileSync(scriptPath, 'utf8'));
const voicesDir = path.join(root, 'voices');
const clips = fs.existsSync(voicesDir) ? fs.readdirSync(voicesDir) : [];

const clipFor = (id) => {
  const name = clips.find((n) => path.parse(n).name === String(id).padStart(2, '0'));
  return name ? path.join(voicesDir, name) : null;
};

function duration(file) {
  const { stderr } = spawnSync(ffmpegPath, ['-hide_banner', '-i', file], { encoding: 'utf8' });
  const m = /Duration: (\d+):(\d+):([\d.]+)/.exec(stderr);
  if (!m) throw new Error(`Could not read duration: ${file}`);
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}

const [command, input, output] = process.argv.slice(2);

if (command === 'measure') {
  const missing = [];
  for (const scene of script.scenes) {
    const file = clipFor(scene.id);
    if (file) scene.duration_seconds = +(duration(file) + PAUSE).toFixed(2);
    else missing.push(scene.id);
  }
  fs.writeFileSync(scriptPath, `${JSON.stringify(script, null, 2)}\n`);
  console.log(`Durations written. Scenes without a clip: ${missing.length ? missing.join(', ') : 'none'}`);
} else if (command === 'mux' && input && output) {
  const { scenes } = makeStory(script);
  const found = scenes.map((scene) => ({ scene, file: clipFor(scene.id) })).filter((x) => x.file);
  if (!found.length) throw new Error('The voices folder is empty.');
  const args = ['-y', '-hide_banner', '-loglevel', 'error', '-i', input];
  found.forEach(({ file }) => args.push('-i', file));
  const delays = found.map(({ scene }, i) => `[${i + 1}:a]adelay=${Math.round(scene.start * 1000)}:all=1[s${i}]`);
  const labels = found.map((_, i) => `[s${i}]`).join('');
  args.push(
    '-filter_complex', `${delays.join(';')};${labels}amix=inputs=${found.length}:normalize=0[voice]`,
    '-map', '0:v', '-map', '[voice]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', output,
  );
  const result = spawnSync(ffmpegPath, args, { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr);
  console.log(`Done: ${output} (${found.length} voice clips)`);
} else {
  console.log('Usage: node voice.mjs measure | node voice.mjs mux video.mp4 result.mp4');
}
