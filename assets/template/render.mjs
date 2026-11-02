// Usage:
//   node render.mjs --still 1,5.5,20 --out test      save frames at the given seconds as PNG
//   node render.mjs --from 0 --to 10 --out a.mp4     render part of the video
//   node render.mjs --out result.mp4                 render the whole video
// Options: --light (force CPU, required unless the GPU is proven safe), --scale 0.75, --samples N (default 16), --limit SECONDS.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
import ffmpegPath from 'ffmpeg-static';

const root = path.dirname(fileURLToPath(import.meta.url));
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
};

function findModules() {
  let dir = root;
  for (;;) {
    const candidate = path.join(dir, 'node_modules');
    if (fs.existsSync(path.join(candidate, 'three'))) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error('node_modules/three not found. Run npm install first.');
    dir = parent;
  }
}
const modulesDir = findModules();

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const fromModules = url.startsWith('/node_modules/');
  const base = fromModules ? modulesDir : root;
  const file = path.join(base, fromModules ? url.slice('/node_modules/'.length) : url);
  if (!file.startsWith(base) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const light = process.argv.includes('--light');
const browser = await puppeteer.launch({
  headless: true,
  args: light
    ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']
    : [`--use-angle=${arg('angle', 'd3d11')}`, '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'],
  protocolTimeout: 600000,
});

const stop = (code) => {
  const pid = browser.process()?.pid;
  if (pid && process.platform === 'win32') spawnSync('taskkill', ['/pid', String(pid), '/T', '/F']);
  else if (pid) browser.process().kill('SIGKILL');
  process.exit(code);
};
const limit = Number(arg('limit', 0));
if (limit) {
  setTimeout(() => {
    console.error(`TIME LIMIT of ${limit}s reached, render stopped.`);
    stop(2);
  }, limit * 1000);
}

const page = await browser.newPage();
page.on('pageerror', (e) => console.error('PAGE ERROR:', e.message));
page.on('console', (m) => console.error('CONSOLE:', m.text()));
await page.setViewport({ width: 720, height: 1280 });
const query = light ? `?light=1&scale=${arg('scale', '0.5')}` : '';
await page.goto(`http://127.0.0.1:${port}/scene/index.html${query}`);
await page.waitForFunction('window.ready === true', { timeout: 120000 });
const info = await page.evaluate(() => window.storyInfo);
console.log(`Renderer: ${info.gpu}`);
if (light && !/swiftshader/i.test(info.gpu)) {
  console.error('Light mode cancelled: the browser is not using the CPU renderer.');
  stop(3);
}
console.log(`Total: ${info.total.toFixed(1)} seconds`);
console.log(info.scenes.map((s) => `${s.id}@${s.start}`).join(' '));

const samples = Number(arg('samples', 16));
const out = arg('out', 'result.mp4');
const grab = (i) => page.evaluate((f, n) => window.renderFrame(f, n), i, samples);
const toBuffer = (url) => Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');

const still = arg('still');
if (still) {
  fs.mkdirSync(out, { recursive: true });
  for (const s of still.split(',').map(Number)) {
    const began = Date.now();
    const data = await grab(Math.round(s * info.fps));
    fs.writeFileSync(path.join(out, `t${String(s).padStart(5, '0')}.png`), toBuffer(data));
    console.log(`t=${s}s done in ${Date.now() - began} ms`);
  }
} else {
  const from = Number(arg('from', 0));
  const to = Math.min(Number(arg('to', info.total)), info.total);
  const first = Math.round(from * info.fps);
  const end = Math.round(to * info.fps);
  const ffmpeg = spawn(ffmpegPath, [
    '-y', '-f', 'image2pipe', '-framerate', String(info.fps), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out,
  ], { stdio: ['pipe', 'ignore', 'ignore'] });
  const began = Date.now();
  for (let i = first; i < end; i++) {
    const data = toBuffer(await grab(i));
    if (!ffmpeg.stdin.write(data)) await new Promise((r) => ffmpeg.stdin.once('drain', r));
    if ((i - first) % 30 === 0) {
      const elapsed = (Date.now() - began) / 1000;
      const done = i - first + 1;
      console.log(`frame ${done}/${end - first}, ${(elapsed / done).toFixed(2)} s/frame, ${Math.round((elapsed / done) * (end - i))} s left`);
    }
  }
  ffmpeg.stdin.end();
  await new Promise((r) => ffmpeg.on('close', r));
  console.log(`Done: ${out}`);
}

await browser.close();
process.exit(0);
