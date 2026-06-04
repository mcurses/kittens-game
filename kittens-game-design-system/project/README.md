# Kittens Game Design System

> **A new, smarter UI with a soul** — for the cult incremental game *Kittens Game* by bloodrizer (nuclear-unicorn). Pixel-art kittens, soft catnip forest dawn, deep cold space. Cozy when you're chopping wood; eerie when you're harvesting unobtainium on Helios.

---

## What is Kittens Game?

Kittens Game is a 12-year-running browser idle/incremental game where you start as a single kitten in a catnip forest and end up shepherding a transgalactic civilization toward singularity (and frequently beyond, into black-liquid-sorrow territory). It is famous in the genre for its dense systems, dry humor, and a UI that has barely changed since 2013 — three plain-text columns of buttons.

The community already produced ~25 community-contributed CSS themes (`theme_space.css`, `theme_arctic.css`, `theme_unicorn.css`, …) skinning that same DOM. **This design system is not a new game** — it's a thoughtful redesign that keeps the dense information density Kittens players love, but adds:

- A **soul**: the warmth of fur, paper, dusk forest light.
- A **smarter scaffold**: visual hierarchy, breathable spacing, real iconography.
- A **journey arc** — see `agent-docs/GAME_LOOP.md` for the current model. Earlier drafts of this doc described the journey as three fixed eras (Catnip Forest / Iron Will / Helios). That framing didn't match the engine — see the deprecation note below.

## Sources

- **Codebase** (read-only, public): https://github.com/nuclear-unicorn/kittensgame
  - `index.html` — three-column layout shell
  - `res/default.css` — base styles (38KB)
  - `res/theme_space.css` — community space theme by Volkeyrn (key reference for the cyan/magenta endgame palette)
  - `js/buildings.js`, `js/space.js`, `js/religion.js`, `js/time.js` — game systems & copy
  - `i18n/en.json` — master copy file ("$I" string IDs)
- **Logo & icon**: imported from `res/img/logo.png` and `icon.png` (a pixel-art kitten in a power suit).
- **Live game**: https://kittensgame.com/web/

The wiki, Discord, and Patreon are linked from the in-game footer.

---

## Index

| Path | What's there |
|---|---|
| `README.md` | this file — context, fundamentals, foundations, iconography |
| `SKILL.md` | Agent Skill manifest |
| `colors_and_type.css` | CSS custom properties for color, type, spacing, radii, shadows |
| `fonts/` | (uses Google Fonts CDN — see Type section for substitutions) |
| `assets/` | logo, icons (`logo.png`, `gear.svg`, `down.svg`, …), grass band, favicon |
| `preview/` | small HTML cards previewing tokens & components for the Design System tab |
| `ui_kits/kittensgame/` | UI kit: pixel-perfect React/JSX recreation of the main game shell |

---

## BRAND THEMES

> *In a grim and dark future of catkind, no one can hear you scream.*

**Lean into:** mythical monsters · elder artifacts · arcane technologies · lost civilizations.
**Never:** **NO ROBOTS** (not androids, not mechs, not "friendly AI" — we have arcane machines, not silicon valley pals) · no elves · no fairies · no owls.

Voice rule: bone-dry, observational, slightly fatalistic. Kittens starve, kittens die, the universe is indifferent. Never apologize, never console. The player chose this.

---

## CONTENT FUNDAMENTALS

The voice of Kittens Game is the single most distinctive thing about it. **Match it, or the design feels dead.**

### Tone
- **Dry, deadpan, mock-academic.** The browser tab title is literally "Kittens Game - a Dark Souls of incremental gaming."
- **Self-aware whimsy.** Loading messages cycle "mew~mew~", "mew~mew~mew~", "mew~mew~mew~mew~". The progress bar is, sincerely, just more mews.
- **Lore that lurches from cute to cosmic.** A building is "Catnip Field." Two tiers up, it's "Unicorn Pasture." Two more, "Cryochamber." Then "Hydroponics" on the moon. Then "Sorrow-harvesting Cathedral."
- **Cat puns, used sparingly.** A "pawse" button. The save reads "Saved!" but the autosave whispers "autosaving…". Don't pile them up.
- **No emoji.** Anywhere. The game uses unicode dingbats (`★ ⚒ ☣ ⚖ ⚛ ☀ ✧ ✦`) instead — see Iconography.

