// InspectorContext — shared hover/inspection state across all panels
import React from "react";

// ── Entity union ──────────────────────────────────────────────────────────────

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
  val: number;
  effects: Record<string, number>;
  prices: Array<{ name: string; val: number }>;
  resources: Record<string, ResourceSnapshot>;
}

export interface UpgradeEntity {
  kind: "upgrade";
  name: string;
  description?: string;
  researched: boolean;
  effects: Record<string, number>;
  prices: Array<{ name: string; val: number }>;
  resources: Record<string, ResourceSnapshot>;
}

export interface TechEntity {
  kind: "tech";
  name: string;
  description?: string;
  researched: boolean;
  effects: Record<string, number>;
  prices: Array<{ name: string; val: number }>;
  resources: Record<string, ResourceSnapshot>;
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

export type InspectorEntity =
  | HappinessEntity
  | ResourceEntity
  | BuildingEntity
  | UpgradeEntity
  | TechEntity
  | ZigguratUpgradeEntity
  | ReligionUpgradeEntity;

// ── Context ───────────────────────────────────────────────────────────────────

interface InspectorContextValue {
  inspected: InspectorEntity | null;
  setInspected: (entity: InspectorEntity) => void;
  clearInspected: () => void;
}

const InspectorContext = React.createContext<InspectorContextValue>({
  inspected: null,
  setInspected: () => {},
  clearInspected: () => {},
});

export function InspectorProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [inspected, setInspectedState] = React.useState<InspectorEntity | null>(null);

  const value = React.useMemo<InspectorContextValue>(
    () => ({
      inspected,
      setInspected: setInspectedState,
      clearInspected: () => setInspectedState(null),
    }),
    [inspected],
  );

  return <InspectorContext.Provider value={value}>{children}</InspectorContext.Provider>;
}

export function useInspector(): InspectorContextValue {
  return React.useContext(InspectorContext);
}
