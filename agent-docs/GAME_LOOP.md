# Game Loop — Conceptual Model

This document is the shared mental model for how Kittens Game actually plays. It replaces the older Forest / Iron Will / Helios "phases" framing from `kittens-game-design-system/project/README.md`, which painted progression as three fixed visual frames and didn't match the engine.

The model has three layers, increasing in granularity:

1. **Four nested loops** — the spine. _Why_ the game holds attention.
2. **Eleven stages** — concrete moments along the loops. _What_ the player does, in order.
3. **Eight emotional beats** — visual / animation tonality at any given point. _How_ it should feel.

Plus one cross-cutting design principle: **every solution creates the next problem.** Bottleneck-chain reasoning is what makes Kittens Game tick.

---

## Layer 1 — The four nested loops

Borrowed from incremental-game UX vocabulary. Each loop runs at a different timescale; they're literally nested — every Meta loop iteration contains many Progression loops, every Progression loop contains many Session loops, and so on.

| Loop | Timescale | What the player does | What the engine does |
|---|---|---|---|
| **Moment-to-moment** | per tick (200 ms) | clicks Gather Catnip; buys 1 of something; assigns a kitten to a job | runs `TICK` action: production, consumption, caps, season effects, UI delta. |
| **Session** | 5–60 min | spots a bottleneck (no wood, kittens starving, science capped), routes around it, hits the next thing | accumulates state, fires unlock predicates as thresholds cross |
| **Progression** | hours-to-days of play | researches a new tech, unlocks a new tab, builds first of a new building family, opens a whole new economy layer | flips conditional UI predicates (`ui-visibility.ts`), reveals tabs/jobs/crafts |
| **Meta** | across runs | resets with `SOFT_RESET`, keeps paragon + perks, starts a faster run | `actions.ts:268`'s `SOFT_RESET` preserves `prestige.perks`, `resources.paragon`, `resources.burnedParagon` (`prestige.ts:527-534`) |

**Why this matters for design:**

- Different UI elements serve different loops. A bouncy click-feedback on Gather Catnip is a **Moment-to-moment** affordance — high-frequency, sensory. A "Tech unlocked" toast belongs to the **Progression** loop — rare, ceremonial, gets to interrupt. Mixing the two (e.g. a particle splash every tech) wears the player out; mixing them inversely (e.g. a silent click) feels dead.
- The Meta loop is where retention lives. A player who quits without ever resetting hasn't seen the actual game.

**Tick is the heartbeat.** Server ticks every 200 ms (5 Hz). In-game time: `TICKS_PER_DAY=10` (1 day = 2 s real), `DAYS_PER_SEASON=100` (1 season = 200 s = 3:20 min), `SEASONS_PER_YEAR=4` (1 year = ~13 min). Constants live in `packages/engine/src/calendar.ts`.

---

## Layer 2 — The eleven stages

A linear walkthrough of what a player does, from `tick=0` to late-game cosmos. Each stage names the dominant mechanic and a few engine-side anchors. These are descriptive of what _actually_ happens — they're not a state machine.

### 1. Manual gathering
Player has a single button: **Gather Catnip** (`actions.ts:96-107`). One click = +1 catnip. No buildings, no kittens, no jobs. Catnip is both food and currency from the first second — that's the core design tension.

### 2. First buildings — Catnip Field
Once catnip ≥ 3 (30% of `field` cost 10), the Catnip Field auto-unlocks (`buildings.ts:1041-1072`). It produces passive catnip — the player has just converted clicks into a small income stream.

### 3. First crafted resource — Wood
Wood doesn't grow on trees here. The first wood comes from a **craft**: 100 catnip → 1 wood (`workshop.ts:1440`). The catnip-wood ratio is harsh on purpose — wood requires sacrificing food production. (Post-fix May 2026, the wood craft is visible in the UI as soon as the player holds any catnip — see `ui-visibility.ts:isResourceUnlocked` default branch.)

### 4. First housing — Hut, first kittens
Hut costs 5 wood (`buildings.ts:150`). Building it triggers the first kittens to spawn over time. This is the **fundamental gameplay shift**: from clicker to economy. Kittens consume catnip whether you assign them work or not — if you out-grow your catnip production, kittens starve (`village.consumeCatnip()`).

