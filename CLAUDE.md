# CLAUDE.md

Notes for Claude Code (or any other AI coding assistant) working in this repo.

## Repo orientation

- pnpm monorepo, packages in `packages/`. Engine logic in `packages/engine`,
  HTTP/WS server in `packages/server`, React client in `packages/client-web`,
  shared types in `packages/shared`, OpenAPI spec in `packages/api-spec`.
- Bun runs the server; Vite serves the client; Vitest runs tests in every
  package. `pnpm -r test` runs everything.
- `agent-docs/` is the durable design + decision archive:
  `DECISIONS.md` for ADRs, `GAME_LOOP.md` for the canonical progression model,
  `EPICS.md` / `PROGRESS.md` for the rewrite plan and status.

## Branch policy (load-bearing — see ADR-019)

Mixing UI/asset work with engine/server logic on the same long-lived branch
caused a 50+ file conflict storm in June 2026 when main moved forward with
its own parallel design-system sweep. Going forward, branches stay
single-concern:

- **`design-assets`** (off `origin/main`) — UI, style, asset, CSS work only.
  Allowed scopes: `assets/`, `kittens-game-design-system/`,
  `packages/client-web/src/styles.css`, `packages/client-web/src/ui/`,
  new icon/illustration files.
- **`feature/*` or `engine-*`** (off `origin/main`) — anything that touches
  engine, server, panel logic, tests, or schemas.
- **`docs/*`** (off `origin/main`) — repo policy + documentation changes
  (this file, ADRs, agent-docs).
- **`design-systems-core`** is **archive only.** Discovery sandbox from
  spring 2026 that ran parallel to main's design sweep. No new commits, no
  new merges from there.

If a branch ends up touching both lanes, split it before pushing. Match the
PR scope to the branch name.

## Quick commands

- `pnpm install` — bootstrap
- `bun dev` — server + client dev, port via `/.env` (default 3100, not 3000:
  3000 collides with Emma Suite)
- `pnpm --filter @kittens/engine test` — engine tests
- `pnpm -r exec tsc --noEmit` — typecheck everywhere

## Asset pipeline

End-to-end automated: prompt → Higgsfield MCP → raw → sips + cwebp → WEBP
into `assets/exports/` → INDEX + log update. `iconPath` is already in
`BUILDING_DEFS`. See `agent-docs/` for the higgsfield pipeline notes.

### Quality rules — Standard vs. Village-Ausnahme (load-bearing, see ADR-020)

There are **two** pipelines and one is easy to apply to the wrong asset.
The canonical doc lives in `assets/higgsfield/LOCKED-STACK.md` (on the
`design-systems-core` branch, gitignored on main). Repeating the rules
here so every branch sees them.

**Standard pipeline — default for all tier-tree and category assets**
(`field-*`, `mine-*`, `library-*`, `academy-*`, …):

```sh
sips -Z 512 raw.png --out /tmp/int-512.png
sips -Z 256 /tmp/int-512.png --out /tmp/px-256.png   # native pixel-art floor
sips -Z 512 /tmp/px-256.png --out /tmp/px-512.png    # NN upscale back
cwebp -lossless -q 100 /tmp/px-512.png \
  -o assets/exports/<category>/<asset>-<tier>.webp
```

Output: ~600–1000 KB. The 256-px round-trip is the NN-pixelation pass.

**Village-Ausnahme — ONLY** for `hut-{s,m,l}`, `logHouse-{s,m,l}`,
`mansion-{s,m,l}`, and `village-*` maps. Skips the NN pass:

```sh
cwebp -lossless -q 100 raw.png \
  -o assets/exports/<category>/<asset>.webp
```

Output: 1024×1024 native (buildings) or 1376×768 (maps). Reason: the
round-trip collapsed outline details on Village-tier card sizes
(Retina × large-mode ≈ 376 phys-px), and the user read that as
"pixelig/matschig". On non-Village assets the round-trip is what KEEPS
the pixel-art look — skipping it makes them look washed-out.

**File-size sanity check**: after exporting a tier-tree asset, check
the bytes. **< 400 KB on a tier asset = wrong pipeline was applied.**
Standard tiers land at 600–1000 KB; Village-Ausnahme files at
~260–300 KB. Mixing them = the symptom the user keeps catching.

If you generate a new asset name that isn't in the Village list above,
use the Standard pipeline. When in doubt: Standard.

## Local-only content

Anything under `local/` is gitignored per-developer working material that
must never reach main. Canonical layout (mirror of `local-example/`):

- `local/saves/` — exported savestate JSONs from
  `GET /api/sessions/:slot/export`. Re-import via `POST /api/game/load`
  or the SessionsPanel Import dialog.
- `local/prompts/` — Higgsfield prompt drafts, character + building
  composer notes, asset wishlists.
- `local/pipeline/` — work-in-progress generation scripts before they
  earn a place in `packages/cli/`.
- `local/notes/` — design intent doodles, balance spreadsheets, screenshots.

On a fresh clone: `cp -r local-example local` to seed the structure.
Nothing here ships. When a piece of work matures, lift it onto a proper
branch (design-assets / feature/\* / docs/\*).
