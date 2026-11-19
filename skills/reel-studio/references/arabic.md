# Arabic: voice text, screen text, right-to-left pages

These spellings were chosen by ear in A/B tests and hold for Gemini voices. Write voice lines this way from the start.

## Voice text (what the TTS reads)
1. **Full harakat**, including on «ال»: sukun on the lam before moon letters («الْباحِثونَ», «الْعَيِّنَةَ»), shadda
   after sun letters («التَّمْرين»). Harakat on the word but not on «ال» makes the voice say «ال» as a separate piece.
2. **«ة» right before a pause** (، . : ؟ !) is written «ـه»: «حِمْيَه،», «الْخُلاصَه:». Otherwise the ending is dropped.
   (A pipeline can convert it automatically before pauses.)
3. **Any word right before «…» or a pause ends in sukun**: «الْغُرْفَهْ…», «ذاكِرَتِكْ…», «أَنْتْ!». Otherwise the
   voice stretches it («غرفتاا»).
4. **Foreign words with «ال»** get a case ending so they flow: «يَبْنِي الكِرْياتِينُ عَضَلاتٍ».
5. Units and abbreviations in full words: «كيلومتر» (not «كم», read «كَمْ»), «بِالْمِئَة».
6. Numbers in words when the reading matters; the screen shows digits (map them with `show`).
7. Sports: «الرِّياضا» (written so it sounds right).
8. English terms that should stay English (brand names, "AI agent") need a voice that handles both languages: test first.
When unsure about a word: a short A/B test (each version announced by number), pick by ear.

## Screen text
- **No harakat on screen**, ever (strip them; map respelled words back: [['حميه','حمية'], ['الرياضا','الرياضة']]).
- Simple Modern Standard Arabic; short lines; the claim in ≤ 5 words.
- Name studies: «دراسة أمريكية · 2011» + «deWeber وزملاؤه · مجلة طب الأسرة» (Latin names small, on their own line).
- Digits: Western digits (20, 5.7%) read best on phones; keep units Arabic («20 دقيقة»).

## Right-to-left pages
- `<html lang="ar" dir="rtl">`; wrap mixed Latin/number runs in `<bdi>` so they don't jump to the wrong side.
- A number + Arabic unit: write them in reading order inside the RTL flow (`<span>20</span> <small>دقيقة</small>`);
  `direction:ltr` on the parent flips the order.
- Everything inside an `overflow:hidden` stage (overflow scrolls RTL pages sideways → a bare strip on the left).
- Fonts that worked: Alexandria / Readex Pro (headings, body), Marhey (handwritten notes), Cairo (presentations).
  Load them from `@fontsource/*` files; check the Arabic subset file is the one loaded.
- Never let an image model draw Arabic: it can't. Blender text objects can't shape Arabic either.
