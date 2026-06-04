# Design System — Kittens Game Client

This document is the source of truth for how the `packages/client-web/` UI is composed. Read this before adding a new panel, button, form control, or heading. The CSS lives in `packages/client-web/src/styles.css`. The TSX primitives live in `packages/client-web/src/ui/`.

There are **two enforcement layers** that catch drift in CI:

1. **`pnpm lint:css`** — Stylelint with `stylelint-declaration-strict-value` against padding / margin / gap. Anything other than `0`, `auto`, `inherit`, or `var(--*)` is flagged. Config: [`.stylelintrc.json`](../.stylelintrc.json).
2. **`pnpm lint:css-coverage`** — Custom Node script that ensures every `className=` reference in any `.tsx` resolves to a real CSS rule in `styles.css`. Pre-existing orphan classes are in the `KNOWN_ORPHANS` baseline in [`scripts/check-css-coverage.mjs`](../scripts/check-css-coverage.mjs). New orphans fail the build.

Run both alongside the existing `pnpm test` / `pnpm lint` gates.

## Heading hierarchy

Three ranks. Use the typed primitive instead of raw `className`:

```tsx
import { PanelHeading } from "./ui";

<PanelHeading level={2}>Structures</PanelHeading>     // Tab top
<PanelHeading level={3}>Food Production</PanelHeading> // Group
<PanelHeading level={4}>Census</PanelHeading>          // Sub-section
```

| Level | Class | Used for | Visual |
|---|---|---|---|
| H2 | `.panel-label` | The first heading in a tab body | 13 px DePixel bold, `--t1`, bottom border |
| H3 | `.panel-subheading` | A group inside a panel | 12 px DePixel medium, `--t2`, no border |
| H4 | `.panel-sublabel` | A subsection inside a group | 10 px DePixel medium, `--t3`, no border |

The CSS rule `.panel-label:not(:first-child) { margin-top: var(--sp-8); }` automatically gives the *second* H2 in a panel (e.g. „Job Assignments" after the village hero) 32 px of breathing room. No JSX wrapping needed.

## Button family

Use `<button className="btn btn--{variant} btn--{size}">`. Composable modifiers — see `.btn` block in `styles.css` (~ line 583+) for the full set.

| Variant | Use | Example |
|---|---|---|
| `--primary` | Main action of a screen (Buy, Research, Submit) | Buy a building |
| `--secondary` | Default outline | Pause, Archive |
| `--ghost` | Text-only link-style | „Import Legacy Save" |
| `--done` | Non-interactive completion marker | Researched-tech badge |
| `--success` / `--warning` / `--info` / `--danger` | Semantic colors for action buttons | Sessions table actions |
| `--toggle` | Pill-shaped aria-pressed button | „Show per second" |
| `--toggle-dark` | Toggle in dark header bg | „⊟ Cards" |
| `--tab` | Tab-bar item with `data-active` underline | Top navigation |
| `--filter` | Chip-style filter with `data-active` highlight | Buildings filter row |
| `--solid` | Solid background variant (only used with `--danger`) | Confirm-Delete |

Sizes: `--sm` (12 px text), `--xs` (11 px text), `--icon` (32×32 square for steppers), `--full` (width: 100 %).

**Focus:** every `.btn` gets a 2 px accent-colored `:focus-visible` outline. Don't add your own.

## Form controls

Native checkbox: wrap in `.toggle-label` *or* use `<Toggle>` from `./ui`:

```tsx
import { Toggle } from "./ui";

<Toggle
  checked={hideResearched}
  onChange={setHideResearched}
  label=" Hide researched"
  data-testid="hide-researched"
/>
```

Native select: use `<Select>` from `./ui` *or* attach `.btn-select` to a raw `<select>`. Both deliver custom border, padding, dropdown chevron, and focus ring.

Status messages: `<p className="status-message status-message--success|--error">` for inline feedback.

## Layout containers

Every wrapper `<div className="*-row" | "*-actions" | "*-controls" | "*-grid">` must have an explicit CSS rule with `display: flex` (or `grid`) + a token-based `gap`. The `lint:css-coverage` check enforces that the class exists.

Reusable layouts:

- `.card-grid` — auto-fill grid for module cards (uses `--card-grid-min`)
- `.item-list` / `.item-row` — vertical list of horizontal rows
- `.item-card` — full-image card with bottom strip overlay (Buildings)
- `.tech-card` — 2:3 book-cover card with overlay strip (Science)
- `.upgrade-card` — 1:1 square card with bottom strip + done badge (Workshop)
- `.census-card` — 1:1 portrait card with name strip + hover actions
- `.village-info` — 16:9 hero with absolute overlay (Jobs)

## Spacing tokens

The 4-px grid lives in `:root` (~ line 117 of `styles.css`):

| Token | Value | Use |
|---|---|---|
| `--sp-0` | 2 px | **Half-step** — pixel-art overlay micro-rhythm only |
| `--sp-1` | 4 px | tight inner gaps, badge padding |
| `--sp-2` | 8 px | default control gap |
| `--sp-3` | 12 px | card-grid gap, card-internal padding |
| `--sp-4` | 16 px | panel-section padding, heading→content |
| `--sp-5` | 20 px | (legacy) |
| `--sp-6` | 24 px | section-to-section break |
| `--sp-8` | 32 px | subsection-group break, dialog padding |

**Never** write a raw `padding: 6px` or `margin: 0.5rem`. Stylelint will fail the build.

## Color & elevation

Color tokens are documented inline in `:root` (same block). Highlights:

- **Text tiers:** `--t1` (darkest, primary), `--t2`, `--t3` (lightest, tertiary). Use the right one per rank.
- **Surface:** `--surface`, `--surface-hover`, `--surface-active`.
- **Accents:** `--accent` (burnished amber, primary actions), `--green` / `--red` / `--gold` semantic.
- **Resource hues:** `--res-catnip`, `--res-wood`, `--res-minerals` etc.

Card elevation: `--card-elevation-rest` / `--card-elevation-hover`. Don't write custom `box-shadow` values for cards.

## Animation

Motion tokens: `--ease-snap` (90 ms), `--ease-fast` (140 ms), `--ease-mid` (220 ms), `--ease-slow` (340 ms). All transitions must reference one of these.

Celebrate keyframe `@keyframes upgrade-celebrate` triggers a 700 ms pulse on `.upgrade-card--just-done`. Add new celebration animations only when there is a clear „first time" UX moment.

## When to add primitives vs. raw classes

- Add a primitive when the pattern appears in 3+ places already, or has typed props that would be easy to misuse otherwise. The primitives in `./ui/` (`PanelHeading`, `Toggle`, `Select`) exist because they showed clear drift over time.
- Keep raw `className` when the pattern is unique to one panel (e.g. `.race-row` is specific to DiplomacyPanel and isn't worth abstracting).

## What was retroactively whitelisted

`KNOWN_ORPHANS` in `scripts/check-css-coverage.mjs` lists classes referenced in JSX but with no current CSS rule, e.g. `.job-row`, `.inspector-flavor`. They are *informational* aliases that inherit from a parent rule; converting each to either a real rule or a removed alias is a follow-up Hygiene-Story. New PRs may not add to this baseline — the script fails CI on any other unknown orphan.

## How to run the checks locally

```bash
pnpm test              # vitest (engine + client + server)
pnpm lint              # turbo lint (biome)
pnpm lint:css          # stylelint with token enforcement
pnpm lint:css-coverage # JSX→CSS class-coverage gate
```

All four must pass before merge.
