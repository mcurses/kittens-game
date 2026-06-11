// Derive village display info from player state.
// Two outputs, two skalas:
//   • label  → original kittensgame's 19-tier title (Outpost / Small Village /
//     Village / Settlement / Smalltown / Town / City / Megalopolis / …).
//     Single source of truth in @kittens/engine so the tab title and the
//     map sublabel stay in sync.
//   • key    → asset bucket (5 WebPs exist under public/assets/maps/).
//     Uses max(kittens, buildings/4) so a player with 0 kittens but 200
//     fields still gets a non-empty looking map.

import { getVillageTitle } from "@kittens/engine";

export type VillageStageKey =
  | "bonfire"
  | "settlement"
  | "village"
  | "town"
  | "city";

export interface VillageStage {
  key: VillageStageKey;
  label: string;
}

export function deriveVillageStage(
  kittens: number,
  totalBuildings: number = 0,
): VillageStage {
  const label = getVillageTitle(kittens);
  const score = Math.max(kittens, Math.floor(totalBuildings / 4));
  let key: VillageStageKey;
  if (score < 5) key = "bonfire";
  else if (score < 16) key = "settlement";
  else if (score < 51) key = "village";
  else if (score < 151) key = "town";
  else key = "city";
  return { key, label };
}