### Casing
- **Sentence case** for almost everything: button labels ("Catnip field"), tab headers ("Bonfire", "Workshop"), dialog titles.
- **Title Case** is reserved for proper nouns of the lore: *Iron Will*, *Black Pyramid*, *Helios*, *Unobtainium*.
- **lowercase** for tiny utility links: "save", "options", "wipe", "credits", "pawse", "undo".
- Resource names are lowercase ("catnip", "wood", "minerals") — they're things, not titles.

### Person & address
- **Second person**, very lightly. Game log: "*You are a kitten in a catnip forest.*" Dialogs: "Are you sure you want to reset?"
- Never "I". The game itself does not have a persona — it's a calm narrator.
- The kitten council is talked about in third person: "Your kittens are unhappy."

### Numbers
- Big numbers compress: `1.234K`, `5.67M`, `12.3B`, `45.6T`, `78.9G`. Six notation modes are user-selectable (scientific, engineering, …) — the design must accommodate any of them in the resource ledger.
- Per-tick rates are shown in parens with a sign: `(+0.42)`, `(-1.5)`. Always two decimals for rates, never for stocks.
- Negative resources blink/glow red — never just go gray.

### Specific examples (from `i18n/en.json` and game text)
- Console intro: *"You are a kitten in a catnip forest."*
- Loading: *"mew~mew~mew~"*
- A building tooltip: *"Catnip fields produce catnip, except in winter when they produce nothing."*
- Religion building flavor: *"Solar Revolution: Praise the sun!"*
- Reset dialog: *"You are about to reset the game. Your kitten council will not be amused."*
- Achievement: *"Holy Mackerel — Acquire the holy mackerel."*
- The fastHunt link: *"Send hunters (3 times)"*

When you write new copy, the test is: would Bloodrizer write this on a Tuesday at 2 a.m.? If it sounds like a tutorial, rewrite it.

---

## VISUAL FOUNDATIONS

The redesign carries one through-line: **pixel art with breath**. Every primitive — buttons, cards, the resource ledger — is built on a 4px grid, with crisp 1-2px borders that recall sprite outlines. But unlike the original's text-only DOM, the new UI commits to a *world*: the background changes mood as you progress, illustrated bands sit between sections, and kitten avatars (pixel-portrait, 32×32) populate the village panel.

### The journey arc — DEPRECATED as a top-level mental model

The Forest / Iron Will / Helios "three eras" framing has been retired as the way to think about how the game evolves. Reality check (May 2026):

- The engine has no era enum — see `packages/engine/src/ui-visibility.ts`. Progression is gradual via the tech tree + conditional UI + 19 dynamic village titles. There are no hard frame transitions.
- "Iron Will" specifically is a single optional challenge mode flag (`packages/engine/src/challenges.ts:57-62`), not a mid-game era.

**Use `agent-docs/GAME_LOOP.md` instead.** It defines eight loop beats (`solitude → first-growth → settlement → specialization → curiosity → divergence → industry → cosmos`), each derivable from state, each carrying its own visual mood and animation pacing.

**What survives from the old framing:**

The three palette families below remain useful as **token sets** — Forest-tone for early UI, Iron-tone for mid, Helios-tone for late/cosmos surfaces. They're swappable via `data-era="forest|iron|helios"` on the root element. Treat them as **palette presets** the dominant loop beat can lean into, not as discrete phases the player passes through.

