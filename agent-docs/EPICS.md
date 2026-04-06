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
| 22 | **Multi-client** — concurrent sessions, auth/session isolation, optimistic UI | 20 | P2 | ✅ Complete |
| 23 | **i18n** — translation system, port all 40+ locale files | 20 | P3 | ⏳ Not Started |
| 24 | **Themes & Assets** — CSS themes, image assets | 20 | P3 | ⏳ Not Started |
| 25 | **UI Completeness** — auto-tick, village panel, per-tick rates, costs in panels, religion/space/time/diplomacy/achievements tabs, craft-N UI | 20, 21 | P1 | ✅ Complete |
| 26 | **UI Information Architecture** — replace hover-only legacy detail with modern inspector / progressive disclosure patterns across resources, buildings, workshop, and related panels | 20, 21, 25 | P1 | ✅ Complete |
| 27 | **Building Completeness** — implement remaining ~24 gameplay buildings (amphitheatre, lumberMill, smelter, calciner, observatory, brewery, mint, steamworks, magneto, tradepost, harbor, temple, ziggurat, unicornPasture, + mid/late game), fix catnipDemandRatio, wire all effect keys end-to-end per PARITY.md | 05, 09 | P1 | ✅ Complete |
| 28 | **Legacy Save Import** — import legacy KG save files (LZString-compressed) into the new engine via a pure migration function, server endpoint, and web UI panel | 17, 18, 25 | P1 | ✅ Complete |
| 29 | **Critical Bug Fixes** — fix auto-tick not starting after save import, fix VSU migration unlocked:false bug | 28 | P0 | ✅ Complete |
| 30 | **Happiness Formula Completeness** — add luxury bonus, karma, festival, and temple happiness terms; wire breweryConsumptionRatio and consumableLuxuryHappiness | 27, 29 | P1 | ✅ Complete |
| 31 | **Missing Buildings (Round 2)** — implement the ~15 buildings absent after epic 27: chapel, workshop-building, steamworks, magneto, tradepost, harbor, factory, quarry, oilWell, ziggurat, calciner consumption side, spaceport-bonfire, chronosphere, reactor, biolab, aiCore, accelerator, zebraForge/Outpost/Workshop | 27 | P1 | ✅ Complete |
| 32 | **UI Parity Pass** — close all UI gaps found in live parity audit: religion TU section, trade economics, space mission/on-off, buildings on/off + rename system, village happiness/festival/management, resource maxValue display | 26, 29, 31 | P1 | ✅ Complete |
| 33 | **UI Unlock & Visibility Parity** — replace hardcoded client visibility shortcuts with legacy-faithful unlock/visible rules for tabs, subpanels, jobs, actions, and conditional sections | 20, 21, 25, 32 | P1 | ✅ Complete |
| 34 | **Production & Control Parity Audit** — retroactively file and continue the live-save production/control fixes discovered after Epic 33: building enable/disable actions, smelter/steamworks production consumers, legacy toggle visibility rules, and remaining automation gaps | 21, 31, 32, 33 | P1 | ✅ Complete |
| 35 | **UI QoL Parity** — close the remaining legacy convenience/UI-density gaps: adaptive craft shortcuts, hide-complete toggles, mechanization craft controls, resource table organization, and repetitive-action quantity controls | 25, 26, 32, 33, 34 | P1 | ✅ Complete |
| 36 | **Building Unlock Architecture** — separate `unlockable` (research grants permission) from `unlocked` (resource threshold reveals) in engine state, matching legacy's two-step model; retire duplicated `requiredTech` gates where science unlock chains already own the gate; fix the whole class of unicornPasture-style reveal bugs | 27, 31, 35 | P1 | ✅ Complete |
| 37 | **Building Control Granularity Parity** — restore legacy distinction between per-building count controls (`togglable`) and binary full-on/full-off controls (`togglableOnOff`), with engine-owned control metadata, batch action surface, and smelter-style web controls | 34, 35 | P1 | ✅ Complete |
| 38 | **Trade Shortcut Quantity Parity** — replace fixed caravan shortcuts with legacy dynamic `tradeHalf` / `tradeFifth` behavior and matching amount calculations | 35 | P2 | ✅ Complete |
| 39 | **Workshop Engineer Assignment Engine** — add per-craft engineer assignment state and action surface as the engine prerequisite for deferred mechanization UI parity | 09, 35 | P2 | ✅ Complete |
| 40 | **Population/Resource Decoupling** — remove the phantom `kittens` resource row and stop simulating population as a normal resource; keep village population authoritative and expose only the UI data that parity actually requires | 21, 25, 26, 36 | P1 | ✅ Complete |
| 41 | **Resource Cost Highlighting** — when hovering a purchasable item, highlight required resources in the resource panel with dimmed non-required rows, a target marker on each progress bar, and a live ETA countdown to reach each required amount | 26, 33 | P1 | ✅ Complete |
| 42 | **Storage Ratio Parity** — restore legacy `barnRatio` / `warehouseRatio` storage-cap consumption for barn, warehouse, and harbor, and refresh serialized resource caps immediately after storage-affecting actions | 21, 27, 31 | P1 | ✅ Complete |
| 43 | **Dynamic Building Consumer Parity** — restore missing runtime consumers for dynamic harbor, oil well, reactor, and mint effect paths, and downgrade any falsely-complete parity rows until behavior is proven | 21, 31, 34, 42 | P1 | ✅ Complete |
| 44 | **Session Management** — full save lifecycle (create, pause/resume, archive, delete, export) with REST API surface, a CLI package, and an admin sessions panel in the web client | 17, 22 | P1 | ✅ Complete |
| 45 | **Live Save Import Parity** — make imported legacy saves match live legacy runtime state, especially over-cap resources, derived storage/population stats, and post-import snapshot fidelity | 21, 28, 29, 42 | P0 | ✅ Complete |
