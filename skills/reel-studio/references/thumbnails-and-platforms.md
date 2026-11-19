# Thumbnails, covers and platforms

## Thumbnail
- Pick **the most expressive frame inside the first 3 seconds**: the still then matches the hover/feed preview.
  Not the ending (it gives the story away).
- Use the same frame for YouTube (16:9 + the vertical Shorts one) and Facebook; on Instagram/TikTok use it as the
  cover, with the title moved if the 3:4 grid crop would cut it.
- Real footage: the raw action frame just BEFORE the key moment.
- A designed cover (frame + big title) only where covers show in a grid (Instagram profile).
- Grab it: `ffmpeg -ss 2.25 -i reel.mp4 -frames:v 1 -q:v 2 thumb.jpg` (1080×1920).

## Instagram grid crop
The profile grid shows the middle **3:4** of a 9:16 cover: on 1080×1920 that's y ≈ 240–1680. Keep the title inside it.

## Platform notes
| Platform | Video | Notes |
|---|---|---|
| Instagram Reels | 1080×1920, 30 fps | Links in captions aren't tappable (use the bio). Captions can't be edited through the API. |
| YouTube Shorts | 1080×1920, ≤ 3 min | The API sets only the 16:9 thumbnail; the vertical Shorts-feed thumbnail is set in Studio (Details → Thumbnail). Give each Short its own frame 0: reusing a past video's opening makes its old audience swipe away. |
| YouTube long | 1920×1080 | Chapters from the script; SRT captions. |
| Facebook Reels | 1080×1920 | Cover via the API (`/{video-id}/thumbnails`, `is_preferred=true`); AI disclosure flag for AI-made Reels. |
| TikTok | 1080×1920 | Turn on the AI-generated label for AI-made content. |
Specs and limits change: check each platform's help page before relying on a number.

## Safe zones (9:16)
Top ~120 px (status bar, handle), bottom ~350 px (caption, buttons, sound line), right ~120 px (like/comment/share).
Keep hooks, numbers and captions between y ≈ 200 and 1570.

## Publishing
Never upload or publish without the explicit go of the person who owns the account, video by video. Record every
link after publishing and look at retention after 24–48 h.
