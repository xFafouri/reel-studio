// Presentation video renderer: slides written in projects/<name>/video.js, timed to the voice, rendered frame by frame
// (Playwright screenshots → ffmpeg), then the voices + optional music are mixed in.
// Usage: node render.js <name>             → projects/<name>/out/video.mp4
//        node render.js <name> --stills    → one picture per slide (fast check)
//        node render.js <name> --frame 3.5 → the frame at 3.5 s
const fs = require('fs');
const path = require('path');
const { execFile, spawn } = require('child_process');
const { promisify } = require('util');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const FFMPEG = require('ffmpeg-static');
const FFPROBE = require('ffprobe-static').path;

const run = promisify(execFile);
const PY = process.env.PYTHON || path.join(__dirname, '.venv/bin/python');
const PAD = 0.4; // seconds of slide before and after each voice line

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const plain = (s) => s.toLowerCase().replace(/[ً-ْٰـ]/g, '').replace(/[^\p{L}\p{N}]/gu, '');
const url = (f) => pathToFileURL(f).href;

async function seconds(file) {
  const { stdout } = await run(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]);
  return parseFloat(stdout);
}

// Time of every spoken word (align_words.py), cached next to the audio until the text changes.
async function words(audio, text) {
  const cache = `${audio}.words.json`;
  if (fs.existsSync(cache)) { const c = JSON.parse(fs.readFileSync(cache, 'utf8')); if (c.text === text) return c.words; }
  const stdout = await new Promise((resolve, reject) => {
    execFile(PY, [path.join(__dirname, 'align_words.py'), FFMPEG, audio], { maxBuffer: 1e7, timeout: 600e3 },
      (err, out) => (err ? reject(err) : resolve(out))).stdin.end(text);
  });
  const list = JSON.parse(stdout).map((w) => ({ w: w.w, at: w.t, end: w.t + w.d }));
  fs.writeFileSync(cache, JSON.stringify({ text, words: list }));
  return list;
}

// A screen recording becomes numbered JPGs (cut once); the page swaps them frame by frame.
async function clipFrames(file, fps, out) {
  const dir = path.join(out, 'clips', path.basename(file).replace(/\W/g, '_'));
  if (!fs.existsSync(path.join(dir, '00001.jpg'))) {
    fs.mkdirSync(dir, { recursive: true });
    await run(FFMPEG, ['-y', '-loglevel', 'error', '-i', file, '-vf', `fps=${fps},scale=1600:-2`, '-q:v', '3', path.join(dir, '%05d.jpg')]);
  }
  return { dir, count: fs.readdirSync(dir).length };
}

// Slide times: PAD + voice + PAD (+ hold), at least as long as its clip, or `dur` when it has no voice.
async function timeline(dir, spec, out) {
  let t = 0;
  const slides = [];
  for (const s of spec.slides) {
    const audio = s.audio && path.join(dir, s.audio);
    const len = audio ? await seconds(audio) : 0;
    const ws = audio ? (await words(audio, s.text)).map((w) => ({ ...w, at: w.at + t + PAD, end: w.end + t + PAD })) : [];
    const clip = s.clip && { ...(await clipFrames(path.join(dir, s.clip), spec.fps, out)), seconds: await seconds(path.join(dir, s.clip)) };
    const dur = s.dur || Math.max(audio ? PAD + len + PAD : 3, clip ? clip.seconds : 0);
    slides.push({ ...s, audio, clip, start: t, voiceAt: t + PAD, end: t + dur + (s.hold || 0), words: ws });
    t = slides.at(-1).end;
  }
  return slides;
}

// T = helpers for a slide: T.at('word') = when that word is said (seconds on the whole video).
function helpers(s, dir) {
  return {
    start: s.start, end: s.end, words: s.words,
    at(part, n = 1) {
      const hits = s.words.filter((w) => plain(w.w).includes(plain(part)));
      if (!hits[n - 1]) throw new Error(`"${part}" (#${n}) is not said in: ${s.text}`);
      return +hits[n - 1].at.toFixed(2);
    },
    img: (file) => url(path.join(dir, file)),
  };
}

// The built-in slide layout: title, bullets (each appears on its cue word), image or screen recording.
function slideHtml(s, T) {
  if (s.html) return s.html(T);
  const media = s.clip ? `<img class="media fade" style="--t:${s.start}s" data-frames="${url(s.clip.dir)}" data-count="${s.clip.count}" data-from="${s.start}">`
    : s.image ? `<img class="media fade" style="--t:${s.start + 0.2}s" src="${T.img(s.image)}">` : '';
  const bullets = (s.bullets || []).map(([text, cue]) => `<li class="up" style="--t:${cue ? T.at(cue) : s.start + 0.3}s">${esc(text)}</li>`).join('');
  const cls = media && bullets ? 'split' : !media && !bullets ? 'cover' : '';
  return `<div class="slide ${cls}">
    ${s.title ? `<h1 class="up" style="--t:${s.start + 0.1}s">${esc(s.title)}</h1>` : ''}
    ${s.subtitle ? `<p class="sub fade" style="--t:${s.start + 0.4}s">${esc(s.subtitle)}</p>` : ''}
    <div class="body">${bullets ? `<ul>${bullets}</ul>` : ''}${media}</div></div>`;
}

