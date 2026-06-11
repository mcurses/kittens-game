// VillagePanel — read-only village summary as a header status pill
import type { GameStateResponse } from "@kittens/api-spec";
import type React from "react";
import { useInspector } from "./InspectorContext.js";
import { buildHappinessEntity } from "./happinessInspector.js";

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
  const maxKittens = typeof effectCache?.maxKittens === "number" ? effectCache.maxKittens : 0;

  return { kittens, maxKittens, happiness };
}

export function VillagePanel({ state }: Props): React.ReactElement {
  const { setInspected, clearInspected } = useInspector();

  if (!state) {
    return (
      <div className="status-pill" data-testid="village-panel-loading">
        Loading village...
      </div>
    );
  }

  const { kittens, maxKittens, happiness } = extractVillageInfo(state);
  const happinessPct = Math.round(happiness * 100);
  const happinessEntity = buildHappinessEntity(state);

  return (
    <div className="status-pill" data-testid="village-panel">
      <span className="village-population">
        {kittens} / {maxKittens} kittens
      </span>
      <span className="status-pill-label"> — </span>
      <button
        type="button"
        data-testid="village-happiness"
        className="village-happiness"
        onMouseEnter={() => setInspected(happinessEntity)}
        onMouseLeave={clearInspected}
        onFocus={() => setInspected(happinessEntity)}
        onBlur={clearInspected}
        aria-label={`Village happiness ${happinessPct}% — focus to inspect`}
      >
        {happinessPct}% happy
      </button>
    </div>
  );
}
