// VillagePanel — read-only village summary: kittens, happiness, population cap
import type { GameStateResponse } from "@kittens/api-spec";
import React from "react";

interface Props {
  state: GameStateResponse | null | undefined;
}

interface VillageInfo {
  kittens: number;
  maxKittens: number;
  happiness: number;
}

function extractVillageInfo(state: GameStateResponse): VillageInfo {
  const raw = state as unknown as Record<string, unknown>;

  const village = raw.village as Record<string, unknown> | null | undefined;
  const kittens = typeof village?.kittens === "number" ? village.kittens : 0;
  const happiness = typeof village?.happiness === "number" ? village.happiness : 1.0;

  const effectCache = raw.effectCache as Record<string, unknown> | null | undefined;
  const maxKittens =
    typeof effectCache?.maxKittens === "number" ? effectCache.maxKittens : 0;

  return { kittens, maxKittens, happiness };
}

export function VillagePanel({ state }: Props): React.ReactElement {
  if (!state) {
    return <div data-testid="village-panel-loading">Loading village...</div>;
  }

  const { kittens, maxKittens, happiness } = extractVillageInfo(state);
  const happinessPct = Math.round(happiness * 100);

  return (
    <div data-testid="village-panel">
      <span className="village-population">
        {kittens} / {maxKittens} kittens
      </span>
      {" — "}
      <span className="village-happiness">{happinessPct}% happy</span>
    </div>
  );
}