| Palette family | Background | Accent | Vibe |
|---|---|---|---|
| **Forest** (default; early loop beats) | warm parchment, faint grass-band illustration | terracotta `#C97D5D`, sage `#7A9A6E` | Stardew, Wind Waker, sun-warmed wood |
| **Iron** (mid loop beats, optionally Iron Will challenge) | brushed slate, soot vignette | rust `#B45A3A`, bronze `#8C6A2F` | forge, iron, charcoal sketches |
| **Helios** (late / `cosmos` beat) | deep cobalt with star-field, soft cyan rim | electric cyan `#14F0D8`, magenta `#C23574` | night sky, neon, "outrun the heat death" |

### Color system (see `colors_and_type.css` for full tokens)
- **Surfaces** are layered: `--bg` (page), `--surface-1` (panel), `--surface-2` (card), `--surface-3` (hover/active). Three steps, never more.
- **Text** is `--ink` (primary), `--ink-2` (secondary), `--ink-3` (tertiary/disabled). The Forest era ink is warm near-black (`#2B221A`); Helios ink is `#DDDDDD` on near-black.
- **Semantic** colors are constant across eras so green-means-good never moves: production `#35C283`, warning `#F4691A`, danger `#EA152C`, leader/special `#1B9CC2`, sacred `#C23574`.
- **Resource colors** follow the resource itself (catnip = green, wood = brown, faith = magenta, antimatter = cyan).

### Type
- **Headlines / display**: *Pixelify Sans* — popular, clean, legible pixel face. Used for tab labels, building names, dialog titles, the wordmark. Pixel feel without crunchy 8-bit illegibility. Down to 14px is fine; below that, switch to body.
- **Body, UI, numbers, log**: *JetBrains Mono* (with *IBM Plex Mono* fallback) — terminal direction. Bone-dry, even spacing, digits align across rows out of the box. Carries paragraph copy, button labels, tooltips, the resource ledger, the game log.
- **Tiny eyebrows / badges only**: *Silkscreen* / *Press Start 2P* (`--font-pixel`). Reserve for ≤11px caps labels ("SPRING · YEAR 14 · DAY 3"). Never paragraphs.
- **Numerals**: tabular figures inherently — body is mono. Always two decimals on per-tick rates.
- **No system fonts**, no proportional sans for body. Terminal mono carries the voice.
- **Substitution flag** ⚠️ — all faces ship via Google Fonts CDN. If you want licensed alternatives (e.g. *Departure Mono* for body, *Pixeloid Sans* for display), drop TTFs into `fonts/` and swap `--font-display` / `--font-body` in `colors_and_type.css`.

### Spacing & rhythm
- 4px base unit. Tokens: `--space-1` = 4, `--space-2` = 8, `--space-3` = 12, `--space-4` = 16, `--space-6` = 24, `--space-8` = 32.
- Buttons are **264px wide** (kept from original — the muscle memory matters for veterans). New: 36px tall, 4px corners.
- Three-column shell: 280px / fluid / 360px on desktop ≥1280; collapses to a tabbed single column on mobile.

### Backgrounds
- **Forest era**: parchment color (`#F2E6CF`) + a 32px-tall hand-painted grass band (`assets/grass_band.png`) anchored to the bottom of the page, repeating-x, fixed.
- **Iron era**: subtle 4px-noise overlay at 4% opacity over `--bg`.
- **Helios era**: `theme_space_stars_background.png` (used by the original `theme_space`) repeated, plus a radial gradient from cobalt to near-black. **No purple/pink "AI gradients."** Cyan accents are *rim lights*, not fills.
- Full-bleed illustrations only for milestone screens (Ascension, first kitten, first launch).

### Animation
- **Easing**: snappy, slightly bouncy on success states (`cubic-bezier(0.34, 1.56, 0.64, 1)`), linear on resource counters (those tick every 200ms — no easing, no smoothing, you want to *see* the integer flip).
- **Resource flip**: the digit that just changed pulses 1.05× scale and brightens for 200ms.
- **Button press**: scale 0.96, 60ms. Release back to 1.0 with the bouncy easing.
- **No fades-on-mount**. The UI pops in. (Idle games are about state, not narrative — fades feel laggy.)
- **Background star drift** on Helios: 60s linear loop, parallax with two layers.
- **Hover cat blink**: village avatars blink every 4–7s, slightly desynced.