### 5. Jobs — Farmer, Woodcutter, Scholar
Assigning kittens to jobs (`actions.ts:35`, `village.ts:123-127`) turns single-resource clicker into multi-resource economy. Farmer: catnip. Woodcutter: wood. Scholar (after library): science. Hunter (after archery): catpower. Player now juggles a portfolio.

### 6. Science and research
Library building (`buildings.ts:183`) opens the Science tab (`ui-visibility.ts:329-336`). Science isn't a score — it's a **gating mechanic**. Researching tech unlocks new buildings, jobs, crafts, policies, tabs (`science.ts:15-28` `TechDef.unlocks`). Research is the engine that holds back complexity until the player can handle it.

### 7. Storage and crafting depth
Barn (`buildings.ts:218`) and warehouse multiply resource caps. As caps grow, the player can afford bigger crafts: wood → beam (`workshop.ts:1441`), minerals → slab, iron → plate, … crafts compound and become the way to access advanced buildings.

### 8. Seasons — recurring resilience test
4 seasons × 100 in-game-days × 10 ticks = 4000 ticks/year. Winter applies a strong negative multiplier on catnip-field production (but not on farmer-kitten production — `calendar.ts` modifiers; see also `WeatherBadge` in `ResourcePanel.tsx`). This forces the player into building **resilience**, not just throughput: spring/summer for surplus, winter for survival. The Spring-Winter cycle is the engine's most reliable pacing tool.

### 9. Hunting and Trade — active spending
Once `archery` is researched, **Hunt** action becomes visible (`ui-visibility.ts:392`, `ActionPanel.tsx:51`). Each hunt spends 100 catpower for a Furs payout, plus chance-based Ivory and rare Unicorns. Trade is the mirror mechanic: spend catpower + gold for race-specific resource bundles, also chance-based. Both lift the game from pure deterministic production into player-choice + variance.

### 10. Mid-game branches — Religion, Culture, Faith, Unicorns
Religion tab unlocks at `faith > 0` (`ui-visibility.ts`). Faith is generated by Temples, spent on Ziggurat upgrades and religion upgrades (`religion` state branch). Culture flows similarly. The game starts using abstract resources whose ROI is not directly visible — a shift from production economy to civilization economy.

### 11. Late game — Space, Time, Industry, Cosmos
`rocketry` tech unlocks the Space tab (`ui-visibility.ts:374`). Space brings planets, missions, exotic resources (`uranium`, `unobtainium`, `antimatter`). Time tab unlocks at `calendar` tech and brings Time Crystals + temporal mechanics. Industry layer (Workshop crafts multiplying) plus Space plus Time = the game's largest mechanical surface.

### 12. (Meta) Reset → Paragon → faster next run
At any point, `SOFT_RESET` (`actions.ts:268`, `prestige.ts:534`) clears active state and converts accumulated progress into **paragon**, which buys **prestige perks** (`prestige.perks`). Karma also accrues. Next run starts with those bonuses — same mechanics, faster pace. This is the Meta loop fulfilled.

---

## Cross-cutting design principle — bottleneck chains

Kittens Game's signature is that **every solution creates the next problem**. The player is never just "buying more of the same thing" — they're always working on a chain that loops back.

Classic chain a new player hits in the first 30 minutes:

```
I want more kittens                                  ← goal
  → I need more housing (huts)                        ← bottleneck 1
    → I need more wood                                ← bottleneck 2
      → I need more wood production                   ← bottleneck 3
        → I need woodcutter kittens, or chop tools    ← bottleneck 4
          → tools require science                     ← bottleneck 5
            → science requires a library              ← bottleneck 6
              → library requires wood                 ← BACK TO bottleneck 2
```

The loop closes: solving the science bottleneck requires the wood bottleneck the player was already solving. They feel like they're moving sideways but actually compounding.

**For UI / asset work this means:**

- A building card shouldn't just say what the building does — it should hint at the next bottleneck it implies. ("Library: science cap +250. Requires 25 wood." — that "25 wood" is the chain hook.)
- "Affected resources" sections (already in `InspectorPanel.tsx`) are essential, not decorative.
- Notifications for crossing thresholds (a new tab unlocks, a new resource appears) should feel like discovering the chain's next link.

The official Kittens Game design doc states explicitly that every problem should be solvable through multiple mechanics — **multiple paths to every bottleneck**. The engine reflects this: catnip can come from fields _or_ pastures (later) _or_ refined sources; wood can come from crafts _or_ woodcutters _or_ trade with the lizard race.

