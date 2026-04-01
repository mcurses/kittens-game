# Epic 37 — Building Control Granularity Parity Notes

## Legacy Behavior Summary

Legacy bonfire building controls have two separate player-facing models:

1. `togglable`
   - Player can set `on` anywhere from `0..val`
   - UI exposes `-`, `-25`, `-All`, `+`, `+25`, `+All`
   - Row shows `(on/val)` when partially enabled
   - Typical examples: smelter and other `lackResConvert` conversion buildings

2. `togglableOnOff`
   - Player flips the entire set between fully off and fully on
   - UI exposes one binary toggle link rather than count-adjust links
   - Typical example: steamworks

Legacy sources:
- `legacy/core.js:340-350` auto-promotes buildings with `lackResConvert` to `togglable`
- `legacy/core.js:1606-1632` builds the binary `togglableOnOff` link
- `legacy/core.js:1894-1937` builds the count-adjust control strip for `togglable`
- `legacy/core.js:2025-2029` displays `(on/val)` only for partially-enabled count-adjustable buildings

## Rewrite Gap

The rewrite already stores `val` and `on`, and its current actions increment/decrement `on` by one. But the web UI collapses all visible toggleable buildings into `On` / `Off` buttons, which is only faithful for binary-toggle buildings.

That creates two parity problems:
- smelter-style buildings look binary even though they are not
- the player loses the legacy batch affordances (`±25`, `All`) that make partial conversion control practical

## Key Design Goal

Keep the legacy distinction engine-owned. The client should receive enough metadata to know which control family to render, rather than inferring from building names or from the existence of `on` and `val`.

## Scope Boundaries

- This epic is about control-surface parity, not production math parity
- This epic is separate from Epic 36 (`unlockable` vs `unlocked`)
- Steamworks automation specifics remain under the already-completed Epic 34 work unless a new regression is discovered

## Open Questions

- Which exact rewrite buildings should resolve to count-adjustable controls beyond the known `lackResConvert` set (`smelter`, `calciner`, `mint`, `accelerator`)?
- Whether the action surface should add explicit batch actions, or extend the existing enable/disable actions with an `amount`/`mode` parameter while keeping the API contract readable
