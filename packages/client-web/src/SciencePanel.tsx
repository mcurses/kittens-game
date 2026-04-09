// SciencePanel — displays technologies, policies, and prestige perks
import type { GameStateResponse } from "@kittens/api-spec";
import { PERK_DEFS, POLICY_DEFS, TECH_DEFS } from "@kittens/engine";
import React from "react";
import { useInspector } from "./InspectorContext.js";
import { useSlot } from "./SlotContext.js";
import { PERK_FLAVOR, POLICY_FLAVOR, TECH_FLAVOR } from "./flavorText.js";
import { useGameAction } from "./useGameAction.js";
import { usePersistentUiState } from "./usePersistentUiState.js";
import { canAfford, extractResources, isStorageLimited } from "./utils.js";

interface TechEntry {
  name: string;
  unlocked: boolean;
  researched: boolean;
}

interface PolicyEntry {
  name: string;
  unlocked: boolean;
  blocked: boolean;
  researched: boolean;
}

interface PerkEntry {
  name: string;
  unlocked: boolean;
  researched: boolean;
}

interface Props {
  state: GameStateResponse | null | undefined;
}

/** Extract techs array from serialized game state (duck-typed). */
function extractTechs(state: GameStateResponse): TechEntry[] {
  const raw = state as unknown as Record<string, unknown>;
  const science = raw.science;
  if (typeof science !== "object" || science === null) return [];
  const techs = (science as Record<string, unknown>).techs;
  if (typeof techs !== "object" || techs === null) return [];
  return Object.entries(techs as Record<string, unknown>)
    .map(([name, entry]) => {
      if (typeof entry !== "object" || entry === null) return null;
      const e = entry as Record<string, unknown>;
      return {
        name,
        unlocked: e.unlocked === true,
        researched: e.researched === true,
      };
    })
    .filter((e): e is TechEntry => e !== null && e.unlocked);
}

function extractPolicies(state: GameStateResponse): PolicyEntry[] {
  const raw = state as unknown as Record<string, unknown>;
  const science = raw.science;
  if (typeof science !== "object" || science === null) return [];
  const policies = (science as Record<string, unknown>).policies;
  if (typeof policies !== "object" || policies === null) return [];
  return Object.entries(policies as Record<string, unknown>)
    .map(([name, entry]) => {
      if (typeof entry !== "object" || entry === null) return null;
      const e = entry as Record<string, unknown>;
      return {
        name,
        unlocked: e.unlocked === true,
        blocked: e.blocked === true,
        researched: e.researched === true,
      };
    })
    .filter((e): e is PolicyEntry => e !== null && e.unlocked);
}

function extractPerks(state: GameStateResponse): PerkEntry[] {
  const raw = state as unknown as Record<string, unknown>;
  const prestige = raw.prestige;
  if (typeof prestige !== "object" || prestige === null) return [];
  const perks = (prestige as Record<string, unknown>).perks;
  if (typeof perks !== "object" || perks === null) return [];
  return Object.entries(perks as Record<string, unknown>)
    .map(([name, entry]) => {
      if (typeof entry !== "object" || entry === null) return null;
      const e = entry as Record<string, unknown>;
      return {
        name,
        unlocked: e.unlocked === true,
        researched: e.researched === true,
      };
    })
    .filter((e): e is PerkEntry => e !== null && e.unlocked);
}

