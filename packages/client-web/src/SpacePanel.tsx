// SpacePanel — planet missions and space buildings
import type { GameStateResponse } from "@kittens/api-spec";
import { PROGRAM_DEFS, SPACE_BUILDING_DEFS } from "@kittens/engine";
import React from "react";
import { useGameAction } from "./useGameAction.js";
import { canAfford, extractResources } from "./utils.js";

interface ProgramEntry { name: string; val: number; on: number; unlocked: boolean; }
interface SpaceBuildingEntry { name: string; val: number; on: number; unlocked: boolean; }
interface Props { state: GameStateResponse | null | undefined; }

function extractSpace(state: GameStateResponse): { programs: ProgramEntry[]; spaceBuildings: SpaceBuildingEntry[]; } {
  const raw = state as unknown as Record<string, unknown>;
  const space = raw.space as Record<string, unknown> | null | undefined;
  if (!space) return { programs: [], spaceBuildings: [] };

  const programsRaw = space.programs as Record<string, unknown> | null | undefined;
  const programs: ProgramEntry[] = programsRaw
    ? Object.entries(programsRaw).map(([name, e]) => {
        if (typeof e !== "object" || e === null) return null;
        const entry = e as Record<string, unknown>;
        return { name, val: typeof entry.val === "number" ? entry.val : 0,
          on: typeof entry.on === "number" ? entry.on : 0, unlocked: entry.unlocked === true };
      }).filter((e): e is ProgramEntry => e !== null && e.unlocked)
    : [];

  const sbRaw = space.spaceBuildings as Record<string, unknown> | null | undefined;
  const spaceBuildings: SpaceBuildingEntry[] = sbRaw
    ? Object.entries(sbRaw).map(([name, e]) => {
        if (typeof e !== "object" || e === null) return null;
        const entry = e as Record<string, unknown>;
        return { name, val: typeof entry.val === "number" ? entry.val : 0,
          on: typeof entry.on === "number" ? entry.on : 0, unlocked: entry.unlocked === true };
      }).filter((e): e is SpaceBuildingEntry => e !== null && e.unlocked)
    : [];

  return { programs, spaceBuildings };
}

export function SpacePanel({ state }: Props): React.ReactElement {
  const { mutate, isPending } = useGameAction();

  if (!state) {
    return <div className="loading-text" data-testid="space-panel-loading">Loading…</div>;
  }

  const { programs, spaceBuildings } = extractSpace(state);
  const resources = extractResources(state);

  if (programs.length === 0 && spaceBuildings.length === 0) {
    return (
      <div data-testid="space-panel">
        <p className="panel-empty">No space content unlocked yet.</p>
      </div>
    );
  }

  return (
    <div data-testid="space-panel">
      {programs.length > 0 && (
        <>
          <div className="panel-label">Missions</div>
          <ul className="item-list">
            {programs.map((p) => {
              const def = PROGRAM_DEFS.find((d) => d.name === p.name);
              const prices = def?.prices ?? [];
              const affordable = canAfford(prices, resources);
              return (
                <li key={p.name} data-testid={`program-${p.name}`} className="item-row">
                  <span className="item-row-name">{p.name}</span>
                  <button type="button" data-testid={`program-${p.name}-launch`}
                    className={`btn btn--sm${affordable ? " btn--primary" : " btn--secondary"}`}
                    disabled={isPending || !affordable}
                    onClick={() => mutate({ type: "LAUNCH_MISSION", name: p.name })}>
                    Launch
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {spaceBuildings.length > 0 && (
        <div className={programs.length > 0 ? "panel-subsection" : ""}>
          <div className="panel-label">Space Buildings</div>
          <ul className="card-grid" style={{ listStyle: "none" }}>
            {spaceBuildings.map((b) => {
              const def = SPACE_BUILDING_DEFS.find((d) => d.name === b.name);
              const prices = def ? def.prices.map((p) => ({
                name: p.name, val: p.val * Math.pow(def.priceRatio, b.val),
              })) : [];
              const affordable = canAfford(prices, resources);
              return (
                <li key={b.name} data-testid={`sb-${b.name}`} className="item-card">
                  <div className="item-card-header">
                    <span className="item-name">{b.name}</span>
                    <span className={`item-count${b.val > 0 ? " item-count--has" : ""}`}>{b.val}</span>
                  </div>
                  <button type="button" data-testid={`sb-${b.name}-buy`}
                    className={`btn btn--sm${affordable ? " btn--primary" : " btn--secondary"}`}
                    disabled={isPending || !affordable}
                    onClick={() => mutate({ type: "BUY_SPACE_BUILDING", name: b.name })}>
                    Build
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
