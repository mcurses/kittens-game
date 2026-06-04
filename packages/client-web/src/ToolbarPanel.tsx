// ToolbarPanel — persistent HUD strip showing energy, sorrow, and UI controls
import type { GameStateResponse } from "@kittens/api-spec";
import React from "react";
import { useCardSize } from "./useCardSize.js";
import { extractResources } from "./utils.js";

interface Props {
  state: GameStateResponse | null | undefined;
}

function extractEffectCache(state: GameStateResponse): Record<string, number> {
  const raw = state as unknown as Record<string, unknown>;
  const ec = raw.effectCache;
  if (typeof ec !== "object" || ec === null) return {};
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(ec as Record<string, unknown>)) {
    if (typeof value === "number") result[key] = value;
  }
  return result;
}

function extractTechResearched(state: GameStateResponse, techName: string): boolean {
  const raw = state as unknown as Record<string, unknown>;
  const science = raw.science;
  if (typeof science !== "object" || science === null) return false;
  const techs = (science as Record<string, unknown>).techs;
  if (typeof techs !== "object" || techs === null) return false;
  const tech = (techs as Record<string, unknown>)[techName];
  if (typeof tech !== "object" || tech === null) return false;
  return (tech as Record<string, unknown>).researched === true;
}

function computeEnergy(effectCache: Record<string, number>): {
  prod: number;
  cons: number;
  net: number;
  delta: number;
  penalty: number;
} {
  const prodRatio = 1 + (effectCache.energyProductionRatio ?? 0);
  const consRatio =
    (1 +
      (effectCache.energyConsumptionRatio ?? 0) +
      (effectCache.energyConsumptionIncrease ?? 0));
  const prod = (effectCache.energyProduction ?? 0) * prodRatio;
  const cons = (effectCache.energyConsumption ?? 0) * consRatio;
  const net = prod - cons;

  let delta = cons === 0 ? 0 : prod / cons;
  if (delta < 0.25) delta = 0.25;
  const penalty = net >= 0 ? 0 : Math.floor((1 - delta) * 100);

  return { prod, cons, net, delta, penalty };
}

function formatEnergy(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1000) return `${(n / 1000).toFixed(2)}kW`;
  if (abs >= 100) return `${n.toFixed(0)}W`;
  if (abs >= 10) return `${n.toFixed(1)}W`;
  return `${n.toFixed(2)}W`;
}

export function ToolbarPanel({ state }: Props): React.ReactElement {
  const [cardSize, setCardSize] = useCardSize();

  const effectCache = state ? extractEffectCache(state) : {};
  const resources = state ? extractResources(state) : {};
  const hasElectricity = state ? extractTechResearched(state, "electricity") : false;

  const energy = state && hasElectricity ? computeEnergy(effectCache) : null;

  const sorrowRes = resources.sorrow;
  const sorrowVal = sorrowRes?.value ?? 0;
  const sorrowMax = sorrowRes?.maxValue ?? 0;
  const showSorrow = sorrowVal > 0;

  return (
    <div className="toolbar-panel" data-testid="toolbar-panel">
      {energy && (
        <span
          data-testid="toolbar-energy"
          className={`toolbar-energy${energy.net < 0 ? " warning" : ""}`}
          title={buildEnergyTooltip(energy)}
        >
          {formatEnergy(energy.net)}
        </span>
      )}
      {showSorrow && (
        <span
          data-testid="toolbar-sorrow"
          className={`toolbar-sorrow${sorrowVal >= sorrowMax && sorrowMax > 0 ? " max" : ""}`}
          title="Black Liquid Sorrow — accumulated through dark rituals"
        >
          BLS: {Math.round(sorrowVal)}%
        </span>
      )}
      <button
        type="button"
        data-testid="toolbar-card-size"
        className="btn btn--xs btn--toggle btn--toggle-dark"
        onClick={() => setCardSize(cardSize === "compact" ? "large" : "compact")}
        title={`Cards: ${cardSize === "compact" ? "compact (click for large)" : "large (click for compact)"}`}
        aria-pressed={cardSize === "large"}
      >
        {cardSize === "compact" ? "⊟" : "⊞"} Cards
      </button>
    </div>
  );
}

function buildEnergyTooltip(energy: {
  prod: number;
  cons: number;
  net: number;
  penalty: number;
}): string {
  let tip = `Production: ${energy.prod.toFixed(2)}W\nConsumption: -${energy.cons.toFixed(2)}W`;
  if (energy.penalty > 0) {
    tip += `\nDeficit penalty: -${energy.penalty}%`;
  }
  return tip;
}
