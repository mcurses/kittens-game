# Epic 52 — Toolbar / HUD Parity

Add the top-bar HUD elements that legacy displays: energy, sorrow, MOTD, winter warning.

## Stories

### 52-01 Energy Display
**Goal:** Show energy (watts) in a persistent HUD bar.

**ACs:**
- [ ] `⚡ X W` display in toolbar/top area
- [ ] Tooltip or inspector shows: production, consumption, deficit breakdown
- [ ] Negative energy shown in red
- [ ] Test: verify energy display reflects engine state

### 52-02 Winter Energy Warning
**Goal:** Show orange warning when winter production drops below consumption.

**ACs:**
- [ ] Warning badge appears in energy display during winter deficit
- [ ] Warning disappears when season changes or deficit resolves
- [ ] Test: verify warning appears in winter with insufficient energy buildings

### 52-03 Energy Deficit Production Penalty
**Goal:** Display `-X%` production penalty when energy is in deficit.

**ACs:**
- [ ] Penalty percentage shown near energy display
- [ ] Penalty value matches engine's computed penalty
- [ ] Test: verify penalty display matches engine calculation

### 52-04 Sorrow Indicator
**Goal:** Show sorrow percentage in the HUD.

**ACs:**
- [ ] Sorrow % displayed when > 0
- [ ] Tooltip explains sorrow source and effects
- [ ] Test: verify sorrow display appears when state has sorrow > 0

### 52-05 MOTD Display
**Goal:** Show message-of-the-day with "fresh" highlight.

**ACs:**
- [ ] MOTD area in toolbar
- [ ] Fresh MOTD highlighted (unseen indicator)
- [ ] MOTD content driven by game events/calendar
- [ ] Test: verify MOTD renders when message exists in state
