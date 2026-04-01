# Epic 34 — Production & Control Parity Audit — Notes

## Legacy Behavior Summary

This epic was opened retroactively after live-save testing exposed a process failure: post-Epic 33 production/control fixes had already landed in code, but they were not attached to a tracked epic/story trail.

The gameplay issue behind that process failure was real:

- smelter built successfully but did not behave like a complete conversion building
- generic autoproduction keys existed in effect cache without runtime consumers
- the web client showed `On` / `Off` on buildings that should not have had them
- the follow-up restriction accidentally hid smelter toggles because legacy toggleability is assembled across multiple files rather than declared in one obvious place

## Retroactively Captured Commits

- `154a5a9` `docs(agent-docs): tighten parity verification workflow`
- `05cafd1` `fix(engine): start production parity audit slice 1`
- `f76d835` `fix(client-web): restrict building on-off controls to toggleable buildings`

## Legacy Control-Surface Findings

### 1. Toggleability is not defined in one place

The key regression came from assuming `legacy/js/buildings.js` contained the full truth about which buildings are toggleable. It does not.

`legacy/core.js:334-356` applies additional default rules:

- buildings with `lackResConvert` become toggleable automatically
- several energy/production buildings also become toggleable through controller logic
- some buildings are then excluded or gated by special-case logic

That means control-surface parity must trace:

1. building defs
2. controller defaults
3. runtime action handlers
4. UI visibility logic

Smelter is the concrete example: it was hidden because its toggleability is implicit through `lackResConvert`, not obvious from the first building metadata pass.

### 2. Produced keys are not enough

The audit confirmed the repo had been over-crediting parity when a building merely wrote effect keys into `effectCache`. Production parity only exists once `resources.ts` or another runtime consumer actually applies those keys.

Epic 34 therefore treats these as separate questions:

- what does the def produce?
- where is it consumed?
- what player controls exist?
- what regression test proves it?

### 3. Steamworks and factory needed separate automation treatment

The first slice corrected dynamic production consumers and some runtime effects. The second slice now adds a real steamworks automation loop with persisted `jammed` / `automationEnabled` building state, annual automation, and the autumn reset/second batch path from `advancedAutomation`.

The third slice adds factory-specific carbon-sequestration mode parity:

- factories now default into the legacy high-energy / low-pollution mode once `carbonSequestration` is researched
- disabling that mode falls back to the lower-energy / capped-pollution path
- `factoryLogistics` now upgrades factory craft bonus from `0.05` to `0.06`
- factory automation state is preserved through save/load and exposed through the same engine-backed web controls as steamworks

## Steamworks Automation Notes

- Legacy reset points live in `legacy/js/calendar.js`, not just in the building def. Normal automation resets at new year; `advancedAutomation` also clears jammed state on entry to autumn.
- The rewrite now stores steamworks-local `jammed` and `automationEnabled` state in serialized building entries instead of dropping them on save/load.
- Automation controls are now engine-backed actions, not client-only toggles.
- The current rewrite covers live tick cadence. Offline `daysOffset` catch-up batching is still not modeled as a separate path because the server currently advances the game through real ticks.

## Factory Automation Notes

- Legacy factory "automation" is really the `carbonSequestration` mode switch from `legacy/js/buildings.js:1488-1511`.
- With no upgrade, factories run at `craftRatio 0.05`, `energyConsumption 2`, and `cathPollutionPerTickProd 2`.
- With `factoryLogistics`, the craft bonus rises to `0.06`.
- With `carbonSequestration` researched, the mode defaults on: energy doubles to `4`, `cathPollutionPerTickProd` drops to `0`, and `cathPollutionPerTickCon` becomes `-2`.
- Turning the mode off keeps the craft bonus but drops energy back to `2` and sets `cathPollutionPerTickProd` to `1`.

## Key Decisions

- Retroactively file the post-Epic 33 production/control work under Epic 34 instead of pretending it belonged to Epic 33.
- Treat control visibility as engine-owned selector logic, but derive it from the full legacy control path rather than only explicit building metadata.
- Keep smelter, steamworks, and factory at `⚠️` in `PARITY.md` until stock-limited runtime scaling and automation behavior are proven by tests.
- Model steamworks automation off calendar boundaries because legacy jam reset and automation cadence are season/year events, not free-running per-tick production.
- Record the workflow correction in `agents.md` and ADR-011 so future agents cannot treat undocumented drive-by parity fixes as acceptable.
- Reuse the existing building `automationEnabled` field for factory mode rather than introducing a second parallel control-state shape.

## Gotchas & Edge Cases

- `lackResConvert` is a control-surface signal, not just a production mechanic.
- A building can be toggleable even when the visible reason is buried in controller defaults.
- Client-only visibility filters are unsafe for parity-sensitive controls; they must flow from engine-owned rules.
- Production-value bugs are easy to undercount because the UI can show a building as present while its runtime consumers are still missing.

## Open Questions

- Exact smelter stock-limited scaling and iron-will auto-disable behavior still need fixture-backed parity tests.
- Steamworks automation timing should be verified against legacy tests or a controlled imported save rather than inferred from defs alone.
- Factory mode should eventually be spot-checked against an imported late-game save, even though the core energy/pollution/control loop is now covered by unit/UI tests.
