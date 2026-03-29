# Epic Backlog

Live status tracker. Update when epics start or complete.

| # | Epic | Prerequisites | Priority | Status |
|---|------|--------------|----------|--------|
| 01 | **Foundation** — monorepo, tooling, CI, package skeletons | — | P0 | ✅ Complete |
| 02 | **API Spec** — OpenAPI schema, Zod types, WS envelope | 01 | P0 | ✅ Complete |
| 03 | **Core Engine** — tick loop, effect system, base managers | 01 | P0 | ✅ Complete |
| 04 | **Resources** — all resource types, storage, perTick calc | 03 | P0 | ✅ Complete |
| 05 | **Buildings** — all buildings, prices, effects, stages | 04 | P0 | ✅ Complete |
| 06 | **Village / Population / Jobs** — kittens, jobs, happiness | 04 | P0 | ✅ Complete |
| 07 | **Calendar & Seasons** — seasons, moon, year tick | 03 | P1 | ✅ Complete |
| 08 | **Science / Tech Tree** — 100+ techs, unlock chains | 05, 06 | P1 | ✅ Complete |
| 09 | **Workshop / Upgrades** — crafting recipes, upgrade effects | 05, 08 | P1 | ✅ Complete |
| 10 | **Religion & Faith** — faith, gods, praise mechanics | 08 | P1 | ✅ Complete |
| 11 | **Prestige / Reset** — paragon, perks, soft reset flow | 08 | P1 | ✅ Complete |
| 12 | **Challenges** — challenge types, LDR stacking, completions | 11 | P2 | ✅ Complete |
| 13 | **Space** — planets, space buildings, space upgrades | 09 | P2 | ✅ Complete |
| 14 | **Diplomacy / Trade** — races, trade missions, trade post | 09 | P2 | ✅ Complete |
| 15 | **Time Mechanics** — Chronoforge, queue, heat/flux | 10 | P2 | ✅ Complete |
| 16 | **Achievements** — 200+ achievements, badge unlock | 08 | P2 | ✅ Complete |
| 17 | **Server** — Hono server, SQLite, session mgmt, WS | 02, 03 | P1 | ✅ Complete |
| 18 | **Web Client** — React SPA, TanStack Query, WS live sync | 17 | P1 | ✅ Complete |
| 19 | **Engine Completeness** — close sanity-check gaps: time shatter, religion pacts/necrocorns, prestige paragon, space beacons, diplomacy seasons, challenge completion conditions | 10–16 | P1 | ✅ Complete |
| 20 | **Game UI** — full client interface: resource filtering, buildings panel, jobs panel, calendar/year display, log/messages, tech tree, workshop panels | 18, 19 | P1 | ✅ Complete |
| 21 | **Feature Parity Audit** — systematic legacy comparison, fix divergences | 19, 20 | P1 | ✅ Complete |
| 22 | **Multi-client** — concurrent sessions, auth/session isolation, optimistic UI | 20 | P2 | ⏳ Not Started |
| 23 | **i18n** — translation system, port all 40+ locale files | 20 | P3 | ⏳ Not Started |
| 24 | **Themes & Assets** — CSS themes, image assets | 20 | P3 | ⏳ Not Started |
