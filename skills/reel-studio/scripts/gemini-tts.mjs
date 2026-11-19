#!/usr/bin/env node
// Gemini text-to-speech (free tier key from aistudio.google.com) → trimmed MP3. No packages needed (Node 22 fetch).
//   node gemini-tts.mjs --voice Charon --text "…" --out take.mp3 [--notes notes.txt] [--model <tts model>]
//   node gemini-tts.mjs --voice Kore --file lines.txt --out take.mp3        (several lines = ONE natural read, ONE call)
// The key: env GEMINI_API_KEY, else GEMINI_API_KEY=… in ./.env. It is never printed.
// Free tier ≈ 10 calls a day and 3 a minute (resets at midnight Pacific). On 429: stop, don't retry, wait for tomorrow.
// Gemini gives no word times: run align_words.py on the take afterwards.
// The prompt MUST keep the layout "### DIRECTOR'S NOTES … #### TRANSCRIPT …": anything else before the text is read aloud.
import fs from 'node:fs';
import path from 'node:path';
import { ff, args } from './lib.mjs';

const a = args();
const text = a.text || (a.file && fs.readFileSync(a.file, 'utf8').trim());
if (!text || !a.out) {
  console.log('usage: node gemini-tts.mjs --voice <Name> (--text "…" | --file f.txt) --out take.mp3 [--notes notes.txt] [--model m]');
  process.exit(1);
}
function key() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  const env = path.resolve('.env');
  if (fs.existsSync(env)) {
    const m = fs.readFileSync(env, 'utf8').match(/^\s*GEMINI_API_KEY\s*=\s*"?([^"\n]+)"?/m);
    if (m) return m[1].trim();
  }
  throw new Error('GEMINI_API_KEY is not set (env or ./.env)');
}
// check the current TTS model name in the Gemini API docs if this one stops working
const MODEL = a.model || process.env.GEMINI_TTS_MODEL || 'gemini-3.8-flash-tts';
const NOTES = a.notes ? fs.readFileSync(a.notes, 'utf8').trim() : `### DIRECTOR'S NOTES
Style: a warm, calm documentary narrator. Follow the written vowels (harakat) exactly.
Pace: natural, short pauses at commas, a real question tone on questions.`;
if (!NOTES.startsWith("### DIRECTOR'S NOTES")) throw new Error("the notes must start with: ### DIRECTOR'S NOTES");

const body = {
  contents: [{ parts: [{ text: `${NOTES}\n\n#### TRANSCRIPT\n${text}` }] }],
  generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: a.voice || 'Charon' } } } },
};
let res;
for (let attempt = 1; ; attempt++) {
  res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: 'POST', headers: { 'x-goog-api-key': key(), 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  // 5xx now and then on the TTS models: a retry usually works. 429 = quota: never hammer it.
  if (res.status < 500 || attempt === 3) break;
  await new Promise((r) => setTimeout(r, 3000 * attempt));
}
const data = await res.json();
if (!res.ok) throw new Error(`Gemini TTS ${res.status}: ${data.error?.message || 'no message'}`);
const audio = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData;
if (!audio) throw new Error(`no audio came back (${data.candidates?.[0]?.finishReason || 'no reason'})`);
const pcm = a.out.replace(/\.\w+$/, '.pcm');
fs.writeFileSync(pcm, Buffer.from(audio.data, 'base64'));
const trim = 'silenceremove=start_periods=1:start_threshold=-45dB';
await ff(['-f', 's16le', '-ar', '24000', '-ac', '1', '-i', pcm, '-af', `${trim},areverse,${trim},areverse`, '-b:a', '128k', a.out]);
fs.unlinkSync(pcm);
console.log(a.out);
