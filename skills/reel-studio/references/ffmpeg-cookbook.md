# ffmpeg cookbook

`FF` = `ffmpeg` or the `ffmpeg-static` binary (`node -e 'console.log(require("ffmpeg-static"))'`). Add
`-y -hide_banner -loglevel error` to every command. Put `-ss` BEFORE `-i` for fast seek (frame-exact when re-encoding).
In zsh, `set -- $var` doesn't split words: run multi-step scripts with `bash`.

## Look at things
```bash
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate -of compact clip.mp4
FF -ss 2.25 -i reel.mp4 -frames:v 1 -q:v 2 thumb.jpg                       # one frame (thumbnail)
FF -sseof -0.1 -i clip.mp4 -frames:v 1 last.jpg                             # last frame (next clip's first frame)
FF -i reel.mp4 -vf "fps=1/2,scale=270:-2,tile=6x4:padding=4:color=white" -frames:v 1 sheet.jpg   # contact sheet
FF -i reel.mp4 -af ebur128=framelog=quiet:peak=true -f null - 2>&1 | tail -12                  # loudness + peak
```

## Cut, speed, order
```bash
FF -ss 12 -to 40 -i rec.mp4 -c:v libx264 -crf 18 -c:a aac cut.mp4           # exact cut (re-encode)
FF -i rec.mp4 -vf "setpts=PTS/2" -an fast.mp4                              # ×2, no sound
FF -i clip.mp4 -vf "setpts=PTS*1.2" -af "atempo=0.8333" slower.mp4          # picture + sound slower together
FF -i clip.mp4 -vf reverse -an rewind.mp4                                  # backwards (short clips: RAM)
FF -i a.mp4 -i b.mp4 -filter_complex "[0:v][1:v]xfade=transition=fade:duration=0.4:offset=7.6[v];[0:a][1:a]acrossfade=d=0.4[a]" -map "[v]" -map "[a]" ab.mp4
# offset = length of a − crossfade. Same size/fps/timebase on both (add settb=AVTB,fps=30 if xfade complains)
printf "file 'a.mp4'\nfile 'b.mp4'\n" > list.txt && FF -f concat -safe 0 -i list.txt -c copy joined.mp4   # same codecs only
```

## Frame and size
```bash
FF -i in.mp4 -vf "crop=w:h:x:y" out.mp4                                    # remove a browser bar etc.
FF -i in.mp4 -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" out.mp4   # fill 9:16
FF -i wide.mp4 -filter_complex "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=30:2[bg];[0:v]scale=1080:-2[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2" vertical.mp4   # 16:9 on blurred 9:16
FF -loop 1 -i still.jpg -vf "zoompan=z='min(zoom+0.0008,1.12)':d=150:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30" -t 5 kb.mp4   # Ken Burns (scale the still up 2x first for smoothness)
FF -i in.mp4 -i logo.png -filter_complex "overlay=W-w-60:60" out.mp4        # PNG over video
FF -i green.png -vf "format=rgba,colorkey=0x07F805:0.32:0.06,despill=type=green" key.png   # green key (sample the real green first: scripts/greenkey.sh)
FF -ss 0 -to 4 -i clip.mp4 -vf "fps=30" -q:v 2 frames/f-%05d.jpg            # frames for the HTML engine
FF -framerate 30 -i frames/%04d.png -c:v libx264 -crf 18 -pix_fmt yuv420p out.mp4   # image sequence (Blender) → mp4
```

## Sound
```bash
FF -i v.mp4 -vn -ac 1 -ar 48000 voice.wav                                  # extract
FF -i raw.mp3 -af "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse" trimmed.mp3   # trim silence both ends
FF -i take.mp3 -af "loudnorm=I=-18:TP=-2:LRA=7" leveled.mp3                # level a take
FF -i a.wav -af "adelay=2350:all=1" late.wav                               # start at 2.35 s
FF -i a.wav -i b.wav -filter_complex "amix=inputs=2:normalize=0" both.wav   # mix without halving volumes
FF -i music.mp3 -i voice.wav -filter_complex "[0][1]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=900[m];[m][1]amix=inputs=2:normalize=0" ducked.wav
FF -i a.wav -af "atrim=1.2:3.4,asetpts=PTS-STARTPTS,afade=t=in:d=0.01,afade=t=out:st=2.19:d=0.01" part.wav   # clean cut
FF -f lavfi -i "aevalsrc='0.2*sin(2*PI*(520+700*exp(-35*t))*t)*exp(-28*t)':d=0.14:s=48000" pop.wav          # a synth effect
```

## Delivery
```bash
FF -i in.mp4 -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -c:a aac -b:a 160k -ar 48000 -movflags +faststart out.mp4
# crf 20–22 keeps a 70 s Reel ≈ 15–18 MB; higher crf = smaller. Always yuv420p + faststart.
FF -i in.mp4 -vf "fps=12,scale=480:-2:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse" out.gif
FF -i in.mp4 -vf "subtitles=subs.srt:force_style='FontName=Cairo,FontSize=22'" -c:a copy subbed.mp4
```