export function SciencePanel({ state }: Props): React.ReactElement {
  const slot = useSlot();
  const { mutate, isPending } = useGameAction(slot);
  const { setInspected, clearInspected } = useInspector();
  const [hideResearched, setHideResearched] = usePersistentUiState<boolean>(
    "science:hideResearched",
    false,
    isBoolean,
  );
  const [policyHideResearched, setPolicyHideResearched] = usePersistentUiState<boolean>(
    "policy:hideResearched",
    false,
    isBoolean,
  );
  const [policyHideBlocked, setPolicyHideBlocked] = usePersistentUiState<boolean>(
    "policy:hideBlocked",
    false,
    isBoolean,
  );

  if (!state) {
    return <div className="loading-text" data-testid="science-panel-loading">Loading…</div>;
  }

  const techs = extractTechs(state);
  const policies = extractPolicies(state);
  const perks = extractPerks(state);
  const resources = extractResources(state);

  const visibleTechs = hideResearched ? techs.filter((t) => !t.researched) : techs;

  let visiblePolicies = policies;
  if (policyHideResearched) visiblePolicies = visiblePolicies.filter((p) => !p.researched);
  if (policyHideBlocked) visiblePolicies = visiblePolicies.filter((p) => !p.blocked);

  // Metaphysics visible when metaphysics tech researched AND paragon > 0, or any perk researched
  const metaphysicsTech = techs.find((t) => t.name === "metaphysics");
  const paragonVal = resources.paragon?.value ?? 0;
  const anyPerkResearched = perks.some((p) => p.researched);
  const showMetaphysics =
    (metaphysicsTech?.researched && paragonVal > 0) || anyPerkResearched;

  return (
    <div data-testid="science-panel">
      {/* ── Technologies ── */}
      <div className="panel-label">Technologies</div>
      <label className="toggle-label" data-testid="science-hide-researched-label">
        <input
          type="checkbox"
          data-testid="science-hide-researched"
          checked={hideResearched}
          onChange={(e) => setHideResearched(e.target.checked)}
        />
        {" Hide researched"}
      </label>
      {visibleTechs.length === 0 ? (
        <p className="panel-empty">No technologies available.</p>
      ) : (
        <ul className="item-list">
          {visibleTechs.map((t) => {
            const def = TECH_DEFS.find((d) => d.name === t.name);
            const prices = def?.prices ?? [];
            const affordable = canAfford(prices, resources);
            const storageLimited = isStorageLimited(prices, resources);
            const costLabel =
              prices.length > 0
                ? prices.map((p) => `${p.val} ${p.name}`).join(", ")
                : "";

            return (
              <li
                key={t.name}
                data-testid={`tech-${t.name}`}
                className="item-row"
                onMouseEnter={() =>
                  setInspected({
                    kind: "tech",
                    name: t.name,
                    description: def?.description,
                    flavor: TECH_FLAVOR[t.name],
                    researched: t.researched,
                    effects: def?.effects ?? {},
                    prices: [...prices],
                    resources,
                  })
                }
                onMouseLeave={clearInspected}
                onFocus={() =>
                  setInspected({
                    kind: "tech",
                    name: t.name,
                    description: def?.description,
                    flavor: TECH_FLAVOR[t.name],
                    researched: t.researched,
                    effects: def?.effects ?? {},
                    prices: [...prices],
                    resources,
                  })
                }
                onBlur={clearInspected}
                tabIndex={0}
              >
                <span className="item-row-name tech-name">{t.name}</span>
                {costLabel && !t.researched && (
                  <span className="item-row-cost">{costLabel}</span>
                )}
                <div className="item-row-actions">
                  {t.researched ? (
                    <span className="done-badge tech-done">✓ Done</span>
                  ) : (
                    <button
                      type="button"
                      data-testid={`tech-${t.name}-research`}
                      className={`btn btn--sm${affordable ? " btn--primary" : " btn--secondary"}${storageLimited ? " btn--limited" : ""}`}
                      disabled={isPending || !affordable}
                      onClick={() => mutate({ type: "RESEARCH", name: t.name })}
                    >
                      Research
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* ── Policies ── */}
      {policies.length > 0 && (
        <>
          <div className="panel-label">Policies</div>
          <label className="toggle-label">
            <input
              type="checkbox"
              data-testid="policy-hide-researched"
              checked={policyHideResearched}
              onChange={(e) => setPolicyHideResearched(e.target.checked)}
            />
            {" Hide adopted"}
          </label>
          <label className="toggle-label">
            <input
              type="checkbox"
              data-testid="policy-hide-blocked"
              checked={policyHideBlocked}
              onChange={(e) => setPolicyHideBlocked(e.target.checked)}
            />
            {" Hide blocked"}
          </label>
          <ul className="item-list">
            {visiblePolicies.map((p) => {
              const def = POLICY_DEFS.find((d) => d.name === p.name);
              const prices = def?.prices ?? [];
              const affordable = canAfford(prices, resources);
              const costLabel =
                prices.length > 0
                  ? prices.map((pr) => `${pr.val} ${pr.name}`).join(", ")
                  : "";

              return (
                <li
                  key={p.name}
                  data-testid={`policy-${p.name}`}
                  className="item-row"
                  onMouseEnter={() =>
                    setInspected({
                      kind: "policy",
                      name: p.name,
                      flavor: POLICY_FLAVOR[p.name],
                      researched: p.researched,
                      blocked: p.blocked,
                      effects: def?.effects ?? {},
                      prices: [...prices],
                      resources,
                    })
                  }
                  onMouseLeave={clearInspected}
                  onFocus={() =>
                    setInspected({
                      kind: "policy",
                      name: p.name,
                      flavor: POLICY_FLAVOR[p.name],
                      researched: p.researched,
                      blocked: p.blocked,
                      effects: def?.effects ?? {},
                      prices: [...prices],
                      resources,
                    })
                  }
                  onBlur={clearInspected}
                  tabIndex={0}
                >
                  <span className="item-row-name">{p.name}</span>
                  {costLabel && !p.researched && !p.blocked && (
                    <span className="item-row-cost">{costLabel}</span>
                  )}
                  <div className="item-row-actions">
                    {p.researched ? (
                      <span className="done-badge">✓ Done</span>
                    ) : p.blocked ? (
                      <span className="blocked-badge">Blocked</span>
                    ) : (
                      <button
                        type="button"
                        data-testid={`policy-${p.name}-adopt`}
                        className={`btn btn--sm${affordable ? " btn--primary" : " btn--secondary"}`}
                        disabled={isPending || !affordable}
                        onClick={() => mutate({ type: "RESEARCH_POLICY", name: p.name })}
                      >
                        Adopt
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {/* ── Metaphysics ── */}
      {showMetaphysics && (
        <>
          <div className="panel-label">Metaphysics</div>
          {paragonVal > 0 && (
            <button
              type="button"
              className="btn btn--sm btn--secondary"
              disabled={isPending}
              onClick={() => mutate({ type: "BURN_PARAGON" })}
            >
              Burn Paragon
            </button>
          )}
          <ul className="item-list">
            {perks
              .filter((p) => !p.researched || !hideResearched)
              .map((p) => {
                const def = PERK_DEFS.find((d) => d.name === p.name);
                const prices = def?.prices ?? [];
                const affordable = canAfford(prices, resources);
                const costLabel =
                  prices.length > 0
                    ? prices.map((pr) => `${pr.val} ${pr.name}`).join(", ")
                    : "";

                return (
                  <li
                    key={p.name}
                    data-testid={`perk-${p.name}`}
                    className="item-row"
                    onMouseEnter={() =>
                      setInspected({
                        kind: "perk",
                        name: p.name,
                        flavor: PERK_FLAVOR[p.name],
                        researched: p.researched,
                        effects: def?.effects ?? {},
                        prices: [...prices],
                        resources,
                      })
                    }
                    onMouseLeave={clearInspected}
                    onFocus={() =>
                      setInspected({
                        kind: "perk",
                        name: p.name,
                        flavor: PERK_FLAVOR[p.name],
                        researched: p.researched,
                        effects: def?.effects ?? {},
                        prices: [...prices],
                        resources,
                      })
                    }
                    onBlur={clearInspected}
                    tabIndex={0}
                  >
                    <span className="item-row-name">{p.name}</span>
                    {costLabel && !p.researched && (
                      <span className="item-row-cost">{costLabel}</span>
                    )}
                    <div className="item-row-actions">
                      {p.researched ? (
                        <span className="done-badge">✓ Done</span>
                      ) : (
                        <button
                          type="button"
                          data-testid={`perk-${p.name}-purchase`}
                          className={`btn btn--sm${affordable ? " btn--primary" : " btn--secondary"}`}
                          disabled={isPending || !affordable}
                          onClick={() => mutate({ type: "PURCHASE_PERK", name: p.name })}
                        >
                          Purchase
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
          </ul>
        </>
      )}
    </div>
  );
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}
