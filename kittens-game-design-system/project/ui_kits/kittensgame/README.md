# Kittens Game — UI kit

Pixel-perfect-ish recreation of the classic three-column Kittens Game shell, redesigned with the new "smarter UI with a soul" pass. Built as a clickable React prototype so each component reads as a real UI element, not a static spec.

## What this kit covers

| File | Component | Notes |
|---|---|---|
| `index.html` | shell | Loads React + Babel, mounts `<App/>`. Switch to `ui_kits/kittensgame/index.html` to view. |
| `kit.css`     | layout & primitive styles | Era-tinted page backgrounds (Forest grass band, Iron noise, Helios star drift), 3-column grid, button states. |
| `App.jsx`     | wires interactive state | Fake resource tick (+rate every 1s), build buttons that increment, log push, era toggle. |
| `TopBar.jsx`  | sticky header | Title, status pings (kittens/happiness/energy/year), era toggle, save/options/reset/wipe links. |
| `ResourceLedger.jsx` | left column | Grouped (FOOD/MATERIAL/SACRED/SCIENCE/EXOTIC) tabular ledger + fast-action links. |
| `MainPanel.jsx` | center column | Tabs (Bonfire/Village/Science/...), Bonfire building grid, Village census. |
| `GameLog.jsx` | right column | Calendar header, intro line, log filters, message stream. |

## Try it

Click any building button — count goes up, log appends a "Built …" line. Click "Send hunters" / "Praise the sun" — log fires. Toggle the FOREST / IRON / HELIOS pills in the top bar to see the same components carry across all three eras. Resources tick every second.

## Style fidelity to the original

- 264px button width (the muscle-memory anchor for veterans).
- Three-column shell with independent scroll.
- Tab separators are real `|` characters in body font; tab labels are pixel display.
- Per-tick rates in parens with sign, two decimals, never simplified.
- "Limited" buttons are red-tinted (not gray) — same affordance as the original.
- Unicode dingbats for role markers (★ ⚒ ⚛ ☣).

## What's deliberately NOT here

- Real game logic (research tree, kitten promotion, prestige reset). This is a UI kit, not the game.
- The remaining tabs (Science/Workshop/Religion/...) — they show a placeholder. Adding more would dilute the kit's purpose; instead the placeholder demonstrates the empty-tab pattern.
- Custom pixel-art portraits — kittens use a generic glyph because we don't have sprite art for them yet. The frame is correct (32×32 pixelated cell), so dropping in real sprites later is a one-line change in `MainPanel.jsx`.

## Caveats

- Emoji glyphs (🐈 ☺ ⚡) are stand-ins where icon-font work hasn't shipped. The README and SKILL flag this — replace with pixel sprites for production.
- The "Helios" era shows the late-game vibe; in the real game, you'd progress to it. Era toggle here is a designer affordance, not a game mechanic.
