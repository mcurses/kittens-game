# Kittens Game — Modern Rewrite

A faithful, feature-complete rewrite of [Kittens Game](https://kittensgame.com) in modern TypeScript. Same game, no IE7, no Dojo, no jQuery.

## Prerequisites

- [Bun](https://bun.sh) >= 1.0

## Getting started

Install dependencies:

```bash
bun install
```

Start the server:

```bash
cd packages/server
bun dev
```

In a separate terminal, start the web client:

```bash
cd packages/client-web
bun dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser and play.

The server runs on port 3000 and auto-ticks every 200ms. Game state is persisted to `packages/server/kittens.db` (SQLite).

## Development

Run all tests:

```bash
bun run test
```

Build everything:

```bash
bun run build
```

Lint and format:

```bash
bun run check
```

## Architecture

```
packages/
├── engine/       Pure game logic — (state, action) => newState, zero I/O
├── server/       Hono HTTP + Bun WebSocket, SQLite via Drizzle ORM
├── client-web/   React 19 SPA, TanStack Query, live WebSocket sync
├── api-spec/     OpenAPI 3.1 spec + Zod schemas (source of truth)
└── shared/       Types shared across packages
```

The engine is a pure function. The server owns the game loop and persistence. The client only sends actions and renders state — no game logic runs in the browser.

## API

```
GET  /api/health
GET  /api/game/state
POST /api/game/action   { type, payload }
POST /api/game/tick     (manual tick, useful for testing)
GET  /api/game/save     (export save JSON)
POST /api/game/load     (import save JSON)
POST /api/game/reset
WS   /ws               (real-time state deltas)
```

Full spec: `packages/api-spec/openapi.yaml`

## Legacy reference

The original Kittens Game source lives in `legacy/` (~46k lines, read-only). Do not modify it.
