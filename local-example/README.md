# `local/` — per-developer working directory

This directory is the **committed template** for the gitignored `local/`
workspace. To start a clean local workspace on a fresh clone:

```sh
cp -r local-example local
```

After that, anything you drop into `local/` stays on your machine. `local/`
is in `.gitignore` (see the root `.gitignore`), `local-example/` is not.

## Canonical layout

```
local/
  saves/      # exported savestate JSONs
  prompts/    # Higgsfield prompt drafts, asset wishlists
  pipeline/   # work-in-progress generation scripts
  notes/      # screenshots, doodles, balance spreadsheets
```

Use the subfolders or invent your own — nothing in here ships, the
convention is just so future-you can find things.

## Workflows

### Savestate snapshot

Export from the running game (`GET /api/sessions/<slot>/export` or the
SessionsPanel "Export" button) into `local/saves/`. Load it back with the
existing import flow (`POST /api/game/load` or SessionsPanel import).

### Higgsfield prompt drafting

Iterate prompts in `local/prompts/`. Once a prompt is locked, move it into
`assets/higgsfield/prompts/` (also gitignored, but lives where the live
pipeline expects). Promote the generated webp into `assets/exports/` when
it earns a place in main.

### Pipeline experiments

Hack new generation scripts in `local/pipeline/`. When stable and reusable,
graduate them to `packages/cli/src/` (and add their entry to
`packages/cli/bin/`).

## When something graduates out of `local/`

Drag it onto the right branch:

- Asset / style → `design-assets`
- Engine / server / panel logic → `feature/*` or `engine-*`
- Docs / policy → `docs/*`

See `agent-docs/DECISIONS.md` ADR-019 + `CLAUDE.md` for the branch policy.
