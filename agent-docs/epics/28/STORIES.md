# Epic 28 — Legacy Save Import

Allow players to import legacy Kittens Game save files (LZString-compressed strings exported from the original game) into the new engine. Three-layer implementation: pure migration function in the engine, decompression + endpoint in the server, file/paste UI in the client.

Legacy reference: `legacy/js/game.js` (`save()`, `load()`, `decompressLZData()`, `migrateSave()`)

---

## Architectural notes

**Array → Record conversion**: Legacy saves all domains as arrays of `{name, ...}`. The new engine uses `Record<string, T>` keyed by `name`. Every domain needs this conversion.

**Key renames** (must not be missed — they cause silent data loss):
- `resources: manpower` → key `catpower`
- `village.nextKittenProgress` → `kittenProgress`
- `village.kittens` (array of kitten objects) → derive count via `.length`
- `religion.faith` → `religion.worship`
- `time.cfu` → `time.cfus`, `time.vsu` → `time.vsus`

**LZString** lives only in the server package — never in the engine.

---

## Story 28-1 — Engine: `migrateLegacySave` pure function

**Why it exists**: All translation logic lives in the engine package so it can be unit-tested exhaustively without a running server. The function is pure — no LZString dependency, no I/O, no side effects.

**Legacy reference**: `game.js` `save()` / `load()` / `migrateSave()`; per-domain save() methods in `village.js`, `science.js`, `workshop.js`, `religion.js`, `space.js`, `diplomacy.js`, `time.js`, `prestige.js`, `challenges.js`, `achievements.js`

**ACs**:
- [ ] `migrateLegacySave(legacyJson: unknown): SerializedGameState` exported from `packages/engine/src/legacy-migration.ts` and re-exported from `packages/engine/src/index.ts`
- [ ] Returns a value that passes `deserialize()` without throwing
- [ ] **Resources**: array → Record; `manpower` → `catpower`; unknown names dropped; missing resources default to `{value:0, maxValue:0, perTick:0}`
- [ ] **Buildings**: array → Record; drops `stage`, `jammed`, `isAutomationEnabled`; unknown names dropped
- [ ] **Village**: `kittens` array length → `kittens` count; `nextKittenProgress` → `kittenProgress`; `jobs` array → Record; discards `biomes`, `loadouts`, `map`
- [ ] **Calendar**: maps `day`, `season`, `year` directly; drops `weather`, `festivalDays`, `cycle`, `cycleYear`
- [ ] **Science**: `techs` and `policies` arrays → Records; keeps `unlocked`, `researched`, `blocked`
- [ ] **Workshop**: `upgrades` and `crafts` arrays → Records; for crafts keeps only `unlocked` (drops `value`, `progress`); drops `zebraUpgrades`
- [ ] **Religion**: `faith` → `worship`; keeps `faithRatio`, `transcendenceTier`; `zu`/`ru`/`tu` arrays → Records; discards `pact`, `corruption`, `activeHolyGenocide`
- [ ] **Prestige**: `perks` array → Record
- [ ] **Challenges**: `challenges` array → Record; discards `reserves`; sets `pending: false` on all entries
- [ ] **Space**: `programs` array → Record; `planets` array → Record (keeps `unlocked`, `reached`, `routeDays`); extracts nested `planets[i].buildings` arrays into flat `spaceBuildings` Record
- [ ] **Diplomacy**: `races` array → Record; keeps `unlocked`, `embassyLevel`; discards `collapsed`, `energy`, `duration`, `pinned`
- [ ] **Time**: `cfu` → `cfus` (array → Record), `vsu` → `vsus` (array → Record); keeps `flux`, `heat`, `isAccelerated`; discards `queueItems`, `queueSources`, `timestamp`
- [ ] **Achievements**: converts `achievements` array + `ach.badges` into `{achievements, badges, badgesUnlocked}` shape
- [ ] Defaults: `tick: 0`, `effectCache: {}`, `version: 1`
- [ ] Unknown/missing top-level keys silently ignored — never throws on partial data
- [ ] Tests: full happy-path round-trip; `manpower`→`catpower`; `nextKittenProgress`→`kittenProgress`; `faith`→`worship`; `cfu`→`cfus`; empty/missing sections; unknown building/resource names

---

## Story 28-2 — Server: `POST /api/game/import-legacy` endpoint

**Why it exists**: Decompression happens at the server boundary — the engine stays free of LZString. The server adds `lz-string`, decompresses, calls `migrateLegacySave`, then hands off to the existing `store.loadFromSave()`.

**Legacy reference**: `game.js` `decompressLZData()` (base64 first, fallback UTF-16), `_parseLSSaveData()` (raw JSON detection)

**ACs**:
- [ ] `POST /api/game/import-legacy` registered in `packages/server/src/app.ts`
- [ ] Request body: `{ data: string }` — compressed or raw JSON string
- [ ] Decompression: if `data[0] === '{'` treat as raw JSON; else try `LZString.decompressFromBase64`; else try `LZString.decompressFromUTF16`; on failure return `400 { ok: false, error: "Failed to decompress save data" }`
- [ ] JSON parse errors return `400` with descriptive message
- [ ] Calls `migrateLegacySave(parsed)` then `store.loadFromSave(migrated)`; returns same shape as `POST /api/game/load`
- [ ] Respects `?slot=` query param identically to other game routes
- [ ] `lz-string` added to `packages/server/package.json` dependencies
- [ ] `LegacyImportRequestSchema = z.object({ data: z.string().min(1) })` added to `packages/api-spec/src/schemas.ts` and exported
- [ ] `openapi.yaml` updated with `/api/game/import-legacy` path entry
- [ ] Integration tests: valid compressed save → 200; valid raw JSON → 200; garbage → 400; missing `data` → 400

---

## Story 28-3 — Client UI: Import Save panel

**Why it exists**: Players need a UI to paste or upload a legacy save string. The panel handles the full flow: paste/upload → submit → success/error feedback → game state refreshes.

**Legacy reference**: `game.js` `saveExport` / `saveImport` UI dialog

**ACs**:
- [ ] `ImportSavePanel` component at `packages/client-web/src/ImportSavePanel.tsx`
- [ ] `<textarea data-testid="import-save-input">` for pasting a save string
- [ ] `<input type="file" accept=".txt,.json" data-testid="import-save-file">` — on selection, reads file text into the textarea
- [ ] Submit button `data-testid="import-save-btn"` disabled while request in flight
- [ ] On success: shows `data-testid="import-save-success"`, invalidates TanStack Query cache for current slot
- [ ] On error: shows `data-testid="import-save-error"` with error message text
- [ ] Panel reachable from the running app without URL change (placement flexible — settings area, sidebar, or collapsible section in App.tsx)
- [ ] `postImportLegacy(data: string, slot?: string): Promise<GameStateResponse>` added to `packages/client-web/src/api.ts`
- [ ] Tests: renders, submit calls API, success state shown, error state shown, file upload populates textarea
- [ ] `lz-string` is NOT added to `client-web` (decompression is server-side only)
