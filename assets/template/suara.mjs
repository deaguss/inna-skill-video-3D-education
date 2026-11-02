// Suara per adegan disimpan sebagai suara/01.wav, suara/02.mp3, dan seterusnya (nomor = id adegan).
//   node suara.mjs ukur                        tulis durasi_detik tiap adegan ke naskah.json
//   node suara.mjs gabung video.mp4 hasil.mp4  tempel suara ke video sesuai waktu mulai adegan
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import ffmpegPath from 'ffmpeg-static';
import { buatCerita } from './animasi/cerita.js';

const JEDA = 0.35;
const akar = path.dirname(fileURLToPath(import.meta.url));
const lokasiNaskah = path.join(akar, 'naskah.json');
const naskah = JSON.parse(fs.readFileSync(lokasiNaskah, 'utf8'));
const folderSuara = path.join(akar, 'suara');
const daftarSuara = fs.existsSync(folderSuara) ? fs.readdirSync(folderSuara) : [];

const berkasUntuk = (id) => {
  const f = daftarSuara.find((n) => path.parse(n).name === String(id).padStart(2, '0'));
  return f ? path.join(folderSuara, f) : null;
};

function durasi(berkas) {
  const { stderr } = spawnSync(ffmpegPath, ['-hide_banner', '-i', berkas], { encoding: 'utf8' });
  const m = /Duration: (\d+):(\d+):([\d.]+)/.exec(stderr);
  if (!m) throw new Error(`Durasi tidak terbaca: ${berkas}`);
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}

const [perintah, masuk, keluar] = process.argv.slice(2);

if (perintah === 'ukur') {
  const kosong = [];
  for (const a of naskah.adegan) {
    const f = berkasUntuk(a.id);
    if (f) a.durasi_detik = +(durasi(f) + JEDA).toFixed(2);
    else kosong.push(a.id);
  }
  fs.writeFileSync(lokasiNaskah, `${JSON.stringify(naskah, null, 2)}\n`);
  console.log(`Durasi ditulis. Adegan tanpa suara: ${kosong.length ? kosong.join(', ') : 'tidak ada'}`);
} else if (perintah === 'gabung' && masuk && keluar) {
  const { adegan } = buatCerita(naskah);
  const ada = adegan.map((a) => ({ a, f: berkasUntuk(a.id) })).filter((x) => x.f);
  if (!ada.length) throw new Error('Folder suara kosong.');
  const args = ['-y', '-hide_banner', '-loglevel', 'error', '-i', masuk];
  ada.forEach(({ f }) => args.push('-i', f));
  const tunda = ada.map(({ a }, i) => `[${i + 1}:a]adelay=${Math.round(a.mulai * 1000)}:all=1[s${i}]`);
  const label = ada.map((_, i) => `[s${i}]`).join('');
  args.push(
    '-filter_complex', `${tunda.join(';')};${label}amix=inputs=${ada.length}:normalize=0[suara]`,
    '-map', '0:v', '-map', '[suara]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', keluar,
  );
  const hasil = spawnSync(ffmpegPath, args, { encoding: 'utf8' });
  if (hasil.status !== 0) throw new Error(hasil.stderr);
  console.log(`Selesai: ${keluar} (${ada.length} klip suara)`);
} else {
  console.log('Pakai: node suara.mjs ukur | node suara.mjs gabung video.mp4 hasil.mp4');
}