---

## Layer 3 — The eight emotional beats (art-direction layer)

These are not state-machine states — multiple beats can be true at once. Use them to pick art tone, animation pacing, copy mood. "Current dominant beat" for purposes of background-tinting can be defined as the latest one whose predicate has fired.

| Beat | Triggered when… | Tone | Visual / audio anchors |
|---|---|---|---|
| `solitude` | `village.kittens === 0` and no buildings built | Clicker satisfaction, quiet curiosity | Dark sparse background. Single pixel cat. Wide empty fields. **The Gather Catnip button is the loud visual centerpiece** — oversized, satisfying scale-pop, particle splash in `--res-catnip`. |
| `first-growth` | First `field` built and wood-craft visible | "Aha — something I made causes a thing." | Subtle palette warming. Catnip-green seeps into the resource list. Tiny motion in the field tile. |
| `settlement` | `kittens > 0` and `hut.val > 0` | Warmth, responsibility, naming | Cat characters with procedurally-generated names. Huts drawn as standing structures. |
| `specialization` | Any job has assignments | Control, optimization | UI densifies. Job columns, status indicators in semantic colors (`--ok`, `--warn`). Less whitespace, more legibility. |
| `curiosity` | `library.val > 0` and `science > 0` | Decision, identity formation | Science tab fades in with a one-time glow. First tech choice gets generous spacing and a hero illustration card. |
| `divergence` | Religion (`faith > 0`), Trade (any race unlocked), or War (`archery` researched) | Branching, characterization | Parallel tab clusters surface together. Tab colors diverge: religion magenta (`--sacred`), trade gold, war rust. |
| `industry` | `workshop.val > 0` and ≥ 5 crafts unlocked | Complexity leap, late mid-game | Crafting UI gets dense. Production-tickers animate. Resource bars become two-line. |
| `cosmos` | `rocketry` researched (Space tab) | Departure, humility, scale shift | Background fundamentally changes — starfield, cool accent (`--cyber #14F0D8`). Warm palette retreats to interior panels. |

The eight beats map to the eleven stages roughly: stages 1 = `solitude`, 2-3 = `first-growth`, 4-5 = `settlement`+`specialization`, 6 = `curiosity`, 7 + season 8 = `specialization` deepens, 9-10 = `divergence`, 11 = `industry` + `cosmos`. The Meta loop (stage 12) doesn't have its own beat — it's a moment, not a sustained mood.

---

## Implications for UI / asset work

Drawn directly from the model above:

- **Inspector hover cards** (the active sprint — see `assets/exports/buildings/`): tone the artwork to the dominant beat. A Field card during `solitude` is sparse and parchment-toned; during `industry` the same card can carry more visual noise.
- **Click feedback** (Moment-to-moment loop): max impact during `solitude` (Cookie-Clicker hero button), moderate during `settlement`, ambient during `industry`. Don't apply infantile bounce to a `cosmos` tech research click.
- **Threshold-crossing notifications** (Progression loop): celebrate bottleneck-chain links opening. New tab appearing, new resource entering the panel, first kitten spawning — these are ceremonial moments worth a one-time animation.
- **Tab visibility transitions** should feel earned. The new tab should glow once on first appearance, then settle. (`TabContainer.tsx:54-64` controls render, `ui-visibility.ts` controls visibility — wire a "newly visible" CSS class via local state, fade out after a few seconds.)
- **Season indicators** (UI element for the Calendar) deserve their own visual treatment — winter must _feel_ different from spring, not just say "winter" in text. Background tone shift + a snow-particle layer in `CalendarDisplay.tsx`.
- **Reset is a UI ceremony**, not a button. When the Meta loop fires, the player should feel they earned that paragon. Future sprint: a fullscreen "you offered N kittens to the void, gained M paragon" hero moment.

---

## What this document doesn't do

- Implement a runtime `deriveLoopBeat(state)` function. Future sprint — see roadmap in `/Users/eewianco/.claude/plans/`.
- Override copy / tone-of-voice rules. Voice is governed by `kittens-game-design-system/project/README.md` — bone-dry, deadpan, no emoji.
- Hard-code asset paths. See `assets/README.md` for the canonical layout.
- Define balance numbers (resource ratios, craft costs, etc.). Those live in the engine and the legacy game's design.
