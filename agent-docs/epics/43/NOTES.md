# Epic: 43 — Notes

## Legacy Behavior Summary

- Harbor is not purely static in legacy. `cargoShips` and ship count scale all harbor storage caps via `harborRatio`, with limited DR and a limit influenced by reactors and `harborLimitRatioPolicy`. `barges` separately boosts harbor coal storage.
- Oil well is not purely static in legacy. `pumpjack` enables a binary automation/control mode, increases oil output through `oilWellRatio`, and adds energy/pollution side effects while enabled.
- Reactor is not purely static in legacy. `coldFusion` and `thoriumReactors` change `energyProduction`, introduce thorium consumption, and affect automation behavior when thorium is missing.
- Mint is not purely static in legacy. Mint output depends on manpower stock and is modified by `mintRatio` and `mintIvoryRatio`.

## Why This Epic Exists

- The rewrite already produces the relevant effect keys in workshop/science data, but current runtime manager code appears to consume only the static building defs for these systems.
- `agent-docs/PARITY.md` currently over-credits at least harbor, oilWell, reactor, and mint as `✅` even though their dynamic runtime behavior still looks partial or missing.
- This is the same class of bug as the Epic 42 `stoneBarns` issue: producer exists, consumer path is missing or incomplete.

## Expected Audit Targets

- `packages/engine/src/buildings.ts`
- `packages/engine/src/workshop.ts`
- `packages/engine/src/science.ts`
- `packages/engine/src/parity.test.ts`
- `packages/engine/src/buildings.test.ts`
- `packages/server/src/store.test.ts` if immediate serialized-state refresh needs additional regression coverage

## Gotchas & Edge Cases

- Harbor storage scaling must coexist with the Epic 42 barn/warehouse ratio fix; the legacy order of operations matters.
- Oil well and reactor both have control-state implications, not just numerical effect multipliers.
- Mint output depends on manpower stock in legacy, so a definition-only port is not enough to claim parity.

## Open Questions

- Whether mint manpower-stock scaling and reactor uranium auto-disable should land in the same implementation slice or be explicitly split into follow-up stories during TDD.
