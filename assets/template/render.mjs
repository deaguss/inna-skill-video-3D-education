// Pakai:
//   node render.mjs --still 1,5.5,20 --out uji        simpan frame di detik tertentu sebagai PNG
//   node render.mjs --dari 0 --sampai 10 --out a.mp4  render potongan video
//   node render.mjs --out hasil.mp4                   render seluruh video
// Opsi: --ringan (paksa CPU, wajib kecuali GPU sudah terbukti aman), --skala 0.75, --sampel N (default 16), --batas DETIK.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
import ffmpegPath from 'ffmpeg-static';

const akar = path.dirname(fileURLToPath(import.meta.url));
const arg = (nama, bawaan) => {
  const i = process.argv.indexOf(`--${nama}`);
  return i >= 0 ? process.argv[i + 1] : bawaan;
};

function cariModul() {
  let d = akar;
  for (;;) {
    const c = path.join(d, 'node_modules');
    if (fs.existsSync(path.join(c, 'three'))) return c;
    const induk = path.dirname(d);
    if (induk === d) throw new Error('node_modules/three tidak ketemu. Jalankan npm install dulu.');
    d = induk;
  }
}
const folderModul = cariModul();

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const alamat = decodeURIComponent(req.url.split('?')[0]);
  const dariModul = alamat.startsWith('/node_modules/');
  const dasar = dariModul ? folderModul : akar;
  const lokasi = path.join(dasar, dariModul ? alamat.slice('/node_modules/'.length) : alamat);
  if (!lokasi.startsWith(dasar) || !fs.existsSync(lokasi) || fs.statSync(lokasi).isDirectory()) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(lokasi)] || 'application/octet-stream' });
  fs.createReadStream(lokasi).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const ringan = process.argv.includes('--ringan');
const browser = await puppeteer.launch({
  headless: true,
  args: ringan
    ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']
    : [`--use-angle=${arg('angle', 'd3d11')}`, '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'],
  protocolTimeout: 600000,
});

const hentikan = (kode) => {
  const pid = browser.process()?.pid;
  if (pid) spawnSync('taskkill', ['/pid', String(pid), '/T', '/F']);
  process.exit(kode);
};
const batas = Number(arg('batas', 0));
if (batas) {
  setTimeout(() => {
    console.error(`BATAS WAKTU ${batas} dtk tercapai, render dihentikan.`);
    hentikan(2);
  }, batas * 1000);
}

const page = await browser.newPage();
page.on('pageerror', (e) => console.error('HALAMAN ERROR:', e.message));
page.on('console', (m) => {
  console.error('KONSOL:', m.text());
});
await page.setViewport({ width: 720, height: 1280 });
const kueri = ringan ? `?ringan=1&skala=${arg('skala', '0.5')}` : '';
await page.goto(`http://127.0.0.1:${port}/animasi/index.html${kueri}`);
await page.waitForFunction('window.siap === true', { timeout: 120000 });
const info = await page.evaluate(() => window.infoCerita);
console.log(`GPU: ${info.gpu}`);
if (ringan && !/swiftshader/i.test(info.gpu)) {
  console.error('Mode ringan batal: browser tidak memakai renderer CPU.');
  hentikan(3);
}
console.log(`Total: ${info.total.toFixed(1)} detik`);

const sampel = Number(arg('sampel', 16));
const keluar = arg('out', 'hasil.mp4');
const ambil = (i) => page.evaluate((f, n) => window.renderFrame(f, n), i, sampel);
const keBuffer = (url) => Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');

const still = arg('still');
if (still) {
  fs.mkdirSync(keluar, { recursive: true });
  for (const d of still.split(',').map(Number)) {
    const mulai = Date.now();
    const data = await ambil(Math.round(d * info.fps));
    fs.writeFileSync(path.join(keluar, `t${String(d).padStart(5, '0')}.png`), keBuffer(data));
    console.log(`t=${d}s selesai dalam ${Date.now() - mulai} ms`);
  }
} else {
  const dari = Number(arg('dari', 0));
  const sampai = Math.min(Number(arg('sampai', info.total)), info.total);
  const f0 = Math.round(dari * info.fps);
  const f1 = Math.round(sampai * info.fps);
  const ff = spawn(ffmpegPath, [
    '-y', '-f', 'image2pipe', '-framerate', String(info.fps), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', keluar,
  ], { stdio: ['pipe', 'ignore', 'ignore'] });
  const mulai = Date.now();
  for (let i = f0; i < f1; i++) {
    const data = keBuffer(await ambil(i));
    if (!ff.stdin.write(data)) await new Promise((r) => ff.stdin.once('drain', r));
    if ((i - f0) % 30 === 0) {
      const lewat = (Date.now() - mulai) / 1000;
      const selesai = i - f0 + 1;
      console.log(`frame ${selesai}/${f1 - f0}, ${(lewat / selesai).toFixed(2)} dtk/frame, sisa ${Math.round((lewat / selesai) * (f1 - i))} dtk`);
    }
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  console.log(`Selesai: ${keluar}`);
}

await browser.close();
process.exit(0);
