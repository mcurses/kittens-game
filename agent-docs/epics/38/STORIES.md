# Epic 38 — Trade Shortcut Quantity Parity

Restore the legacy trade shortcut model. The rewrite currently exposes fixed `×5` / `×25` caravan buttons, but legacy computes trade quantities dynamically from the current maximum affordable trade amount.

Legacy references:
- `legacy/js/diplomacy.js:1150-1178` — `tradeHalf` / `tradeFifth` calculation and quantity button behavior
- `legacy/js/diplomacy.js` — `getMaxTradeAmt` usage in trade UI

---

## Story 38-01 — Dynamic caravan quantity shortcuts

**Why it exists**: Legacy trade shortcuts scale with current affordability. Fixed counts are functional but not faithful.

**ACs**:
- [ ] Trade panel computes current max affordable trade amount using live catpower and trade cost
- [ ] Shortcut buttons use dynamic `floor(max / 2)` and `floor(max / 5)` semantics matching legacy
- [ ] Buttons disable or collapse safely when max affordable trade is too small
- [ ] Engine/client tests cover several affordability thresholds and edge cases

### Legacy Reference
- `legacy/js/diplomacy.js:1150-1178`

### Status: [ ] Tests | [ ] Impl | [ ] Rated
