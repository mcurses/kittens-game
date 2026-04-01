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

### 3. Steamworks and factory remain partial

The first slice corrected dynamic production consumers and some runtime effects, but legacy automation behavior is still missing:

- steamworks batch auto-crafting
- jam/delay behavior
- factory automation mode
- carbon-sequestration mode switching
- automation state UI

These remain open stories inside this epic and must not be marked complete in `PARITY.md`.

## Key Decisions

- Retroactively file the post-Epic 33 production/control work under Epic 34 instead of pretending it belonged to Epic 33.
- Treat control visibility as engine-owned selector logic, but derive it from the full legacy control path rather than only explicit building metadata.
- Keep smelter, steamworks, and factory at `⚠️` in `PARITY.md` until stock-limited runtime scaling and automation behavior are proven by tests.
- Record the workflow correction in `agents.md` and ADR-011 so future agents cannot treat undocumented drive-by parity fixes as acceptable.

## Gotchas & Edge Cases

- `lackResConvert` is a control-surface signal, not just a production mechanic.
- A building can be toggleable even when the visible reason is buried in controller defaults.
- Client-only visibility filters are unsafe for parity-sensitive controls; they must flow from engine-owned rules.
- Production-value bugs are easy to undercount because the UI can show a building as present while its runtime consumers are still missing.

## Open Questions

- Exact smelter stock-limited scaling and iron-will auto-disable behavior still need fixture-backed parity tests.
- Steamworks automation timing should be verified against legacy tests or a controlled imported save rather than inferred from defs alone.
- Factory automation mode likely needs persisted state in addition to a pure effect-cache contribution.
