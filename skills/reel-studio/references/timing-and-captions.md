# Word timing and captions

Everything in the picture is placed on the voice: a word is said → its picture appears. So the first job after the
voice is the time of every word.

## Word times
- edge-tts gives them. Gemini, ElevenLabs (without timestamps) and own recordings don't → **forced alignment**:
  `python scripts/align_words.py <ffmpeg> take.mp3 < take.txt` → `[{ "t": 0.42, "d": 0.31, "w": "الْماءَ" }]`.
  Meta MMS aligner on romanized text, CPU, ~1.2 GB model downloaded once, **≈ 3.7 GB RAM while running** (one at a
  time; check `free -g`). The text must be exactly what is said.
- **Licence:** the MMS_FA weights are **CC-BY-NC 4.0 (non-commercial)**. Commercial projects: use Whisper word
  timestamps (MIT weights, e.g. `faster-whisper` with `word_timestamps=True`) and match the words to the script.
- Cache the result next to the take (`take.json` with the text): re-align only when the text changes.
- Scene time = scene start + lead (0.25 s) + word time. Keep a helper per scene:
  `T.at('word', n)` (start of the n-th word containing it), `T.after('word')` (its end), `T.w(i)` (word i,
  negative from the end), `T.words` (all, e.g. a mouth that opens on every word). Look words up WITHOUT harakat
  and by the voice spelling («T.at('عصارة')» fails when the voice says «عصاره»).
- A lookup that misses must throw (a silent fallback puts animations at 0 s).

## Captions (social videos)
- 2–3 words a group, a new group after a comma/full stop or past ~16 characters.
- The word being said lights up (accent colour, scale 1.1, 0.1 s); the group pops in (0.14 s), cuts out (0.08 s).
- Big and bold (≈ 86 px at 1080 wide), white with a dark outline built from 8 text-shadows + a soft drop shadow.
- **Caption zone y ≈ 1250–1500** on 1080×1920: keep art out of it; platform buttons cover the bottom ~350 px and
  the right ~120 px.
- Screen text has **no harakat** (strip `[ً-ْٰـ]`); spoken spellings map back to written ones with a
  `show` list: `[['حِمْيَه', 'حمية'], ['خَمْسَة فاصِلَة سَبْعَة بِالْمِئَة', '5.7%']]`.
- Don't put long Latin words in Arabic captions (they overlap when the active word scales): keep them on cards.
- Scenes that show their own words (the hook title) turn captions off.
- `¾`-style glyphs render as `%` in some fonts: write 75%.
- Burned-in captions only: platform auto-captions are off by default for most viewers.

## SRT (for YouTube long-form or presentations)
Group words into ≤ 42-character lines, ≤ 2 lines, 1–6 s each, from the same word times; burn with
`subtitles=file.srt:force_style='FontName=Cairo,FontSize=22'` or upload the .srt.
