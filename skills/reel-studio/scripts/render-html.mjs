#!/usr/bin/env node
// Render an HTML page to an MP4, frame by frame (Playwright screenshots piped into ffmpeg). Deterministic: the page
// never plays in real time; for every frame we set the clock and take a picture.
//
// The page's motion must be SEEKABLE:
//   - CSS animations / transitions / WAAPI: all paused and set to the frame time, so `animation-delay` = a time in
//     seconds ON THE WHOLE VIDEO (style="--t:3.2s" + animation: pop .5s ease var(--t) both).
//   - [data-count="42.5"] data-at="3" data-for="0.8" [data-unit="%"] [data-sep]: a number counting up (ease-out).
//   - <img data-clip="frames/dir" data-n="240" data-at="2" [data-rate="1"]>: a video cut into frames/dir/f-00001.jpg…
//     (see `ffmpeg -i clip.mp4 -vf fps=30 -q:v 2 frames/dir/f-%05d.jpg`), shown frame-accurately from data-at.
//   - window.seek(ms) (optional, may be async): your own hook, called after the built-in steps (GSAP: tl.seek(ms/1000)).
//   - NEVER setTimeout / setInterval / requestAnimationFrame / Date.now() for motion: they don't follow this clock.
// The video length: --dur, else <body data-duration="12.5">.
//
// Usage:
//   node render-html.mjs page.html --out video.mp4 [--dur 12] [--fps 30] [--size 1080x1920] [--crf 18] [--audio mix.wav]
//   node render-html.mjs page.html --stills 0.5,3,7.2 [--outdir stills/]     one JPG per time (fast layout check)
//   node render-html.mjs page.html --sheet 1 [--outdir stills/]              a frame every 1 s, tiled in sheet.jpg
// Needs playwright in the project (npm i playwright && npx playwright install chromium). CHROMIUM_PATH overrides.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { need, FFMPEG, ff, args } from './lib.mjs';

const a = args();
const file = a._[0];
if (!file) {
  console.log('usage: node render-html.mjs page.html --out video.mp4 [--dur s] [--fps 30] [--size 1080x1920] | --stills t1,t2 | --sheet every_s');
  process.exit(1);
}
const pw = need('playwright');
if (!pw) throw new Error('playwright not found: npm i playwright && npx playwright install chromium');
const fps = +(a.fps || 30);
const [W, H] = String(a.size || '1080x1920').split('x').map(Number);

const SEEK = (fps) => async (ms) => {
  const waits = [];
  for (const el of document.querySelectorAll('img[data-clip]')) {
    const n = +el.dataset.n, rate = +(el.dataset.rate || 1);
    const i = Math.min(n - 1, Math.max(0, (rate < 0 ? n - 1 : 0) + Math.round((ms / 1000 - +(el.dataset.at || 0)) * rate * fps)));
    const src = `${el.dataset.clip}/f-${String(i + 1).padStart(5, '0')}.jpg`;
    if (el.getAttribute('src') !== src) { el.setAttribute('src', src); waits.push(el.decode().catch(() => {})); }
  }
  for (const an of document.getAnimations()) { an.pause(); an.currentTime = ms; }
  for (const el of document.querySelectorAll('[data-count]')) {
    const to = +el.dataset.count, at = +(el.dataset.at || 0) * 1000, len = +(el.dataset.for || 0.8) * 1000;
    const k = Math.min(1, Math.max(0, (ms - at) / len)), e = 1 - Math.pow(1 - k, 3);
    const dec = (el.dataset.count.split('.')[1] || '').length, n = to * e;
    el.textContent = (el.dataset.sep != null ? n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) : n.toFixed(dec)) + (el.dataset.unit || '');
  }
  if (typeof window.seek === 'function') waits.push(window.seek(ms));
  await Promise.all(waits);
};

const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
try {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  // a real file:// URL (not setContent) so relative images, fonts and clip frames load
  await page.goto(pathToFileURL(path.resolve(file)).href, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))));
  await page.evaluate(`window.__seekFrame = (${SEEK.toString()})(${fps})`);
  const seek = (s) => page.evaluate((ms) => window.__seekFrame(ms), s * 1000);
  const dur = +(a.dur || await page.evaluate(() => document.body.dataset.duration || 0));
  const outdir = path.resolve(a.outdir || path.dirname(path.resolve(a.out || file)));

  if (a.stills || a.sheet) {
    fs.mkdirSync(outdir, { recursive: true });
    const times = a.stills ? String(a.stills).split(',').map(Number)
      : Array.from({ length: Math.max(1, Math.floor(dur / +a.sheet)) }, (_, i) => +(i * +a.sheet + +a.sheet / 2).toFixed(2));
    const files = [];
    for (const t of times) {
      await seek(t);
      const f = path.join(outdir, `still-${t.toFixed(2)}.jpg`);
      await page.screenshot({ path: f, type: 'jpeg', quality: 85 });
      files.push(f);
    }
    if (a.sheet) {
      // contact sheet: 6 columns, small tiles
      const cols = Math.min(6, files.length), rows = Math.ceil(files.length / cols);
      const list = path.join(outdir, 'sheet.txt');
      fs.writeFileSync(list, files.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join('\n'));
      await ff(['-f', 'concat', '-safe', '0', '-i', list, '-vf', `scale=${Math.round(W / 4)}:-2,tile=${cols}x${rows}:padding=6:color=white`, '-frames:v', '1', path.join(outdir, 'sheet.jpg')]);
      fs.unlinkSync(list);
      console.log(`${files.length} frames → ${path.join(outdir, 'sheet.jpg')}`);
    } else console.log(files.join('\n'));
  } else {
    if (!dur) throw new Error('no length: pass --dur or set <body data-duration="…">');
    const out = path.resolve(a.out || file.replace(/\.html?$/, '.mp4'));
    const picture = a.audio ? out.replace(/\.mp4$/, '.picture.mp4') : out;
    const enc = spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', String(a.crf || 18), '-pix_fmt', 'yuv420p', '-r', String(fps), '-movflags', '+faststart', picture],
    { stdio: ['pipe', 'inherit', 'inherit'] });
    const done = new Promise((ok, bad) => enc.on('close', (c) => (c ? bad(new Error(`ffmpeg exit ${c}`)) : ok())));
    const write = (buf) => new Promise((ok) => (enc.stdin.write(buf) ? ok() : enc.stdin.once('drain', ok)));
    const frames = Math.round(dur * fps);
    const t0 = Date.now();
    for (let f = 0; f < frames; f++) {
      await seek(f / fps);
      await write(await page.screenshot({ type: 'jpeg', quality: 92 }));
      if (f % fps === 0) process.stdout.write(`\r${(f / fps).toFixed(0)}/${dur.toFixed(0)} s`);
    }
    enc.stdin.end();
    await done;
    if (a.audio) {
      await ff(['-i', picture, '-i', path.resolve(a.audio), '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-t', String(dur), '-movflags', '+faststart', out]);
      fs.unlinkSync(picture);
    }
    console.log(`\r${dur.toFixed(2)} s, ${frames} frames in ${Math.round((Date.now() - t0) / 1000)} s → ${out}`);
  }
} finally {
  await browser.close();
}
