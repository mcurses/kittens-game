// InspectorContext — shared hover/inspection state across all panels
import React from "react";

// ── Entity union ──────────────────────────────────────────────────────────────

export interface ResourceAttributionEntry {
  label: string;
  amount: number;
  channel: "base" | "ratio" | "direct" | "prod" | "autoprod" | "consumption";
}

export interface ResourceEntity {
  kind: "resource";
  name: string;
  value: number;
  maxValue?: number;
  perTick?: number;
  breakdown: {
    base: number;
    ratio: number;
    direct: number;
    consumption: number;
  };
  attribution?: ResourceAttributionEntry[];
  /**
   * Set when the resource is produced through a Workshop craft recipe (beam,
   * slab, manuscript, …). The inspector renders a "Wird gecraftet aus"
   * section so the user understands they don't gather it directly.
   */
  craftRecipe?: {
    prices: Array<{ name: string; val: number }>;
    output: number;
    resources: Record<string, ResourceSnapshot>;
    engineers: number;
  };
}

export interface ResourceSnapshot {
  value: number;
  maxValue?: number;
  perTick?: number;
}

export interface HappinessEntity {
  kind: "happiness";
  totalPct: number;
  breakdown: {
    base: number;
    buildings: number;
    luxuries: number;
    karma: number;
    festival: number;
    penalty: number;
    penaltyBase: number;
    penaltyMitigation: number;
  };
}

export interface BuildingEntity {
  kind: "building";
  name: string;
  description?: string;
  flavor?: string;
  automationEnabled?: boolean;
  val: number;
  on?: number;
  effects: Record<string, number>;
  prices: Array<{ name: string; val: number }>;
  resources: Record<string, ResourceSnapshot>;
  iconPath?: string;
}

export interface UpgradeEntity {
  kind: "upgrade";
  name: string;
  description?: string;
  flavor?: string;
  researched: boolean;
  effects: Record<string, number>;
  prices: Array<{ name: string; val: number }>;
  resources: Record<string, ResourceSnapshot>;
  iconPath?: string;
}

export interface TechEntity {
  kind: "tech";
  name: string;
  description?: string;
  flavor?: string;
  researched: boolean;
  effects: Record<string, number>;
  prices: Array<{ name: string; val: number }>;
  resources: Record<string, ResourceSnapshot>;
  iconPath?: string;
}

export interface ZigguratUpgradeEntity {
  kind: "zigguratUpgrade";
  name: string;
  description?: string;
  val: number;
  effects: Record<string, number>;
  prices: Array<{ name: string; val: number }>;
  resources: Record<string, ResourceSnapshot>;
}

export interface ReligionUpgradeEntity {
  kind: "religionUpgrade";
  name: string;
  description?: string;
  val: number;
  effects: Record<string, number>;
  prices: Array<{ name: string; val: number }>;
  resources: Record<string, ResourceSnapshot>;
}

export interface CraftEntity {
  kind: "craft";
  name: string;
  flavor?: string;
  engineers: number;
  progress: number;
}

export interface CraftShortcutEntity {
  kind: "craftShortcut";
  name: string;
  amount: number;
  output: number;
  prices: Array<{ name: string; val: number }>;
  resources: Record<string, ResourceSnapshot>;
}

export interface JobEntity {
  kind: "job";
  name: string;
  description?: string;
  flavor?: string;
  modifiers: Array<{ resource: string; perTick: number }>;
}

export interface PolicyEntity {
  kind: "policy";
  name: string;
  description?: string;
  flavor?: string;
  researched: boolean;
  blocked: boolean;
  effects: Record<string, number>;
  prices: Array<{ name: string; val: number }>;
  resources: Record<string, ResourceSnapshot>;
}

export interface PerkEntity {
  kind: "perk";
  name: string;
  description?: string;
  flavor?: string;
  researched: boolean;
  effects: Record<string, number>;
  prices: Array<{ name: string; val: number }>;
  resources: Record<string, ResourceSnapshot>;
}

export interface KittenLifeEventView {
  year: number;
  kind: string;
  text: string;
  /** Optional kitten-id reference (Romance / Coworker-Bond). */
  relatedKittenId?: string;
}

export interface KittenAppearanceView {
  breed: string;
  body: string;
  eyes: string;
  accessory: string | null;
}

export interface KittenEntity {
  kind: "kitten";
  /** Stable kitten id used for identity comparisons. Displayed as inspector "name". */
  id: string;
  /** Full display name (e.g. "Mittens Smoke"). */
  name: string;
  surname: string;
  age: number;
  birthYear: number;
  trait: string;
  job: string | null;
  rank: number;
  exp: number;
  isFavorite: boolean;
  isLeader: boolean;
  appearance: KittenAppearanceView;
  originStory: string;
  traitFlavor: string;
  lifeEvents: KittenLifeEventView[];
  portraitPath: string | null;
  /** Mother's kitten id, or null if seed/legacy. */
  motherId: string | null;
  /** Father's kitten id, or null if seed/legacy. */
  fatherId: string | null;
  /** Optional lookup table {kittenId → name+surname} for clickable parent links. Built by caller from village.sim. */
  kittenNameById?: Record<string, string>;
}

