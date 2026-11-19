# Voice

## Options (all free unless said)
| Voice | When | Notes |
|---|---|---|
| **Gemini TTS** (`scripts/gemini-tts.mjs`) | Default narrator, characters | Free key at aistudio.google.com. Free tier ≈ **10 calls/day, 3/minute**, resets at midnight Pacific. **On 429: stop and tell the owner; continue tomorrow.** 5xx: retry ×3. No word times → align. |
| **Own recording** | Presentations, personal videos | Audacity: noise reduction, normalize −1 dB. The text must be exactly what was said. |
| **edge-tts** (`pip install edge-tts`) | Quick drafts, many languages | No key. 403 → `pip install -U edge-tts`. Gives word times itself. |
| **ElevenLabs** | Only on a paid plan (free plan forbids commercial use) | Bring each take to −18 LUFS so two speakers match. |
| **Clip voices** (Veo / Omni in Flow) | Characters talking on camera | Omni kept the SAME character voice across Reels. Wrong voice → dub it (see `ai-visuals.md`). |

## Gemini prompt layout (never change it)
```
### DIRECTOR'S NOTES
Style: a warm, calm science documentary narrator, clear Modern Standard Arabic. Follow the harakat exactly.
Pace: natural, short pauses at commas, a real question tone on «؟».

#### TRANSCRIPT
<the text, the only part that is spoken>
```
Anything else before the transcript gets read aloud. One mood per take: two moods in the notes («triumphant, then
warm on X») made Gemini SAY X twice.

## Save calls: one batch take, cut per line
Voice all lines of one speaker in ONE call (lines separated by blank lines = one natural read), align the batch,
cut it into one file per line at the middle of the pauses between lines. Keep every take named
`<Voice>-<sha1(text)[:10]>.mp3`: a rebuild reuses the take that was approved; a changed line gets a new take.
An interrupted run leaves `<Voice>-batch.mp3`: reuse it, don't pay a new call.

## Check every take before building
- Listen once fully. Then check the aligned words: a word much longer than its syllables = stretched («غرفتاا»)
  or extra speech glued to it; two copies of a phrase = repeat (look at the loudness envelope).
- Level takes: re-recorded lines can come back ~3 dB louder. Measure each (`ebur128`) and bring them together.
- Pauses: cut silences > 0.4 s inside a line at word boundaries (keep 0.2 s each side, 10 ms fades).
- Fix tiny timing by editing the cut file + shifting the later word times in its JSON (no new call).

## Voice effects (ffmpeg)
- Phone, bad line: `highpass=f=420,lowpass=f=2900,acompressor=threshold=-24dB:ratio=7:attack=4:release=70:makeup=7dB,acrusher=bits=9:mode=log:aa=1:mix=0.22` + a little noise.
- Phone, clear call: `highpass=f=300,lowpass=f=3400,acompressor=threshold=-20dB:ratio=3:attack=6:release=90:makeup=3dB`.
- Small rate change to fit a clip: `atempo=0.9…1.1` is invisible; picture rate ×1.2 is invisible too.

## Text rules for any TTS
Numbers and units written as words when they must be read a certain way; no abbreviations (كيلومتر not كم); short
sentences; a comma where a breath should be. Arabic: see `arabic.md` (full harakat, «ة» before a pause, sukun before «…»).
