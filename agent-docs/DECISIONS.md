# Architecture Decision Records

---

## ADR-001: Tech Stack Selection
**Date:** 2026-03-16
**Status:** Accepted

### Context
Need to choose a modern stack for a faithful rewrite of Kittens Game (legacy: ES5, Dojo, jQuery, no modules).

### Decision
| Layer | Choice | Rationale |
|-------|--------|-----------|
| Language | TypeScript 5.x strict | Safety, inference, modern ergonomics |
| Runtime | Bun | Fast, built-in TS execution, native SQLite |
| HTTP server | Hono | Tiny, typed, edge-ready |
| WebSocket | Bun native WS | Real-time state push |
| Game state DB | SQLite via Drizzle ORM | Embedded, easy backup/export |
| Testing | Vitest | Fast, ESM-native, Jest-compatible, coverage built-in |
| API spec | OpenAPI 3.1 + zod-openapi | Contract-first, generates TS types |
| Monorepo | Turborepo + pnpm | Incremental builds, isolated packages |
| Frontend | React 19 + TanStack Query | Live state sync |
| Styling | Tailwind CSS | Low-overhead |
| Linting | Biome | Unified lint + format, fast |

### Consequences
- Bun is the runtime for server; Vitest (not Bun test) for testing DX
- client-web uses Vite for bundling (Bun bundler not mature enough for React SPA)

---

## ADR-003: Manager Interface Design
**Date:** 2026-03-16
**Status:** Accepted

### Context
Legacy managers (TabManager subclasses) hold a `this.game` reference and mutate shared state. Need a pattern for the new engine that is both testable and composition-friendly.

### Decision
Each manager implements a pure `Manager` interface: `update(state) => state`, `updateEffects(state) => Record<string,number>`, `save/load/resetState`. No `this.game` pointers — state flows in and out. The engine calls managers in registration order; each sees the previous manager's output.

### Consequences
- Managers are trivially unit-testable (no game instance needed)
- Update order is explicit and deterministic (registration order = call order)
- Effect cache is rebuilt from scratch each tick (simple, correct; can optimize later)
- Divergence from legacy: DR is applied to the *summed* total across managers, not per-manager. This matches the *intended* legacy behavior per game.js comment line 140–146.
- **Load-order dependency (Epic 46):** `ScienceManager.load()` must run before `WorkshopManager.load()` because science replays tech→workshop unlocks that workshop then merges with saved flags. Reordering managers in `_fullDeserialize` would re-break stale-save healing. The `WorkshopManager.load()` merge (`su.unlocked || current.unlocked`) is the safety net, but it depends on science running first.

---

## ADR-002: Engine Purity Invariant
**Date:** 2026-03-16
**Status:** Accepted

### Context
The legacy codebase mixes game logic with DOM manipulation and global state, making it untestable.

### Decision
`packages/engine` is a pure function: `(state, action) => newState`. Zero I/O, zero side effects, zero knowledge of HTTP or DOM. The server owns the event loop and persistence.

### Consequences
- Engine is 100% unit-testable without mocks
- All side effects (persistence, WebSocket broadcast) live in the server layer
- Clients are thin renderers — no game logic on the client

---

## ADR-003: Challenge noStack semantics
**Date:** 2026-03-19
**Status:** Accepted

### Context
Legacy challenges.js `getEffect()` (lines 14–16) shows that when `stackOptions.noStack` is true, the function immediately returns the base amount with NO further modifications — LDRLimit is NOT applied even if specified alongside noStack.

### Decision
`getChallengeEffectValue()` in challenges.ts mirrors this exactly: if `noStack` is set, return `baseAmount` directly. The `LDRLimit` field in stackOptions is only meaningful alongside noStack as documentation of the intended cap for the separate stacked path (e.g., `kittenLaziness` has `{ LDRLimit: 0.25, noStack: true }` but the LDR is applied dynamically in the active-effects special case, not via the generic stacking function).

### Consequences
- Faithful parity with legacy: `noStack` really means "use the value as-is"
- The anarchy `kittenLaziness` active computation is a one-off special case (not governed by the generic noStack path)

---

## ADR-004: One-tick effect lag is accepted for now

**Date:** 2026-03-19
**Status:** Accepted

The effectCache is rebuilt after all manager updates complete. This means manager update() calls read last tick's effectCache. In the legacy, effects were computed in manager order within the same tick, so a later manager could see a fresh effect from an earlier one.