export type InspectorEntity =
  | HappinessEntity
  | ResourceEntity
  | BuildingEntity
  | UpgradeEntity
  | TechEntity
  | ZigguratUpgradeEntity
  | ReligionUpgradeEntity
  | CraftEntity
  | CraftShortcutEntity
  | JobEntity
  | PolicyEntity
  | PerkEntity
  | KittenEntity;

// ── Context ───────────────────────────────────────────────────────────────────
//
// Two-state model:
//   • `hovered`  — set by onMouseEnter/onFocus, cleared by onMouseLeave/onBlur
//   • `pinned`   — set by onClick on a card; survives mouse-out and lets the
//                  user navigate elsewhere while the entity remains visible.
//
// What the inspector renders is `inspected = pinned ?? hovered`. That way:
//   • Unpinned: hover anywhere → see; mouse out → cleared. Same as before.
//   • Pinned:   hover does nothing visible; click another card → pin switches;
//               explicit unpin (button or double-click on empty space) clears.
//
// The legacy `setInspected(entity)` API stays as an alias for `setHovered` so
// existing call-sites in the seven panels don't break.

interface InspectorContextValue {
  /** Resolved entity the panel renders: pinned takes priority over hovered. */
  inspected: InspectorEntity | null;
  hovered: InspectorEntity | null;
  pinned: InspectorEntity | null;
  isPinned: boolean;
  /** Legacy alias for setHovered; kept for backwards-compat. */
  setInspected: (entity: InspectorEntity) => void;
  setHovered: (entity: InspectorEntity | null) => void;
  setPinned: (entity: InspectorEntity | null) => void;
  /** Clear the hover only — pinned persists. */
  clearInspected: () => void;
}

const InspectorContext = React.createContext<InspectorContextValue>({
  inspected: null,
  hovered: null,
  pinned: null,
  isPinned: false,
  setInspected: () => {},
  setHovered: () => {},
  setPinned: () => {},
  clearInspected: () => {},
});

export function InspectorProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [hovered, setHovered] = React.useState<InspectorEntity | null>(null);
  const [pinned, setPinned] = React.useState<InspectorEntity | null>(null);

  // Global double-click on empty space unpins. A double-click inside any
  // card or interactive element is ignored — the card-side onClick already
  // handles single-click pin/switch.
  React.useEffect(() => {
    const onDblClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t || !t.closest) return;
      if (
        t.closest(
          ".item-card, .tech-card, .upgrade-card, .census-card, .craft-row, .race-row, .inspector-panel, [data-pinnable], button, input, select, a",
        )
      ) {
        return;
      }
      setPinned(null);
    };
    document.addEventListener("dblclick", onDblClick);
    return () => document.removeEventListener("dblclick", onDblClick);
  }, []);

  const value = React.useMemo<InspectorContextValue>(
    () => ({
      inspected: pinned ?? hovered,
      hovered,
      pinned,
      isPinned: pinned !== null,
      setInspected: setHovered,
      setHovered,
      setPinned,
      clearInspected: () => setHovered(null),
    }),
    [hovered, pinned],
  );

  return <InspectorContext.Provider value={value}>{children}</InspectorContext.Provider>;
}

export function useInspector(): InspectorContextValue {
  return React.useContext(InspectorContext);
}

/** Stable identity comparison for pin-marker rendering. Two entities of the
 *  same kind+name are treated as the same target. */
export function isSameEntity(a: InspectorEntity | null, b: InspectorEntity | null): boolean {
  if (a === null || b === null) return a === b;
  if (a.kind !== b.kind) return false;
  // Kittens have non-unique names — use id for identity.
  if (a.kind === "kitten" && b.kind === "kitten") return a.id === b.id;
  if ("name" in a && "name" in b) return a.name === b.name;
  return false;
}

/**
 * Build the standard set of card-root event handlers + `data-pinned` flag for
 * an entity. Spread it onto an `<li>` / `<div>` / `<button>` card-root and the
 * card becomes hover-inspectable and click-pinnable in one go.
 *
 * The `onClick` is a no-op when the click lands on a nested interactive
 * element (button, input, select, a) — so Buy / Research / Purchase buttons
 * keep working untouched.
 */
export function pinBindings(
  entity: InspectorEntity,
  inspector: InspectorContextValue,
): {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onFocus: () => void;
  onBlur: () => void;
  onClick: (e: React.MouseEvent) => void;
  "data-pinned": "true" | "false";
  tabIndex: 0;
} {
  return {
    onMouseEnter: () => inspector.setHovered(entity),
    onMouseLeave: inspector.clearInspected,
    onFocus: () => inspector.setHovered(entity),
    onBlur: inspector.clearInspected,
    onClick: (e: React.MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("button, input, select, a, [data-no-pin]")) return;
      inspector.setPinned(entity);
    },
    "data-pinned": isSameEntity(inspector.pinned, entity) ? "true" : "false",
    tabIndex: 0,
  };
}
