# Time of every word in a recording whose text we already know (forced alignment), for voices that give no word times
# (Gemini, ElevenLabs without timestamps, your own recording). Meta's MMS aligner (torchaudio MMS_FA, ~1.2 GB, downloaded once
# to ~/.cache/torch), on uroman-romanized text, CPU only, any language uroman can romanize (Arabic, French, English…).
# Usage: python align_words.py <ffmpeg> <audio>  < text   →  JSON [{"t": start, "d": length, "w": word}]
# RAM: ~3.7 GB while it runs: one at a time, check `free -g` first.
# LICENCE: the MMS_FA model weights are CC-BY-NC 4.0 (non-commercial). For commercial work, take word times from
# Whisper instead (MIT weights), e.g. faster-whisper with word_timestamps=True, and match them to your text.
# Words = the text split on spaces, punctuation stripped (Arabic harakat kept).
import json
import re
import subprocess
import sys

import numpy as np
import torch
import torchaudio
import uroman

SR = 16000


def main(ffmpeg, audio):
    words = [w for w in (re.sub(r"[^\wً-ْٰ]", "", t) for t in sys.stdin.read().split()) if w]
    pcm = subprocess.run([ffmpeg, "-v", "error", "-i", audio, "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    wave = torch.from_numpy(np.frombuffer(pcm, np.int16).astype(np.float32) / 32768).unsqueeze(0)

    bundle = torchaudio.pipelines.MMS_FA
    model, tokenizer, aligner = bundle.get_model(with_star=False), bundle.get_tokenizer(), bundle.get_aligner()
    roman = uroman.Uroman()
    # Romanized, only letters the model knows; a word with none left (rare) gets its time from its neighbours.
    keep = set(bundle.get_dict())
    latin = ["".join(c for c in roman.romanize_string(w).lower() if c in keep and c != "-") for w in words]
    idx = [k for k, r in enumerate(latin) if r]

    with torch.inference_mode():
        emission, _ = model(wave)
        spans = aligner(emission[0], tokenizer([latin[k] for k in idx]))
    step = wave.size(1) / emission.size(1) / SR
    times = {k: (s[0].start * step, s[-1].end * step) for k, s in zip(idx, spans)}
    out = []
    for k, w in enumerate(words):
        if k not in times:  # squeeze it in between its neighbours
            prev = out[-1]["t"] + out[-1]["d"] if out else 0.0
            nxt = next((times[j][0] for j in range(k + 1, len(words)) if j in times), prev)
            times[k] = (prev, max(prev, nxt))
        t0, t1 = times[k]
        out.append({"t": round(t0, 3), "d": round(t1 - t0, 3), "w": w})
    print(json.dumps(out, ensure_ascii=False))


main(*sys.argv[1:3])