### Hover & press states
- **Hover**: `background-color` shifts to `--surface-2`, border brightens to the era accent at 60% alpha. Text stays put — no underline-on-hover (links are styled enough).
- **Press**: `transform: scale(0.96)` + `--surface-3`. Active buttons (e.g. running auto-craft) have a 1px inset glow in `--ok` (green).
- **Disabled**: 40% opacity, `cursor: default`, no hover response. *"Limited"* (can't afford) buttons are **outline-only** — transparent fill, red border, red label and price. No filled-red bg. On hover, a 6% red wash. Affordance: "you can see what this would do, you just can't yet."
- **Focus**: 2px outline in era accent, offset 2px. Keyboard users get the same hover styling.

### Borders & radii
- Borders are 1px or 2px, never 3+. Color: `rgba(ink, 0.15)` for low-emphasis, era accent at 40% for emphasized.
- Radii: `--r-sm` = 2px (chips, tags), `--r-md` = 4px (buttons, inputs), `--r-lg` = 8px (cards, dialogs), `--r-xl` = 12px (modals only). **Pixel art context: never round large surfaces > 12px.**
- Cards have a 1px border + 0px shadow in Forest, 1px border + a soft 0 4px 12px rgba(0,0,0,0.4) in Helios. Iron is in between.

### Shadows
- **Two systems coexist**: an outer "elevation" shadow (cards, modals) and an inner "groove" shadow (input wells, sunken panels — references CRT hardware bezels).
- `--shadow-1`: `0 1px 2px rgba(0,0,0,0.06)` — buttons.
- `--shadow-2`: `0 4px 12px rgba(0,0,0,0.18)` — cards.
- `--shadow-3`: `0 8px 32px rgba(0,0,0,0.32)` — dialogs.
- `--shadow-inset`: `inset 0 1px 2px rgba(0,0,0,0.18)` — wells.
- Helios era gets an additional `--shadow-glow` on critical actions: `0 0 12px var(--accent)`.

### Layout rules
- Top bar is **fixed**, 40px tall, era-tinted with 1px bottom border.
- Footer is fixed, 24px, low-contrast, links separated by `|`.
- Left column (resources) and right column (log) are scrollable independently from the center column.
- Modals appear at 40% from top (matches the original — keeps the sweet spot where you're already looking).
- **Don't** use floating action buttons; the design language is keyboard- and mouse-first, dense.

### Transparency & blur
- Tooltips: `rgba(surface-1, 0.9)` + `backdrop-filter: blur(6px)`.
- The pause overlay: full-page `rgba(bg, 0.7)` + `backdrop-filter: blur(2px)` (matches the existing `.button_tooltip` blur).
- **Never** use translucent panels for permanent UI — only for transient states.

### Imagery vibe
- Pixel art, **no anti-aliasing** (`image-rendering: pixelated`).
- Color palette warm in Forest era (mustard, sage, terracotta), cool in Helios (cobalt, cyan, magenta), grayscale-leaning in Iron.
- **No grain filter** on photos (we don't have photos). No gradients on illustrations — sprites are flat-shaded with a single highlight band.
- Avatar portraits are 32×32, centered in a 40×40 frame.

### Things to avoid (AI-slop tropes)
- ❌ Bluish-purple gradients, glassy "frosted" panels everywhere, bevels.
- ❌ Round emoji avatars. Never. Pixel portrait or nothing.
- ❌ Lucide/Heroicons line icons mixed with pixel art — pick a vocabulary.
- ❌ Cards with a colored left-border accent and rounded corners (the SaaS-card cliché).
- ❌ Hand-rolled SVG illustrations for in-content art. Use sprites for small icons, or AI-generated pixel-art-style illustrations (see hybrid rule below) for larger hero / hover cards. The chrome icons (`gear.svg`, `down.svg`, etc.) are an explicit exception — they're chrome, not content.

### Hybrid asset rule (added May 2026)

Two lanes, never mixed within a single asset:

- **AI-generated illustrations are OK for hover / hero cards ≥ 128 px square.** Workflow + prompts live in `assets/higgsfield/`. Higgsfield generates illustrative "pixel-art style" — not pixel-perfect, but readable when the asset is large enough for the imprecision not to fight CSS `image-rendering: pixelated`.
- **Traditional hand-made or open-source pixel sprites for UI icons < 64 px.** Resource icons, button decorations, status markers. These live in `assets/sprites/`. AI is *not* used here — at that size, the imprecision is obvious and wrecks the aesthetic.

See `assets/style-guide.md` for the corridor and `assets/README.md` for the workflow.

---

## ICONOGRAPHY

Kittens Game has a **pleasingly weird** approach to iconography that the redesign keeps:

### What the original uses
- **Unicode dingbats inside CSS `::before` pseudo-elements**, era-tinted via theme. Examples from `theme_space.css`:
  - `\2605` (★) — leader trait
  - `\2692` (⚒) — engineer
  - `\267B` (♻) — metallurgist
  - `\2623` (☣) — chemist
  - `\2696` (⚖) — merchant
  - `\27B4` (➴) — manager / hunting
  - `\269B` (⚛) — scientist
  - `\2600` (☀) — wise / solar
  - `\2727 / \2726` (✧ / ✦) — checkbox unchecked/checked
- **A handful of inline data-URI SVGs** for the top-bar status icons (happiness, energy lightning, pollution cloud) — single-color, ~14px, era-recolored via `fill='%23xxxxxx'` in the URI.
- **A few standalone SVGs**: `gear.svg` (settings), `left.svg`, `right.svg`, `down.svg` (chevrons), `question.svg` (info).
- **PNG sprites** for theme-specific buttons (e.g. `theme_anthracite_gear_on.png` is a 16×16 pixel-art gear).
- **No icon font**. No Font Awesome. No Lucide. By design.
- **No emoji.**

### What the redesign adopts
1. **Keep all the unicode dingbats** for in-text role markers — they're charming and load-free.
2. **Keep `gear.svg`, `down.svg`, `left.svg`, `right.svg`, `question.svg`** as the chrome icon set (in `assets/`).
3. **Add a small set of pixel-art PNG sprites** for resources (catnip leaf, wood log, minerals chunk, faith star, science beaker). When real sprites aren't available, **leave a placeholder** with a clear comment — *do not* generate icons with hand-rolled SVG, and *do not* substitute Lucide line icons; the pixel/glyph aesthetic must hold. (AI-generated sprites at this size are also out — see the hybrid rule above. AI is for hover-card-scale art, not 16 px icons.)
4. **Substitution policy**: if the user provides additional pixel art, drop into `assets/sprites/resources/` (canonical) or `kittens-game-design-system/project/assets/` (legacy). If they don't, the placeholder boxes (16×16 era-accent rectangles) are the design — they read as "sprite slot, art TBD" rather than as broken images.
5. **Hover hero cards** for buildings, techs, religion-upgrades, etc. live separately in `assets/exports/buildings/` (and siblings), generated via Higgsfield. See `assets/README.md` for the workflow.

### Logo
`assets/cat.svg` — cute pixel cat, sitting front-facing, 16×16 native (drawn from rect primitives, scales crisp to any size). Tabby cream with terracotta stripes, pink inner ears + nose, white paw socks. Crops to a 16×16 head for favicons. **No robo-suit, no mech, no powerarmor.** This is the brand.

---

## Status & caveats

This README is the spec. The CSS tokens, the preview cards, and the UI kit live alongside. If anything reads contradictory, the tokens win — they're what ships.
