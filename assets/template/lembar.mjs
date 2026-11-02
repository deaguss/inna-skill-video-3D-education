// Menggabungkan frame uji jadi satu lembar kontak: node lembar.mjs uji lembar.png
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';

const [folder, keluar] = process.argv.slice(2);
const berkas = fs.readdirSync(folder).filter((f) => f.endsWith('.png')).sort((a, b) => parseFloat(a.slice(1)) - parseFloat(b.slice(1)));
const daftar = path.join(folder, 'daftar.txt');
fs.writeFileSync(daftar, berkas.map((f) => `file '${f}'`).join('\n'));
const kolom = 5;
const baris = Math.ceil(berkas.length / kolom);
const hasil = spawnSync(ffmpegPath, ['-y', '-f', 'concat', '-safe', '0', '-i', daftar, '-vf', `scale=300:-1,tile=${kolom}x${baris}`, '-frames:v', '1', keluar], { encoding: 'utf8' });
if (hasil.status !== 0) console.error(hasil.stderr.slice(-800));
else console.log(`${berkas.length} frame: ${berkas.join(' ')}`);