// Captions (spec.captions: true): lines of ~6 words, each word lights up when said.
function captions(s) {
  const groups = [];
  for (let i = 0; i < s.words.length; i += 6) groups.push(s.words.slice(i, i + 6));
  return groups.map((g, k) => `<div class="line" dir="auto" style="--a:${g[0].at.toFixed(2)}s;--b:${(groups[k + 1] ? groups[k + 1][0].at : s.end).toFixed(2)}s">${
    g.map((w) => `<span class="w" style="--t:${w.at.toFixed(2)}s">${esc(w.w.replace(/[ً-ْ]/g, ''))}</span>`).join(' ')}</div>`).join('');
}

function pageHtml(dir, spec, slides) {
  const [W, H] = spec.size;
  const face = (family, pkg, subset, w) => `@font-face{font-family:${family};font-weight:${w};src:url(${url(require.resolve(`@fontsource/${pkg}/files/${pkg}-${subset}-${w}-normal.woff2`))})}`;
  const c = { bg: '#0f172a', text: '#f8fafc', accent: '#38bdf8', muted: '#94a3b8', ...spec.colors };
  return `<!doctype html><html lang="${spec.lang || 'en'}" dir="${spec.dir || 'ltr'}"><head><meta charset="utf-8"><style>
${face('Inter', 'inter', 'latin', 400)}${face('Inter', 'inter', 'latin', 800)}${face('Cairo', 'cairo', 'arabic', 400)}${face('Cairo', 'cairo', 'arabic', 800)}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;overflow:hidden;background:${c.bg};color:${c.text};font-family:Inter,Cairo,sans-serif}
.sc{position:absolute;inset:0;opacity:0;animation:on 1ms linear var(--s) forwards, off 1ms linear var(--e) forwards}
@keyframes on{to{opacity:1}} @keyframes off{to{opacity:0}}
.slide{position:absolute;inset:${H * 0.09}px ${W * 0.07}px;display:flex;flex-direction:column;gap:${H * 0.035}px}
h1{font-size:${H * 0.075}px;font-weight:800;line-height:1.15;color:${c.text}}
h1::after{content:"";display:block;width:${W * 0.06}px;height:8px;margin-top:${H * 0.02}px;border-radius:4px;background:${c.accent}}
.sub{font-size:${H * 0.035}px;color:${c.muted}}
.body{flex:1;min-height:0;display:flex;gap:${W * 0.04}px;align-items:center}
ul{flex:1;list-style:none;display:flex;flex-direction:column;gap:${H * 0.03}px}
li{font-size:${H * 0.042}px;line-height:1.35;padding-inline-start:${H * 0.05}px;position:relative}
li::before{content:"";position:absolute;inset-inline-start:0;top:.45em;width:.5em;height:.5em;border-radius:50%;background:${c.accent}}
.media{flex:1;min-width:0;max-height:100%;object-fit:contain;border-radius:18px;box-shadow:0 20px 60px #0008}
.split .media{flex:1.2}
.cover{justify-content:center;align-items:center;text-align:center}.cover h1{font-size:${H * 0.1}px}.cover h1::after{margin-inline:auto}.cover .body{display:none}
${spec.captions ? `.slide{bottom:${H * 0.16}px}` : ''}
/* entrances: class + style="--t:<seconds>" (use them in your own html too) */
.up{animation:up .6s cubic-bezier(.2,.8,.2,1) var(--t) both} @keyframes up{from{transform:translateY(40px);opacity:0}}
.fade{animation:fade .6s ease var(--t) both} @keyframes fade{from{opacity:0}}
.pop{animation:pop .5s cubic-bezier(.3,1.5,.5,1) var(--t) both} @keyframes pop{from{transform:scale(0);opacity:0}}
.caps{position:absolute;left:10%;right:10%;bottom:${H * 0.05}px;height:${H * 0.08}px}
.line{position:absolute;inset:0;text-align:center;font-size:${H * 0.036}px;font-weight:800;opacity:0;
  animation:on 1ms linear var(--a) forwards, off 1ms linear var(--b) forwards}
.line .w{display:inline-block;margin:0 .1em;padding:.05em .2em;border-radius:8px;background:#000a;animation:lit .1s linear var(--t) forwards}
@keyframes lit{to{color:${c.accent}}}
${spec.css || ''}
</style></head><body>
${slides.map((s) => {
    const T = helpers(s, dir);
    return `<section class="sc" style="--s:${s.start}s;--e:${s.end}s">${slideHtml(s, T)}${spec.captions && s.words.length ? `<div class="caps">${captions(s)}</div>` : ''}</section>`;
  }).join('\n')}
<script>
// Show exactly the frame at <ms>: every CSS animation paused at that time, every clip on its frame.
window.seek = (ms, fps) => {
  for (const a of document.getAnimations()) { a.pause(); a.currentTime = ms; }
  const waits = [];
  for (const el of document.querySelectorAll('[data-frames]')) {
    const n = Math.min(+el.dataset.count, Math.max(1, Math.floor((ms / 1000 - el.dataset.from) * fps) + 1));
    const src = el.dataset.frames + '/' + String(n).padStart(5, '0') + '.jpg';
    if (el.getAttribute('src') !== src) { el.setAttribute('src', src); waits.push(el.decode().catch(() => {})); }
  }
  return Promise.all(waits);
};
</script></body></html>`;
}