**Why accepted:** The lag is invisible for static effects (buildings, upgrades don't change tick-to-tick). It only matters for cross-system dynamic effects, whose full dependency graph is not yet known. Fixing this requires explicit dependency ordering between managers — better done at Epic 22 (Feature Parity Audit) when the full graph is visible.

**Risk:** Subtle one-tick divergence in cross-system effect chains. Watch for this in Space/Time/Diplomacy epics.

---

## ADR-006: BuildingEntry.unlocked is optional (not required)
**Date:** 2026-03-29
**Status:** Accepted

### Context
Epic 21 added a `unlocked` boolean to `BuildingEntry` to support the building auto-unlock system. Making it required (`readonly unlocked: boolean`) caused TypeScript errors in ~20 existing test files that inline building objects as `{ val: N, on: N }` without the new field. Updating all those sites would be mechanical churn with no semantic benefit.

### Decision
`BuildingEntry.unlocked` is declared as `readonly unlocked?: boolean`. Absence (`undefined`) is treated as `false` (locked) everywhere it is read:
- `BuildingManager.update()`: `if (!entry || entry.unlocked) continue` — `undefined` is falsy, skips already-unlocked buildings correctly
- `BuildingManager.load()`: always writes an explicit boolean from saved data
- `BuildingsPanel.tsx` filter: `e.unlocked` — `false`/`undefined` both filter out locked buildings

### Consequences
- Existing test helpers that create `{ val: N, on: N }` objects continue to compile with no changes
- New tests that care about unlock state explicitly set `unlocked: true/false`
- The field is a one-way flag: once set to `true` via `update()` or `load()`, it is never removed

---

## ADR-007: SessionRegistry for multi-slot game isolation
**Date:** 2026-03-29
**Status:** Accepted

### Context
Epic 22 adds multi-client support. The server previously managed a single `GameStateStore` holding one game state. For session isolation (multiple players each with their own game), we need per-slot state isolation.

### Decision
`SessionRegistry` manages a `Map<string, GameStateStore>`. Each slot gets its own store (own state, own auto-tick interval, own WS client set, own DB slot). Slot names are validated with `/^[a-zA-Z0-9_-]{1,64}$/`. HTTP routes and WS connections read `?slot=<name>` to route to the correct store.

Idle stores are kept in-memory indefinitely (no TTL cleanup). This is acceptable because each store's memory footprint is small and the server is expected to run a modest number of concurrent sessions.

### Consequences
- Clean isolation: two players on different slots can't affect each other
- The existing single-store tests still work by using `registry.getOrCreate("default")`
- TanStack Query key includes slot: `["gameState", slot]` — different slots have independent cache entries in the client
- TanStack Query v5 passes a `mutationFnContext` as second arg to `mutationFn`; wrap with `(action) => postGameAction(action, slot)` to prevent leakage

---

## ADR-008: Effect system — consumed vs produced keys
**Date:** 2026-03-30
**Status:** Accepted

### Context
Sanity check (2026-03-30) found that the effectCache has two classes of keys:
1. **Fully wired** — produced by managers AND consumed somewhere (e.g. `woodPerTickBase`, `woodRatio`, `woodJobRatio`, `priceRatio`, `unhappinessRatio`, `${name}Max`)
2. **Stub-only** — produced by defs for buildings/upgrades we haven't implemented yet (e.g. `barnRatio`, `lumberMillRatio`, `culturePerTickBase`, `energyProduction`, ~180 others)

Three bugs were found and fixed in this session:
- `woodJobRatio` / `catnipJobRatio` set by workshop upgrades but not applied to job production (fixed)
- `priceRatio` set by prestige perks but not consumed by `getBuildingPrice` (fixed)
- `unhappinessRatio` set by buildings (not yet implemented) but not consumed in happiness formula (fixed)

### Decision
Accept that stub-only keys are inert until the buildings/upgrades that produce them are implemented. The contract is: **when a new building/upgrade is added, wire its effect keys end-to-end in the same PR** — do not add defs that silently produce unread keys.

The `happiness` building bonus (e.g. sunAltar in religion) is the one currently-wired consumer with no producer yet (`effectCache.happiness` always 0). This is harmless — will be populated when religion buildings are expanded.

### How to apply
Before adding a new building or upgrade def, check that every effect key it produces has a consumer. Add the consumer in the same commit. Use `grep -rn "effectCache\[" packages/engine/src/` to audit.

---

## ADR-009: UI naming — legacy i18n is source of truth
**Date:** 2026-03-30
**Status:** Accepted

### Context
The engine uses internal identifiers (resource keys, effect keys, etc.) that differ from what the legacy UI displayed. A discrepancy was discovered: the `manpower` resource was displayed as "catpower" in legacy but stored as `"manpower"` in our engine, causing confusion.

### Decision
**Legacy `legacy/res/i18n/en.json` is the source of truth for all user-facing names.** Internal code (resource keys, effect keys, variable names) should match the legacy internal IDs where possible, but when the legacy internal name diverges from the English display name, use the display name.

Concretely:
- The `manpower` resource key was renamed to `catpower` throughout (engine, API, client).
- All derived effect keys follow suit: `manpowerMax` → `catpowerMax`, `manpowerPerTickBase` → `catpowerPerTickBase`, `manpowerJobRatio` → `catpowerJobRatio`, `manpowerMaxChallenge` → `catpowerMaxChallenge`.
- The diplomacy tab is labeled **"Trade"** (not "Diplomacy") to match `tab.name.trade` in legacy i18n.
- Tab IDs in code that differ from display names are acceptable (e.g. id `"trade"` for the Trade tab).

### Tab visibility rules (from legacy `updateTabVisibility()`)
| Tab | Unlock condition |
|-----|-----------------|
| Buildings | Always visible |
| Jobs | Always visible |
| Science | `library.on > 0` OR `calendar` OR `chronophysics` researched |
| Workshop | `workshop` building built (fallback: always shown while Epic 27 unimplemented) |
| Religion | `faith.value > 0` |
| Space | `rocketry` researched |
| Time | `calendar` researched OR cryochambers used |
| Trade | Any race unlocked |
| Achievements | Any achievement unlocked |

### How to apply
Before adding a new resource, building, or tab: check `legacy/res/i18n/en.json` for the canonical display name and match it internally.

---

## ADR-010: Engine-owned UI visibility selectors
**Date:** 2026-04-01
**Status:** Accepted

### Context
Epic 33 exposed a recurring problem: client panels were independently guessing unlock and visibility state from partial serialized data. `TabContainer`, `JobsPanel`, `ResourcePanel`, and `ActionPanel` each carried local shortcuts that drifted from legacy rules.

### Decision
Move UI unlock/visibility rules into `packages/engine/src/ui-visibility.ts` and export them from `@kittens/engine`. The selector derives tab visibility, village shell visibility, job visibility, resource visibility, and gated action/button visibility from serialized game state in one place.

The web client consumes this selector output instead of hardcoding its own heuristics. This keeps the engine/client boundary pure while still making visibility behavior a typed contract.

### Consequences
- One source of truth for unlock/visible rules across client panels
- Legacy parity fixes now land in one selector module instead of several React components
- Stats and Challenges tabs can exist as minimal shells with correct unlock behavior before they gain richer UI
- Fixtures and regression tests can assert visibility contracts directly without booting the full app

---

## ADR-011: Epic-first workflow is mandatory for substantive work
**Date:** 2026-04-01
**Status:** Accepted

### Context
Post-Epic 33 production/control parity fixes were implemented and committed before being registered under a dedicated epic. The code changes were valid, but the repo lost one of its core guarantees: future agents could not reconstruct intent, scope, or remaining work from the normal epic/story trail.

### Decision
All substantive work must start from the epic workflow. Agents must use `/epic-start <epic>` for new work or explicitly reopen an existing epic by updating `STORIES.md`, `NOTES.md`, `agent-docs/EPICS.md`, and `agent-docs/PROGRESS.md` before touching production code.

This rule applies to:
- gameplay features
- parity fixes
- production-value corrections
- UI/control-surface changes
- API/action changes
- migrations and save-format work

Only trivial documentation-only maintenance is exempt.

### Consequences
- Future agents can discover current work, remaining gaps, and legacy references from the standard docs instead of reconstructing them from git history
- "Drive-by" parity fixes are treated as process failures even when the code itself is correct
- If a new bug is found during implementation, the agent must first attach it to the active epic or open a new epic rather than quietly folding it into unrelated work

---

## ADR-15: Persist `unlockable` in engine state (not runtime-only like legacy)

### Status
Accepted — 2026-04-02

### Context
Legacy `buildings.js` keeps `unlockable` as a runtime-only flag on the meta object — it is set on init from `defaultUnlockable` or from research resolution, and is never saved to the save file. The rewrite uses event sourcing: state is the sole source of truth, and the engine processes actions against state diffs. There is no "meta object" to carry runtime fields.

### Decision
`unlockable` is stored in `BuildingEntry` (persisted state), not in a transient runtime object. `createInitialBuildings()` seeds `unlockable: true` for `defaultUnlockable` defs on first creation; `applyResearch` sets it when a tech's `unlocks.buildings` fires. This means a re-derived game from its action log will correctly carry the `unlockable` signal without replaying all past ticks.

### Consequences
- Saves include `unlockable` per building — slightly larger state, but negligible
- Any legacy save import must derive `unlockable` from the researched tech list during migration (already handled by `legacyMigration.ts` which re-applies all researched techs via `applyResearch`)
- No `requiredTech` workaround is needed — the science unlock chain owns the gate end-to-end

---

## ADR-016: Building control granularity is engine-owned
**Date:** 2026-04-02
**Status:** Accepted

### Context
Legacy bonfire controls have two distinct behaviors:
- `togglable` buildings expose count-adjust controls and allow `on` anywhere in `0..val`
- `togglableOnOff` buildings expose binary full-off / full-on controls

The rewrite already stored `val` and `on`, but the client had flattened all visible controls into a generic `On` / `Off` pair. That hid the legacy smelter-style interaction model and made the client guess control semantics from UI code.

### Decision
Control granularity is derived in `packages/engine/src/ui-visibility.ts` via `controlMode: "none" | "count" | "binary"`. The web client renders controls from that engine-owned contract instead of inferring them locally.

The existing `ENABLE_BUILDING` / `DISABLE_BUILDING` actions were extended with an optional positive `amount` rather than adding separate batch action types. Clients compute `All` from current `on` / `val`; the engine clamps results safely to `0..val`.

### Consequences
- Legacy count-adjustable buildings such as smelter now render `- / -25 / -All / + / +25 / +All`
- True binary `On` / `Off` remains only on `togglableOnOff` buildings such as steamworks
- API surface stays compact: no extra batch action enum members were needed
- Future UI work can change presentation without re-encoding legacy control rules in React

---

## ADR-017: Engineer assignment lives in engine state
**Date:** 2026-04-02
**Status:** Accepted

### Context
Mechanization-era workshop parity needs to answer two engine-owned questions:
- how many kittens are employed as engineers
- how many engineers are assigned to each craft

Before Epic 39, the rewrite exposed engineer visibility heuristics in UI selectors but had no engineer job in engine state and no per-craft assignment model. That made "free engineers" impossible to validate.

### Decision
`engineer` is modeled as a real village job, and per-craft engineer allocation is stored directly on workshop craft entries. The action surface adds `ASSIGN_CRAFT_ENGINEER` and `UNASSIGN_CRAFT_ENGINEER`, each changing assignment by one and clamping against available engineers and zero.

`UNASSIGN_JOB engineer` is guarded so engineer headcount cannot drop below the number already allocated across crafts.

### Consequences
- Workshop mechanization UI can now rely on authoritative engine state instead of inventing local assignment state
- Save/load preserves craft engineer allocation without needing a separate UI-only persistence layer
- The current rewrite still lacks legacy progress and throughput simulation for engineer work; Epic 39 only establishes the state/action prerequisite

---

## ADR-018: Population is authoritative in `village`, not `resources`
**Date:** 2026-04-03
**Status:** Accepted

### Context
Legacy still declares a transient `kittens` entry in `resPool`, but `game.update()` immediately overwrites it from village population every tick. In practice it behaves as a display alias:
- `kittens.value = village.getKittens()`
- `kittens.maxValue = village.sim.maxKittens`

The rewrite currently models `"kittens"` as a normal resource in `RESOURCE_NAMES`. That lets `ResourceManager` apply `kittensPerTickBase` to `resources.kittens`, creating a second mutable kitten count that drifts away from `state.village.kittens`. The web resource table then surfaces that phantom row.

### Decision
The rewrite will preserve gameplay semantics, not the legacy aliasing trick:
- `state.village` is the sole authoritative owner of kitten population and growth state
- generic resource ticking, storage, and affordability semantics do not apply to kittens
- the resource tab should not render a `kittens` row
- any remaining kitten count, cap, progress, or ETA displays must be derived from village state or explicit view-model helpers rather than a duplicated mutable resource entry

### Consequences
- Population-related gameplay code should read `state.village.kittens` or a dedicated population helper, not `state.resources.kittens`
- Save/load and migration code should not treat `resources.kittens` as authoritative state
- UI parity stays honest: we keep useful population feedback, but we do not preserve a misleading resource-table artifact just because legacy exposed one internally
