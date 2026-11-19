---
name: presentation-video
description: Make a presentation video (slides + voice-over + screen recordings + captions + music) from code with free tools — Node, Playwright, ffmpeg, a free AI voice or your own voice, and word timing so each bullet appears exactly when it is said. Use when asked to "make a presentation video", "turn these slides into a video", "product demo video", "explainer with voice-over" or "pitch video".
---

# Presentation video kit

Make a 16:9 presentation video (or 9:16 for Reels/Shorts) the way a motion designer would, but **from code**:

- you write the slides in one small file (`video.js`): title, bullets, image or screen recording, and what is said;
- a voice reads each slide (an AI voice for free, or your own recording);
- every word of the voice gets its exact time, so **each bullet appears the moment it is said**, and captions
  light up word by word;
- the slides are HTML/CSS (any design you can make in a web page), rendered frame by frame into an MP4 with
  the voice and quiet background music.

Everything here is **free**. Tested on Linux (Ubuntu) with Node 22; it works on macOS and Windows (WSL) the same way.

---

## 1. Tools you need (and why)

| Tool | What it does here | Cost | Install |
|---|---|---|---|
| **Node.js 22** | Runs the renderer | Free | `nvm install 22` ([nvm](https://github.com/nvm-sh/nvm)) |
| **Playwright** (Chromium) | Opens the slides as a web page and takes one screenshot per frame | Free | `npm i playwright && npx playwright install chromium` |
| **ffmpeg** (`ffmpeg-static`, `ffprobe-static`) | Turns the screenshots into a video, mixes voice + music, cuts screen recordings | Free | `npm i ffmpeg-static ffprobe-static` (no system ffmpeg needed) |
| **Fonts** (`@fontsource/*`) | Real fonts set by code (Inter for Latin, Cairo for Arabic) | Free | `npm i @fontsource/inter @fontsource/cairo` |
| **Python 3.10+ venv** with `torch`, `torchaudio`, `uroman` | **Word timing** (forced alignment): finds when each word is said in the audio | Free, CPU only, ~1.2 GB model downloaded once. The MMS model is **CC-BY-NC 4.0 (non-commercial)**: for commercial videos use Whisper word timestamps (MIT) | see step 2 |
| **A voice** (pick one) | Reads the slides | Free | see section 4 |
| **OBS Studio** (optional) | Screen recordings of an app/website demo | Free | [obsproject.com](https://obsproject.com) |
| **Audacity** (optional) | Record your own voice, cut noise | Free | [audacityteam.org](https://www.audacityteam.org) |
| **Music** (optional) | Quiet background bed | Free | [Pixabay Music](https://pixabay.com/music/) or YouTube Audio Library (check each track's license) |

**What about Remotion?** Remotion (React → video) is a good alternative and does the same job; see section 9.
This kit uses plain HTML/CSS + Playwright instead: no React, no build step, and it is what the code below was
tested with.

---

## 2. Setup (once)

```bash
mkdir presentation-video && cd presentation-video
npm init -y
npm i playwright ffmpeg-static ffprobe-static @fontsource/inter @fontsource/cairo
npx playwright install chromium          # on Linux, if it asks: npx playwright install-deps

python3 -m venv .venv
.venv/bin/pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu
.venv/bin/pip install uroman numpy edge-tts
```

Then copy `render.js`, `align_words.py` (and `tts.js` if you use the Gemini voice) from this skill's `scripts/` folder (section 8).

Folder layout:

```
presentation-video/
├── render.js           ← the renderer (section 8)
├── align_words.py      ← word timing (section 8)
├── tts.js              ← optional: Gemini voice for every slide (section 8)
├── .env                ← GEMINI_API_KEY=...   (never share/commit this file)
└── projects/
    └── my-demo/
        ├── video.js    ← the slides + what is said
        ├── voice/      ← 1.mp3, 2.mp3 … (one per slide)
        ├── art/        ← images, screenshots, logos
        ├── rec/        ← screen recordings (.mp4)
        ├── music.mp3   ← optional
        └── out/        ← video.mp4, stills (made by render.js)
```

**RAM:** word timing uses ~3–4 GB the first time per slide (cached after), rendering ~1 GB. Close heavy apps on an
8 GB machine. Speed: about **2–3 s of work per second of video** at 1080p on a laptop.

---

## 3. The workflow (do it in this order)

1. **Script first.** Write what will be said, slide by slide. ~130–150 words per minute in English
   (~100–110 in Arabic). A 2-minute presentation ≈ 8–12 slides. Read it out loud once before recording.
2. **Slides file** `projects/<name>/video.js` (section 5): title, bullets with their cue words, image/clip, text.
3. **Voice** for each slide → `voice/1.mp3`, `voice/2.mp3`… (section 4). Listen to all of them.
4. **Check the look fast:** `node render.js <name> --stills` → one picture per slide in `out/`. Fix layout.
5. **Render:** `node render.js <name>` → `projects/<name>/out/video.mp4`. Watch it fully once.
6. Fix → render again (voices and word times are cached; only changed slides are re-timed).

---

## 4. The voice (free options)

The text in `video.js` must be **exactly what is said** in the audio file (that is how word timing works).

**A. Your own voice (best for a real presentation).** Record each slide as its own file in Audacity
(Effect → Noise Reduction, then Normalize to −1 dB), export `voice/1.mp3`, `voice/2.mp3`… and paste what you
actually said into `text`.

**B. Microsoft Edge voices (free, no key).** Many languages and accents:

```bash
.venv/bin/edge-tts --list-voices | grep -E "en-US|ar-"          # pick one
.venv/bin/edge-tts --voice en-US-AndrewNeural --text "Welcome to our app." --write-media projects/my-demo/voice/1.mp3
```

If it fails with **403**, update it: `.venv/bin/pip install -U edge-tts` (Microsoft changes its token now and then).

**C. Google Gemini TTS (free tier, the most natural).** Get a free key at
[aistudio.google.com](https://aistudio.google.com) → put `GEMINI_API_KEY=...` in `.env` → `node tts.js <name>`
voices every slide that has `text` but no audio yet. Free tier ≈ **10 calls per day, 3 per minute**; on a
`429` error wait until tomorrow (never switch to a paid key by accident). Voices: Charon, Kore, Puck, Iapetus,
Enceladus, Leda… The prompt **must** keep the `### DIRECTOR'S NOTES … #### TRANSCRIPT` layout, otherwise the
notes are read aloud. If the model name stops working, check the current TTS model name in the Gemini API docs
and change `MODEL` in `tts.js`.

**D. ElevenLabs** — very good, but the free plan does not allow commercial use. Only if you pay.

Rules for good voice text: numbers and units in words when they must be read a certain way ("twenty percent"),
no abbreviations the voice could misread, short sentences, a comma where you want a breath.

---

## 5. Writing `video.js`

```js
// projects/my-demo/video.js
module.exports = {
  size: [1920, 1080],          // 16:9. Vertical Reel/Short: [1080, 1920]
  fps: 30,
  lang: 'en', dir: 'ltr',      // Arabic: lang: 'ar', dir: 'rtl'
  captions: true,              // word-by-word captions at the bottom (good for social media)
  music: 'music.mp3',          // optional; looped, ducked under the voice, faded out at the end
  musicVolume: 0.25,           // optional
  colors: { bg: '#0f172a', text: '#f8fafc', accent: '#38bdf8', muted: '#94a3b8' },   // optional theme
  css: '',                     // optional extra CSS (your brand)

  slides: [
    // cover slide, no voice: lasts `dur` seconds
    { title: 'Taskly in 90 seconds', subtitle: 'Product demo · May 2026', dur: 3 },

    // title + bullets; each bullet appears when its cue word is said (the 2nd item of each pair)
    { audio: 'voice/1.mp3',
      text: 'Teams lose hours every week. Tasks live in chats, emails and sticky notes.',
      title: 'The problem',
      bullets: [['Hours lost every week', 'hours'], ['Tasks in chats and emails', 'chats'], ['Sticky notes everywhere', 'sticky']],
      image: 'art/problem.png' },                       // optional picture on the side

    // screen recording: plays in sync with the video (slide lasts at least as long as the clip)
    { audio: 'voice/2.mp3', text: 'Here is how you add a task in two clicks.', title: 'Live demo', clip: 'rec/add-task.mp4' },

    // fully custom slide: any HTML; T.at('word') = the second that word is said
    { audio: 'voice/3.mp3', text: 'Our users saved forty percent of their meeting time.',
      html: (T) => `<div style="position:absolute;inset:0;display:grid;place-items:center">
        <div class="pop" style="--t:${T.at('forty')}s;font:800 260px Inter;color:#38bdf8">40%</div></div>`,
      hold: 1 },                                        // stay 1 s more after the voice ends
  ],
};
```

Slide fields:

| Field | Meaning |
|---|---|
| `audio`, `text` | The voice file and **exactly** what it says (needed for timing) |
| `title`, `subtitle` | Title (with an accent bar) and a smaller line. A slide with only these is centered (cover) |
| `bullets` | `[[text on screen, cue word], …]`. Cue = a word from `text`; `null` = appears at the start |
| `image` | A picture from the project folder (PNG/JPG), shown beside the bullets or alone |
| `clip` | A screen recording (MP4); cut into frames once and played in sync |
| `html(T)` | Your own slide. Helpers: `T.at('word', n)` (n-th time it is said), `T.start`, `T.end`, `T.img('art/x.png')`, `T.words` |
| `dur` | Length of a slide without voice |
| `hold` | Extra seconds after the voice (to let people read) |

Built-in animations for your own HTML: add a class and `style="--t:<seconds>"`:
`up` (slides up), `fade`, `pop` (scales in). You can write any CSS `@keyframes` too: every animation is
paused and set to the exact frame time, so **CSS animations with `animation-delay` = a time in seconds on the
whole video** render perfectly frame by frame. Don't use JavaScript timers (`setTimeout`, `requestAnimationFrame`)
for motion: they don't follow the render clock.

---

## 6. Commands

```bash
node render.js my-demo --stills        # one picture per slide → projects/my-demo/out/still-N.jpg
node render.js my-demo --frame 12.5    # the exact frame at 12.5 s → out/frame.jpg
node render.js my-demo                 # full video → projects/my-demo/out/video.mp4
```

Output: H.264 + AAC, `yuv420p`, `+faststart`, loudness −14 LUFS: plays everywhere and is ready for YouTube,
LinkedIn, Instagram, WhatsApp. If Chromium is somewhere else: `CHROMIUM_PATH=/path/to/chrome node render.js …`.

---

## 7. ffmpeg cookbook (things you'll need around the video)

`FF=$(node -p "require('ffmpeg-static')")` then:

```bash
# Cut a screen recording from 0:12 to 0:40 (re-encode = exact cut)
$FF -ss 12 -to 40 -i rec/raw.mp4 -c:v libx264 -crf 18 -an rec/add-task.mp4

# Speed up a long screen recording ×2 (no sound)
$FF -i rec/raw.mp4 -vf "setpts=PTS/2" -an rec/fast.mp4

# Crop a recording to one area (w:h:x:y), e.g. remove the browser bar
$FF -i rec/raw.mp4 -vf "crop=1920:980:0:100" -an rec/cropped.mp4

# Grab one frame as an image (a thumbnail, or the last frame of a clip)
$FF -ss 5 -i out/video.mp4 -frames:v 1 thumb.jpg
$FF -sseof -0.1 -i rec/add-task.mp4 -frames:v 1 last.jpg

# Clean and level a voice recording
$FF -i raw-voice.wav -af "highpass=f=80,afftdn=nf=-25,loudnorm=I=-16:TP=-1.5" voice/1.mp3

# Make the 16:9 video vertical for Reels/Shorts with a blurred background
$FF -i out/video.mp4 -filter_complex "[0]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=30[bg];[0]scale=1080:-2[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2" -c:a copy vertical.mp4

# Smaller file for WhatsApp/email (higher crf = smaller)
$FF -i out/video.mp4 -c:v libx264 -crf 28 -preset slow -c:a aac -b:a 96k small.mp4

# Join two finished videos (same size/fps) with a 1 s crossfade (offset = length of the first − 1)
$FF -i a.mp4 -i b.mp4 -filter_complex "[0:v][1:v]xfade=transition=fade:duration=1:offset=29[v];[0:a][1:a]acrossfade=d=1[a]" -map "[v]" -map "[a]" joined.mp4

# Burn an .srt subtitle file into a video
$FF -i out/video.mp4 -vf "subtitles=subs.srt:force_style='FontSize=24'" -c:a copy subbed.mp4

# Check length, size, loudness
$(node -p "require('ffprobe-static').path") -v error -show_entries format=duration -of csv=p=0 out/video.mp4
$FF -i out/video.mp4 -af ebur128 -f null - 2>&1 | grep "I:" | tail -1
```

Gotcha: to loop a sound bed, give each copy its own `-i` or use `-stream_loop -1 -i file` (as `render.js`
does); `asplit` + `acrossfade` silently drops a copy.

---

## 8. The code

The three files are in this skill's `scripts/` folder. Copy them into the project folder (next to `projects/`):

```bash
cp <this skill>/scripts/{render.js,align_words.py,tts.js} .
```

| File | What it does |
|---|---|
| `scripts/render.js` | Reads `projects/<name>/video.js`, times every slide to its voice, renders the HTML frame by frame with Playwright, mixes voice + music (ducking, −14 LUFS) |
| `scripts/align_words.py` | Word timing by forced alignment (Meta MMS, torchaudio, CPU): `python align_words.py <ffmpeg> <audio> < text` → `[{t, d, w}]` |
| `scripts/tts.js` | Optional: a Gemini voice for every slide that has `text` and no audio file yet |

They need `npm i playwright ffmpeg-static ffprobe-static @fontsource/inter @fontsource/cairo dotenv` and the
Python venv from section 2.

---

## 9. Remotion instead (optional)

[Remotion](https://www.remotion.dev) builds the video with React components and has a live preview with a
timeline (Remotion Studio). Good if you already know React.

```bash
npx create-video@latest        # pick a template (e.g. "Hello World" or "Blank")
npm run dev                    # opens Remotion Studio in the browser (live preview)
npx remotion render            # → out/video.mp4
```

- Animations use `useCurrentFrame()` + `interpolate()` / `spring()`; slides are `<Sequence from={…} durationInFrames={…}>`.
- Voice: `<Audio src={staticFile('voice/1.mp3')} />` inside each slide's `Sequence`. The word times from
  `align_words.py` (save its JSON in `public/`) work the same way: `frame = seconds * fps`.
- **License:** free for individuals and companies with up to 3 people; bigger companies need a paid
  company license. Check [remotion.dev/license](https://www.remotion.dev/license) before using it at work.

---

## 10. What makes a presentation video good

- **First 5 seconds:** say what the viewer gets ("In 90 seconds: what Taskly does and how to start").
- **One idea per slide**, ≤ 3 bullets, ≤ 6 words each. The voice explains; the screen shows the keywords.
- **Show, don't list:** a screen recording of the real thing beats a bullet about it. Zoom/crop recordings so
  text is readable on a phone.
- **Keep it moving:** a change on screen every 3–6 s (new bullet, new slide, the clip). Long static slides lose people.
- **Readable:** titles ≥ 70 px and body ≥ 40 px at 1080p; strong contrast; captions on for social media
  (most people watch muted).
- **Sound:** voice clear and loud (−14 LUFS overall), music low and calm, no music in the demo parts if it fights the voice.
- **End with one action:** "Try it free at …", a QR code or the link, held 3–4 s.
- **Length:** product demo 60–120 s; social post 30–60 s; class/pitch presentation up to 5–10 min.
- **Honest:** real numbers with a source, real screen recordings, no fake UI.
- **No AI-drawn text:** if you use AI images, ask for no text in them and put titles in with code (AI-drawn
  letters come out wrong).

## 11. Check before sharing

- [ ] Watched the whole `video.mp4` once with sound and once muted (captions readable?)
- [ ] Every bullet appears on its word, nothing appears before it's said
- [ ] No typos on screen (screen text ≠ voice text: proofread it separately)
- [ ] Screen recordings: no private data (emails, tokens, notifications) visible
- [ ] Music license OK; credit it in the description if the license asks
- [ ] Thumbnail: `--frame` at a strong moment, or a designed cover slide

## 12. Troubleshooting

| Problem | Fix |
|---|---|
| `Executable doesn't exist … chromium` | `npx playwright install chromium` (or set `CHROMIUM_PATH`) |
| `"word" is not said in: …` | The cue word isn't in `text`, or `text` doesn't match the audio. Use a word that's really in the line |
| Bullets appear at the wrong moment | `text` must be exactly what's said; delete `voice/N.mp3.words.json` to re-time that slide |
| Arabic text shows in the wrong order | `lang: 'ar', dir: 'rtl'` in `video.js` |
| Font missing / boxes instead of letters | `npm i @fontsource/inter @fontsource/cairo`; another language needs its own `@fontsource` font in `pageHtml` |
| Images don't show | Paths are relative to the project folder (`art/x.png`); check the file name's case |
| `edge-tts` 403 | `.venv/bin/pip install -U edge-tts` |
| Gemini `429` | Free daily quota used: wait until tomorrow |
| Out of memory | Close Chrome/other apps; render one video at a time |
| Render is slow | `--stills` while designing; render the full video only at the end; lower `fps` to 25 |
