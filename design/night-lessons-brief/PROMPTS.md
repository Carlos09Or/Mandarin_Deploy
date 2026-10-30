# Night version of the lesson screens: brief for the image agent

Attach `lessons-DAY-sheet.png` (9 phone screens, the DAY look of every lesson exercise).
Ask for the output saved as `lessons-NIGHT-sheet.png`.
The same screens one by one, if the agent prefers them separately, are in `day-screens/`.

## Prompt

```
Attached is ONE sheet with 9 phone screens of a Mandarin learning app, DAY version (3 columns x 3 rows):
new word, find the meaning (idle), option picked, correct answer, wrong answer, link the pairs, listen, type it, tones.
Redraw the SAME 9 screens as a NIGHT version.

KEEP IDENTICAL: the layout, every element and its position and size, all text (do not rewrite, translate or restyle any letter, hanzi or pinyin), button shapes and their 3D bottom edge, the progress bar, the sound buttons, the tone arrows, the matching lines, and the two mascot illustrations (the owl in the new-word card and the golden frog in the correct/wrong banners): do not redraw or restyle the mascots, only let them sit naturally on the darker colours.

CHANGE ONLY THE COLOURS to a SOFT, cozy night, like the day version put to sleep at dusk:
- background: a soft dusty blue-slate, NOT black and NOT saturated navy; about the darkness of twilight (roughly #1E2433 to #263046)
- cards and answer buttons: a slightly lighter, same-family blue-slate with a soft lighter edge (the day cards are white with a warm beige edge; keep that "paper card with a bottom edge" feel)
- text: warm off-white / pale cream, never pure white; muted text a soft grey-lilac; hanzi in warm off-white
- keep each accent in the SAME hue family as the day version, only calmer and slightly desaturated: the green buttons stay green, the speaker buttons stay blue, the wrong answer stays red-coral, the gold stays gold. No new colours (no purple, teal, magenta, orange) and no neon.
- the correct banner is a deep soft green tint, the wrong banner a deep soft red-coral tint, with the main text in a lighter tint of the same hue so it reads comfortably
- the disabled CHECK button is a dim slate, clearly inactive
- the progress bar track is a slightly lighter slate with the green fill
- soft and low contrast overall: easy on the eyes in a dark room, but the hanzi must stay clearly readable
- flat, no glow, no gradients, no textures, no stars or moons

OUTPUT: one image with the same 3x3 sheet, same layout and scale as the attached one, each phone with the same thin rounded outline on a flat PURE WHITE background (#FFFFFF). Below the sheet add one strip of 10 plain colour squares, no text, showing the exact night colours used, in this order: page background, card, card edge, main text, muted text, green button, blue button, red/coral, gold, banner green tint.
```

## After it comes back

1. Save as `design/night-lessons-brief/lessons-NIGHT-sheet.png`.
2. Claude reads the colours off the strip and from the screens, defines them as the night tokens (`paper`, `card`, `ink`, `muted`, `line`, `jade`, `sky`, `brand`, `gold` and their soft tints) under a `.night` class on the lesson, driven by the same `isNight()` switch the map uses.
3. Claude checks every exercise in the browser, day and night, including the screens not on the sheet (trace, sentence, cloze, lesson complete).

## Round 2: correction (the first result looked like Duolingo)

Attach BOTH `lessons-DAY-sheet.png` and the first night result. Save the answer as `lessons-NIGHT-sheet-v2.png`.

```
I attach two images: the DAY sheet (the real design) and your first NIGHT attempt.
Your layout, text and mascots are right. Keep ALL of that exactly.
The problem is the colour direction: the cold blue-slate background with blue-outlined cards looks like Duolingo's dark mode. Redo the NIGHT sheet with a different, warmer identity that grows out of OUR day version, whose page is warm cream paper with white cards and a warm beige edge.

NEW BACKGROUND AND CARDS (this is the main change):
- page background: a warm, dusky charcoal with a hint of plum-brown, like the day cream paper after sunset (roughly #2B2628 to #322B30). It must NOT be blue, navy, teal or slate at all.
- cards, answer buttons, the hanzi card and the tone box: SOLID filled warm taupe-plum one step lighter than the page (roughly #3B3338), with a soft warm bottom edge a little darker or lighter than the fill, the same "paper card with a bottom edge" shape as the day version. NO blue outline, NO thin bright border around cards.
- inactive CHECK button: a dim warm taupe (roughly #4A4145), clearly inactive
- progress bar track: warm taupe, a bit lighter than the page
- text: warm cream (like #F3E9DA), never pure white; muted text a soft warm grey-mauve (roughly #A89BA0); hanzi in warm cream
- the phone outlines on the sheet keep the same thin rounded outline, in a warm tone, on the white sheet background

ACCENTS: keep the same hue families as the day version, but warmed and softened so they sit on a warm base (no cold blue next to them):
- green buttons and correct state: a soft jade green, not neon, not Duolingo lime
- speaker and tone buttons: a calm sky blue, a little softer than your first attempt
- wrong answer: a soft coral red; gold: a soft warm gold
- correct banner: a deep muted green tint; wrong banner: a deep muted coral tint, both warm-leaning, with text in a lighter tint of the same hue

Keep it soft, low contrast, flat: no glow, no gradients, no textures, no stars or moons, no purple or teal. Hanzi stay clearly readable.

OUTPUT: same 3x3 sheet, same layout and scale, flat PURE WHITE background (#FFFFFF), plus the same strip of 10 plain colour squares below, no text, in this order: page background, card, card edge, main text, muted text, green button, blue button, red/coral, gold, banner green tint.
```

