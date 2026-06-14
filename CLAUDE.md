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
