// Combines test frames into one image: node contact-sheet.mjs test sheet.png
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';

const [folder, output] = process.argv.slice(2);
const frames = fs.readdirSync(folder).filter((f) => f.endsWith('.png')).sort((a, b) => parseFloat(a.slice(1)) - parseFloat(b.slice(1)));
const list = path.join(folder, 'list.txt');
fs.writeFileSync(list, frames.map((f) => `file '${f}'`).join('\n'));
const columns = 5;
const rows = Math.ceil(frames.length / columns);
const result = spawnSync(ffmpegPath, ['-y', '-f', 'concat', '-safe', '0', '-i', list, '-vf', `scale=300:-1,tile=${columns}x${rows}`, '-frames:v', '1', output], { encoding: 'utf8' });
if (result.status !== 0) console.error(result.stderr.slice(-800));
else console.log(`${frames.length} frames: ${frames.join(' ')}`);