async function openPage(dir, spec, slides, out) {
  const file = path.join(out, 'page.html');
  fs.writeFileSync(file, pageHtml(dir, spec, slides));
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const page = await browser.newPage({ viewport: { width: spec.size[0], height: spec.size[1] } });
  await page.goto(url(file), { waitUntil: 'load' }); // a real file (not setContent) so file:// images load
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))));
  return { browser, page };
}

async function renderFrames(page, spec, total, file) {
  const ff = spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(spec.fps), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', file], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((resolve, reject) => ff.on('close', (c) => (c ? reject(new Error(`ffmpeg exit ${c}`)) : resolve())));
  const write = (buf) => new Promise((resolve) => (ff.stdin.write(buf) ? resolve() : ff.stdin.once('drain', resolve)));
  const frames = Math.round(total * spec.fps);
  for (let f = 0; f < frames; f++) {
    await page.evaluate(([ms, fps]) => window.seek(ms, fps), [(f * 1000) / spec.fps, spec.fps]);
    await write(await page.screenshot({ type: 'jpeg', quality: 92 }));
    if (f % spec.fps === 0) process.stdout.write(`\rframes: ${(f / spec.fps).toFixed(0)}/${total.toFixed(0)} s`);
  }
  ff.stdin.end();
  await done;
  process.stdout.write('\n');
}

// Each voice at its slide time + optional music, quieter under the voice (ducking); all at -14 LUFS.
async function mix(dir, spec, slides, total, picture, file) {
  const said = slides.filter((s) => s.audio);
  const inputs = ['-i', picture, ...said.flatMap((s) => ['-i', s.audio])];
  const parts = said.map((s, k) => `[${k + 1}:a]adelay=${Math.round(s.voiceAt * 1000)}:all=1[v${k}]`);
  let f = said.length
    ? `${parts.join(';')};${said.map((_, k) => `[v${k}]`).join('')}amix=inputs=${said.length}:normalize=0,apad=whole_dur=${total}`
    : `anullsrc=r=48000:cl=stereo,atrim=0:${total}`;
  if (spec.music) {
    inputs.push('-stream_loop', '-1', '-i', path.join(dir, spec.music));
    f += `,asplit=2[voice][key];[${said.length + 1}:a]atrim=0:${total},volume=${spec.musicVolume ?? 0.25},afade=t=out:st=${Math.max(0, total - 2)}:d=2[bed];`
      + '[bed][key]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=900[duck];[voice][duck]amix=inputs=2:normalize=0';
  }
  f += ',loudnorm=I=-14:TP=-1.5:LRA=11[a]';
  await run(FFMPEG, ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', f, '-map', '0:v', '-map', '[a]',
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-t', String(total), '-movflags', '+faststart', file]);
}

(async () => {
  const [name, flag, arg] = process.argv.slice(2);
  if (!name) { console.log('usage: node render.js <project> [--stills | --frame <seconds>]'); process.exit(1); }
  const dir = path.resolve('projects', name);
  const out = path.join(dir, 'out');
  fs.mkdirSync(out, { recursive: true });
  const spec = { size: [1920, 1080], fps: 30, ...require(path.join(dir, 'video.js')) };
  const slides = await timeline(dir, spec, out);
  const total = slides.at(-1).end;
  const { browser, page } = await openPage(dir, spec, slides, out);
  try {
    if (flag === '--stills' || flag === '--frame') {
      const times = flag === '--frame' ? [[+arg, 'frame.jpg']] : slides.map((s, k) => [s.end - 0.3, `still-${k + 1}.jpg`]);
      for (const [t, f] of times) {
        await page.evaluate(([ms, fps]) => window.seek(ms, fps), [t * 1000, spec.fps]);
        await page.screenshot({ path: path.join(out, f), type: 'jpeg' });
      }
      console.log(`pictures → ${out}`);
      return;
    }
    const picture = path.join(out, 'picture.mp4');
    await renderFrames(page, spec, total, picture);
    await mix(dir, spec, slides, total, picture, path.join(out, 'video.mp4'));
    console.log(`${total.toFixed(1)} s → ${path.join(out, 'video.mp4')}`);
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error(e.message); process.exit(1); });
