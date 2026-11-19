// Gemini voice for every slide of projects/<name>/video.js that has `text` and an `audio` file not made yet.
// Usage: node tts.js <name> [voice]     (key GEMINI_API_KEY in .env; free tier ≈ 10 calls/day, 3/minute)
require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const FFMPEG = require('ffmpeg-static');

const run = promisify(execFile);
const MODEL = process.env.GEMINI_TTS_MODEL || 'gemini-3.8-flash-tts'; // check the current TTS model name in the Gemini docs
// Notes for the "director" (never spoken), then the transcript (the only part that is read).
// Without this exact layout, Gemini reads the notes aloud too.
const NOTES = `### DIRECTOR'S NOTES
Style: a clear, friendly presenter, confident and warm, like a good product demo.
Pace: natural, short pauses at commas and full stops.`;

async function speak(text, file, voice) {
  const body = {
    contents: [{ parts: [{ text: `${NOTES}\n\n#### TRANSCRIPT\n${text}` }] }],
    generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } },
  };
  let res;
  for (let attempt = 1; ; attempt++) {
    res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST', headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (res.status < 500 || attempt === 3) break; // 5xx now and then: retry; 429 = daily quota used, stop
    await new Promise((r) => setTimeout(r, 3000 * attempt));
  }
  const data = await res.json();
  if (!res.ok) throw new Error(`Gemini TTS ${res.status}: ${data.error?.message || 'no message'}`);
  const audio = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData;
  if (!audio) throw new Error('Gemini returned no audio');
  // 24 kHz 16-bit mono PCM → mp3, silence trimmed at both ends
  const pcm = file.replace(/\.\w+$/, '.pcm');
  fs.writeFileSync(pcm, Buffer.from(audio.data, 'base64'));
  const trim = 'silenceremove=start_periods=1:start_threshold=-45dB';
  await run(FFMPEG, ['-y', '-loglevel', 'error', '-f', 's16le', '-ar', '24000', '-ac', '1', '-i', pcm,
    '-af', `${trim},areverse,${trim},areverse`, '-b:a', '128k', file]);
  fs.unlinkSync(pcm);
}

(async () => {
  const [name, voice = 'Charon'] = process.argv.slice(2);
  if (!name) { console.log('usage: node tts.js <project> [voice]'); process.exit(1); }
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY missing in .env');
  const dir = path.resolve('projects', name);
  const todo = require(path.join(dir, 'video.js')).slides.filter((s) => s.audio && s.text && !fs.existsSync(path.join(dir, s.audio)));
  for (const [k, s] of todo.entries()) {
    if (k) await new Promise((r) => setTimeout(r, 21e3)); // stay under 3 calls per minute
    const file = path.join(dir, s.audio);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    await speak(s.text, file, voice);
    console.log(`✓ ${s.audio}`);
  }
  console.log(todo.length ? 'done — listen to every file before rendering' : 'nothing to voice (all audio files exist)');
})().catch((e) => { console.error(e.message); process.exit(1); });
