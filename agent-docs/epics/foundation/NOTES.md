# Epic 01: Foundation — Implementation Notes

## Legacy Behavior Summary

This epic has no direct legacy game logic to port. The legacy codebase (`legacy/`) is a monolithic ~46k-line ES5 app using Dojo and jQuery, loaded via `index.html`. There is no build system, no module bundler, and no test infrastructure beyond a basic test runner in `legacy/test/`. Key observations:

- All game state lives in a single `game` global object on `GamePage`
- No package boundaries — all managers are attached to `game` at startup
- Tests in `legacy/test/` use a lightweight custom runner; read them for expected behavior in later epics
- The legacy app cannot be run headlessly or tested in isolation — which is exactly why the new architecture separates engine from I/O

## Key Decisions

- **Bun as runtime** over Node: faster cold starts, built-in TS execution, native SQLite — no transpile step needed for the server
- **Vitest over Bun test**: better IDE integration, watch mode, coverage reporting, and familiar Jest-compatible API
- **pnpm over npm/yarn**: workspace support, strict hoisting, faster installs, lockfile integrity
- **Turborepo over Nx/Lerna**: simpler config, excellent remote caching, good pnpm integration
- **Biome over ESLint + Prettier**: single tool, much faster, no plugin conflicts

## Gotchas & Edge Cases

- Bun and Vitest can coexist: use `vitest` for tests (better DX) but `bun` as the runtime for the server and CLI scripts
- `packages/client-web` will need a separate bundler (Vite) — Bun's bundler is not mature enough for React SPA yet
- TypeScript project references are fiddly with monorepos; consider using path aliases in `tsconfig.base.json` and letting Vitest resolve them directly rather than relying on `tsc --build`
- Biome does not yet support all ESLint rules; document any gaps in DECISIONS.md

## Open Questions

- Should CI use Turborepo remote caching (requires a Turbo account or self-hosted endpoint) or just local caching?
- Should `client-web` use Bun + Vite or just Vite standalone?
- Do we need a `docker-compose.yml` for local development (e.g. if we add Redis later for WS pub/sub)?
- Pin Bun version in CI via `.tool-versions` (asdf) or a `bun` field in `package.json`?
