// SpacePanel — planet missions and space buildings
import type { GameStateResponse } from "@kittens/api-spec";
import { PROGRAM_DEFS, SPACE_BUILDING_DEFS } from "@kittens/engine";
import React from "react";
import { useGameAction } from "./useGameAction.js";

interface ResourceMap {
  [key: string]: { value: number };
}

interface ProgramEntry {
  name: string;
  val: number;
  on: number;
  unlocked: boolean;
}

interface SpaceBuildingEntry {
  name: string;
  val: number;
  on: number;
  unlocked: boolean;
}

interface Props {
  state: GameStateResponse | null | undefined;
}

function extractResources(state: GameStateResponse): ResourceMap {
  const raw = state as unknown as Record<string, unknown>;
  const resources = raw.resources;
  if (typeof resources !== "object" || resources === null) return {};
  const result: ResourceMap = {};
  for (const [k, v] of Object.entries(resources as Record<string, unknown>)) {
    if (typeof v === "object" && v !== null && typeof (v as Record<string, unknown>).value === "number") {
      result[k] = { value: (v as Record<string, unknown>).value as number };
    }
  }
  return result;
}

function canAfford(prices: readonly { name: string; val: number }[], resources: ResourceMap): boolean {
  return prices.every((p) => (resources[p.name]?.value ?? 0) >= p.val);
}

function extractSpace(state: GameStateResponse): {
  programs: ProgramEntry[];
  spaceBuildings: SpaceBuildingEntry[];
} {
  const raw = state as unknown as Record<string, unknown>;
  const space = raw.space as Record<string, unknown> | null | undefined;
  if (!space) return { programs: [], spaceBuildings: [] };

  const programsRaw = space.programs as Record<string, unknown> | null | undefined;
  const programs: ProgramEntry[] = programsRaw
    ? Object.entries(programsRaw)
        .map(([name, e]) => {
          if (typeof e !== "object" || e === null) return null;
          const entry = e as Record<string, unknown>;
          return {
            name,
            val: typeof entry.val === "number" ? entry.val : 0,
            on: typeof entry.on === "number" ? entry.on : 0,
            unlocked: entry.unlocked === true,
          };
        })
        .filter((e): e is ProgramEntry => e !== null && e.unlocked)
    : [];

  const sbRaw = space.spaceBuildings as Record<string, unknown> | null | undefined;
  const spaceBuildings: SpaceBuildingEntry[] = sbRaw
    ? Object.entries(sbRaw)
        .map(([name, e]) => {
          if (typeof e !== "object" || e === null) return null;
          const entry = e as Record<string, unknown>;
          return {
            name,
            val: typeof entry.val === "number" ? entry.val : 0,
            on: typeof entry.on === "number" ? entry.on : 0,
            unlocked: entry.unlocked === true,
          };
        })
        .filter((e): e is SpaceBuildingEntry => e !== null && e.unlocked)
    : [];

  return { programs, spaceBuildings };
}

export function SpacePanel({ state }: Props): React.ReactElement {
  const { mutate, isPending } = useGameAction();

  if (!state) {
    return <div data-testid="space-panel-loading">Loading space...</div>;
  }

  const { programs, spaceBuildings } = extractSpace(state);
  const resources = extractResources(state);

  return (
    <div data-testid="space-panel">
      <h2>Space</h2>

      {programs.length > 0 && (
        <section>
          <h3>Missions</h3>
          <ul>
            {programs.map((p) => {
              const def = PROGRAM_DEFS.find((d) => d.name === p.name);
              const prices = def?.prices ?? [];
              const affordable = canAfford(prices, resources);
              return (
                <li key={p.name} data-testid={`program-${p.name}`}>
                  <span>{p.name}</span>
                  <button
                    type="button"
                    data-testid={`program-${p.name}-launch`}
                    disabled={isPending || !affordable}
                    onClick={() => mutate({ type: "LAUNCH_MISSION", name: p.name })}
                  >
                    Launch
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {spaceBuildings.length > 0 && (
        <section>
          <h3>Space Buildings</h3>
          <ul>
            {spaceBuildings.map((b) => {
              const def = SPACE_BUILDING_DEFS.find((d) => d.name === b.name);
              const prices = def ? (() => {
                const base = def.prices.map((p) => ({
                  name: p.name,
                  val: p.val * Math.pow(def.priceRatio, b.val),
                }));
                return base;
              })() : [];
              const affordable = canAfford(prices, resources);
              return (
                <li key={b.name} data-testid={`sb-${b.name}`}>
                  <span>{b.name}</span>
                  {" ×"}
                  {b.val}
                  <button
                    type="button"
                    data-testid={`sb-${b.name}-buy`}
                    disabled={isPending || !affordable}
                    onClick={() => mutate({ type: "BUY_SPACE_BUILDING", name: b.name })}
                  >
                    Buy
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {programs.length === 0 && spaceBuildings.length === 0 && (
        <p>No space content unlocked yet.</p>
      )}
    </div>
  );
}
