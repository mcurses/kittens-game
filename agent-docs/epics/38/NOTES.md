# Epic 38 — Trade Shortcut Quantity Parity Notes

## Legacy Behavior Summary

Legacy caravan shortcuts are dynamic, not fixed:
- `tradeHalf = floor(maxTradeAmt / 2)`
- `tradeFifth = floor(maxTradeAmt / 5)`

This is driven by current affordability, not by arbitrary hardcoded counts.

Legacy also does not show those shortcuts immediately:
- the half shortcut is hidden until the player can afford at least `50` trades
- the fifth shortcut is hidden until the player can afford at least `25` trades

That visibility comes from `hasMultipleResources(race, 50)` / `hasMultipleResources(race, 25)`, not from the computed half/fifth amount alone.

## Rewrite Gap

Epic 35 added fixed `×5` / `×25` controls. That improved usability but not parity. This epic exists to close that remaining gap rather than letting the fixed shortcuts calcify as "good enough".
