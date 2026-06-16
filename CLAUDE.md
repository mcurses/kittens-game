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

### Quality rules — building-card pipeline (load-bearing, see ADR-020)

**Building cards (all tiers) export at 1024×1024 native via direct
lossless cwebp.** No NN-pixelation round-trip. The Banana Pro raw is
already pixel-art at 1024²; the browser bicubic downscale handles
card-rendered sizes cleanly.

```sh
cwebp -lossless -q 100 raw.png \
  -o assets/exports/buildings/<asset>-<tier>.webp
```

Output: 0.5–1.5 MB at 1024×1024. Apply to every building card —
`hut`, `field`, `mine`, `library`, `academy`, `observatory`, `mansion`,
`logHouse`, every tier (`s/m/l/xl/xxl/mega/giant`). Same rule for
`village-*` maps (raw is 1376×768).

**File-size sanity check**: after exporting a building-card tier,
check the bytes. **A tier WEBP under 400 KB or whose dimensions are
512×512 is the wrong pipeline.** A correctly-exported tier sits at
~600 KB–1.5 MB and 1024×1024. The 512² output is what the obsolete
`sips -Z 512 → -Z 256 → -Z 512 → cwebp` round-trip from
`assets/higgsfield/LOCKED-STACK.md v2.2` produces — that pipeline was
retired in favour of native 1024² for the building-card category. See
ADR-020 for the history.

For other categories (icons, books, characters, resources) replicate
the pattern of whatever sibling exports already look like rather than
inventing a new pipeline.

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
