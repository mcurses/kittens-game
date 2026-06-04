# village-map

**Subject**: A top-down pixel-art map of a small early-village. Patches of catnip fields in the south, a cluster of huts in the center, a single library and barn to the east, dirt paths connecting them, surrounding forest at the edges. 1-2 tiny chibi cat dots visible on the paths. Parchment-style map with subtle border decoration.

**Style anchors**: see [STYLE-DNA.md](../STYLE-DNA.md). Pixel art, top-down strategic view (think Stardew Valley map screen, or a cozy fantasy hand-drawn map).

**Palette anchors**:
- background: `--bg #F2E6CF` (parchment map)
- forests: `--accent-2 #7A9A6E` (deeper green outer ring)
- catnip fields: `--res-catnip #5E8B47` (lighter green patches)
- structures: `--res-wood #8B5A2B` (small square huts)
- paths: `--ink-2 #5A4A3A` (dirt brown)
- map border: thin `--ink #2B221A` line with corner flourishes

**Negative**: see STYLE-DNA. No realistic cartography, no GPS look, no compass rose with N/S/E/W labels, no scale bars, no roads in modern paving.

**Aspect**: 16:9 (`map` variant). 1792×1008 raw → 896×504 final WEBP at `exports/maps/village.webp`.

**Belongs to loop beats**: `settlement` initially, will need versions for `industry` (more structures) and beyond. Start with the early-village state.

**Iteration log**:
- _(awaiting first generation)_

**Future variants** (planned, not yet written):
- `village-map-town.md` — when village has grown into a Town
- `village-map-city.md` — Megalopolis stage
- `village-map-cosmos.md` — late-game with space launch pad
