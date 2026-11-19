#!/usr/bin/env node
// Final sound mix from a cue sheet: voice lines at their times, sound effects, clip sounds, and a music bed that ducks
// under the voice (sidechain) and fades out; everything brought to -14 LUFS / -1.5 dBTP (Reels, Shorts, TikTok, YouTube).
// With "video" the result is the finished MP4 (picture copied, not re-encoded); without it a WAV.
//
//   node mix.mjs cues.json
//
// cues.json (paths are relative to the cue file):
// {
//   "video": "picture.mp4",            optional: the rendered picture (no sound needed)
//   "out": "final.mp4",                .mp4 with a video, else .wav
//   "duration": 32.5,                  optional: default = the video's length (or the last sound's end)
//   "voice": [{ "file": "voice/1.mp3", "at": 0.25 }],                 at = second on the video
//   "sfx":   [{ "name": "whoosh", "at": 3.1 }, { "name": "riser:1.2", "at": 8 }, { "file": "door.wav", "at": 5, "gain": -6 }],
//   "music": { "file": "music.mp3", "lufs": -31, "from": 0, "release": 900, "fadeIn": 1, "fadeOut": 2 },
//   "voiceGain": 4,                    dB added to the voice bus before the mix (default 4)
//   "loudness": -14
// }
// Music "lufs": the bed's level before ducking (-31 with a voice on top, about -24 for music-only parts / logo outros).
// "release" (ms): how fast the music comes back in pauses (900 = calm; 400 = a livelier bed).
import fs from 'node:fs';
import path from 'node:path';
import { ff, duration, loudness, readJson, args } from './lib.mjs';
import { sfxFile } from './sfx.mjs';

const a = args();
const cueFile = a._[0];
if (!cueFile) { console.log('usage: node mix.mjs cues.json'); process.exit(1); }
const cues = readJson(cueFile);
const base = path.dirname(path.resolve(cueFile));
const at = (f) => path.resolve(base, f);
const tmp = path.join(base, '.mix');
fs.mkdirSync(tmp, { recursive: true });

// every sound with its start time; effects by name are generated (and cached) first
const sounds = [];
for (const v of cues.voice || []) sounds.push({ file: at(v.file), at: v.at, gain: v.gain || 0, bus: 'voice' });
for (const s of cues.sfx || []) {
  const file = s.file ? at(s.file) : await sfxFile(s.name, path.join(tmp, `sfx-${s.name.replace(':', '-')}.wav`));
  sounds.push({ file, at: s.at, gain: s.gain || 0, bus: 'fx' });
}
let total = cues.duration;
if (!total && cues.video) total = await duration(at(cues.video));
if (!total) for (const s of sounds) total = Math.max(total || 0, s.at + await duration(s.file));
if (!total) throw new Error('nothing to mix');

const inputs = [];
const parts = [];
const voiceTags = [];
const fxTags = [];
const vIdx = cues.video ? 1 : 0;
if (cues.video) inputs.push('-i', at(cues.video));
for (const [k, s] of sounds.entries()) {
  inputs.push('-i', s.file);
  const tag = `s${k}`;
  parts.push(`[${k + vIdx}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=${s.gain}dB,adelay=${Math.max(0, Math.round(s.at * 1000))}:all=1[${tag}]`);
  (s.bus === 'voice' ? voiceTags : fxTags).push(`[${tag}]`);
}
const mixOf = (tags, out) => (tags.length === 1 ? `${tags[0]}apad=whole_dur=${total}[${out}]`
  : `${tags.join('')}amix=inputs=${tags.length}:normalize=0,apad=whole_dur=${total}[${out}]`);
const silence = (out) => `anullsrc=r=48000:cl=stereo,atrim=0:${total}[${out}]`;
parts.push(voiceTags.length ? mixOf(voiceTags, 'vraw') : silence('vraw'));
parts.push(`[vraw]volume=${cues.voiceGain ?? 4}dB,asplit=2[voice][key]`);
parts.push(fxTags.length ? mixOf(fxTags, 'fx') : silence('fx'));
let last = '[voice][fx]';
let n = 2;
if (cues.music) {
  const m = cues.music;
  const file = at(m.file);
  const idx = sounds.length + vIdx;
  inputs.push('-stream_loop', '-1', '-i', file);
  const level = (m.lufs ?? -31) - ((await loudness(file, { seconds: 60 })).lufs ?? -14);
  const fadeOut = m.fadeOut ?? 2;
  parts.push(`[${idx}:a]aformat=sample_rates=48000:channel_layouts=stereo,atrim=${m.from || 0}:${(m.from || 0) + total},asetpts=PTS-STARTPTS,volume=${level.toFixed(1)}dB,`
    + `afade=t=in:d=${m.fadeIn ?? 1},afade=t=out:st=${Math.max(0, total - fadeOut).toFixed(2)}:d=${fadeOut}[bed]`);
  parts.push(voiceTags.length ? `[bed][key]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=${m.release ?? 900}[music]` : '[bed]anull[music]');
  if (!voiceTags.length) parts.push('[key]anullsink');
  last += '[music]';
  n = 3;
} else parts.push('[key]anullsink');
parts.push(`${last}amix=inputs=${n}:normalize=0,loudnorm=I=${cues.loudness ?? -14}:TP=-1.5:LRA=11,aresample=48000[a]`);

const out = at(cues.out || (cues.video ? 'final.mp4' : 'mix.wav'));
const enc = cues.video
  ? ['-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart']
  : ['-map', '[a]', '-c:a', 'pcm_s16le'];
await ff([...inputs, '-filter_complex', parts.join(';'), ...enc, '-ar', '48000', '-t', String(total), out]);
const l = await loudness(out);
console.log(`${total.toFixed(2)} s, ${l.lufs} LUFS, peak ${l.peak} dBFS → ${out}`);