If it still feels too dark or too brown, ask for the same prompt with the page background changed to "a soft dusky mauve-grey, roughly #332D3A", keeping everything else.

## Round 3: violet dusk, continuing the night doors

Attach THREE images: `lessons-DAY-sheet.png`, `doors-NIGHT-reference.png` (four of our night doors) and, if useful, the last night result. Save the answer as `lessons-NIGHT-sheet-v3.png`.

```
I attach: (1) the DAY sheet of our app screens, the real design; (2) four NIGHT doors from the same app, painted in our night style; (3) your previous NIGHT attempt, which I do NOT want to follow in colour.
Keep the layout, all text and the two mascots of the screens EXACTLY as in the day sheet and in your previous attempt.

The colour must continue the night doors: a violet-lilac dusk. Look at the doors: deep indigo shadows, periwinkle and lilac moonlit edges, and warm golden lantern light. Build the screens' night palette from THAT, so the lessons feel like the same night as the doors. It must not look like Duolingo's dark mode (cold blue-grey page with outlined cards) nor like a generic dark brown.

PALETTE (violet dusk, soft and low contrast):
- page background: a deep dusky violet-indigo, hue clearly purple-leaning (roughly #272244 to #2D2850), NOT navy blue, NOT slate, NOT black
- cards, answer buttons, the hanzi card, the tone box: SOLID filled lilac-indigo one step lighter than the page (roughly #38325F), with a soft bottom edge a little darker (roughly #2A2548), the same "paper card with a bottom edge" shape as the day version. NO bright outline around cards; at most a very faint lighter lilac rim, like the moonlit edge on the doors
- inactive CHECK button: a dim muted violet-grey (roughly #433E66), clearly inactive
- progress bar track: a slightly lighter violet than the page
- main text and hanzi: warm cream, like the lantern light (roughly #F6EEDC), never pure white; muted text a soft lilac-grey (roughly #A9A3CC)
- the phone outlines on the sheet: a thin rounded outline in soft lilac on the white sheet background

ACCENTS (same hue families as the day version, softened to sit on violet, no neon):
- green buttons and correct state: a soft jade green
- speaker and tone buttons: a soft periwinkle blue (it can lean slightly toward lilac, like the door edges)
- wrong answer: a soft coral red
- gold (stars, small highlights): the warm lantern gold of the open doors
- correct banner: a deep muted green tint; wrong banner: a deep muted coral tint, text in a lighter tint of the same hue

Flat, soft, easy on the eyes: no glow, no gradients, no textures, no stars or moons. Hanzi stay clearly readable.

OUTPUT: same 3x3 sheet, same layout and scale, flat PURE WHITE background (#FFFFFF), plus below it one strip of 10 plain colour squares, no text, in this order: page background, card, card edge, main text, muted text, green button, blue button, red/coral, gold, banner green tint.
```

## Round 4: same violet, calmer, so the hanzi and the action lead

Attach `lessons-DAY-sheet.png` and the v3 result. Save the answer as `lessons-NIGHT-sheet-v4.png`.

```
I attach the DAY sheet (the real design) and your previous NIGHT attempt (v3).
Keep the layout, all text and both mascots exactly. The violet direction is right and I like it. The problem is intensity: the colour is too strong, and my eye goes to the wrong places (the lilac outlines, the bright blue speaker buttons, the purple cards) instead of the content. Redo it calmer, with a clear visual hierarchy.

HIERARCHY RULE: on every screen the brightest things must be only (1) the hanzi or the main prompt, and (2) the one thing the learner must act on (the primary button, the selected option, or the correct/wrong state). Everything else recedes into the background.

COLOUR CHANGES from v3:
- reduce the saturation of the violet a lot: a quiet, greyish dusk violet, closer to a violet-tinted charcoal than to purple. Page background roughly #2A2838. The page and the cards should be close in value so nothing glows.
- cards, answer buttons, hanzi card, tone box: filled, only slightly lighter than the page (roughly #33314A), with a soft bottom edge a little darker (roughly #262436). REMOVE every lilac or bright outline and rim around cards and options; unselected options have no visible border at all, just the soft fill and bottom edge
- unselected option text: a slightly dimmed cream (roughly #D9D2C6) so the options sit back; the hanzi and the main question stay bright warm cream (roughly #F3ECDD)
- muted text and eyebrow labels: a quiet grey-violet (roughly #8E8AA6)
- inactive CHECK button, progress track: barely lighter than the page (roughly #38364C), clearly inactive but not eye-catching
- speaker and slow-speed buttons: make them much quieter, a dusty muted periwinkle (roughly #5F78B8) with no bright highlight, so they no longer pull the eye
- green (primary button, selected, correct): a calm jade, a little less bright than v3 (roughly #3E9E80); this is the main accent, so it is the only saturated element on the screen
- wrong state: a soft muted coral (roughly #D26A6A), not hot red; banners are deep muted tints (green roughly #2C4B45, coral roughly #4D3139) with text in a soft lighter tint
- gold: a soft warm gold, used sparingly
- the thin outline around each phone on the sheet: neutral soft grey (roughly #3A3848), not lilac, so the sheet frames do not compete either

Flat, soft, low contrast overall. No glow, no gradients, no textures, no stars or moons. Hanzi must stay clearly readable.

OUTPUT: same 3x3 sheet, same layout and scale, flat PURE WHITE background (#FFFFFF), plus below it one strip of 10 plain colour squares, no text, in this order: page background, card, card edge, main text, muted text, green button, blue button, red/coral, gold, banner green tint.
```
