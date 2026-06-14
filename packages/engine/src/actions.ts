import type { Tick } from "@kittens/shared";
import { produce } from "immer";
import { BUILDING_DEFS, canAfford, getBuildingPrice, applyUpgradeBuildingStage, applyDowngradeBuildingStage } from "./buildings.js";
import { applyCompleteChallenge, applyStartChallenge } from "./challenges.js";
import type { Manager } from "./manager.js";
import { applyBurnParagon, applyPurchasePerk, applySoftReset } from "./prestige.js";
import {
  applyAdore,
  applyBuyReligionUpgrade,
  applyBuyTranscendenceUpgrade,
  applyBuyZigguratUpgrade,
  applyPraise,
  applyRefineTimeCrystals,
  applySacrificeAlicorns,
  applySacrificeUnicorns,
  applyTranscend,
} from "./religion.js";
import { applyResearch, applyResearchPolicy } from "./science.js";
import { applySendEmbassy, applyTrade } from "./diplomacy.js";
import { applyBuySpaceBuilding, applyLaunchMission } from "./space.js";
import { applyBuyCfu, applyBuyVsu, applyShatterTc } from "./time.js";
import type { GameState } from "./state.js";
import { JOB_DEFS, applyHunt, applyHoldFestival, applyMilestoneWitnesses, applyPromoteKitten, applyRemoveLeader, applySetKittenPortrait, applySetLeader, applyToggleFavorite, applyUnassignKitten, pickKittensForJob, sanitizeVillageName, totalAssignedKittens } from "./village.js";
import type { KittenTrait } from "./village.js";
import { describeJobAssigned, describeJobLeft, describeMilestoneBuilding, describeMilestoneResearch } from "./kittens/loreTemplates.js";

/**
 * Per-building trait affinity for milestone witness selection. The first
 * matching trait carries the building's vocation — kittens with this trait
 * are 2× weighted when picking who remembers the first time it was built.
 * Buildings without an entry use an empty array (no preference).
 */
const BUILDING_MILESTONE_TRAITS: Record<string, readonly KittenTrait[]> = {
  library: ["scientist"],
  academy: ["scientist"],
  observatory: ["scientist"],
  bioLab: ["scientist", "chemist"],
  smelter: ["metallurgist"],
  calciner: ["metallurgist", "chemist"],
  factory: ["engineer"],
  steamworks: ["engineer"],
  magneto: ["engineer"],
  reactor: ["engineer", "chemist"],
  aiCore: ["engineer", "scientist"],
  mine: ["metallurgist"],
  quarry: ["metallurgist"],
  oilWell: ["engineer"],
  amphitheatre: ["wise", "merchant"],
  chapel: ["wise"],
  temple: ["wise"],
  ziggurat: ["wise"],
  tradepost: ["merchant"],
  mint: ["merchant"],
};
import { applyAssignCraftEngineer, applyCraft, applyPurchaseUpgrade, applyUnassignCraftEngineer, getAssignedCraftEngineers } from "./workshop.js";

/** Discriminated union of all possible game actions */
export type GameAction =
  | { readonly type: "TICK" }
  | { readonly type: "GATHER_CATNIP" }
  | { readonly type: "BUY_BUILDING"; readonly name: string }
  | { readonly type: "ENABLE_BUILDING"; readonly name: string; readonly amount?: number | undefined }
  | { readonly type: "DISABLE_BUILDING"; readonly name: string; readonly amount?: number | undefined }
  | { readonly type: "ENABLE_BUILDING_AUTOMATION"; readonly name: string }
  | { readonly type: "DISABLE_BUILDING_AUTOMATION"; readonly name: string }
  | { readonly type: "ASSIGN_JOB"; readonly job: string; readonly count?: number | undefined }
  | { readonly type: "UNASSIGN_JOB"; readonly job: string; readonly count?: number | undefined }
  | { readonly type: "RESEARCH"; readonly name: string }
  | { readonly type: "RESEARCH_POLICY"; readonly name: string }
  | { readonly type: "PURCHASE_UPGRADE"; readonly name: string }
  | { readonly type: "CRAFT"; readonly name: string; readonly amount: number }
  | { readonly type: "ASSIGN_CRAFT_ENGINEER"; readonly name: string }
  | { readonly type: "UNASSIGN_CRAFT_ENGINEER"; readonly name: string }
  | { readonly type: "BUY_ZIGGURAT_UPGRADE"; readonly name: string }
  | { readonly type: "BUY_RELIGION_UPGRADE"; readonly name: string }
  | { readonly type: "BUY_TRANSCENDENCE_UPGRADE"; readonly name: string }
  | { readonly type: "PRAISE" }
  | { readonly type: "ADORE" }
  | { readonly type: "TRANSCEND" }
  | { readonly type: "PURCHASE_PERK"; readonly name: string }
  | { readonly type: "SOFT_RESET" }
  | { readonly type: "START_CHALLENGE"; readonly name: string }
  | { readonly type: "COMPLETE_CHALLENGE"; readonly name: string }
  | { readonly type: "LAUNCH_MISSION"; readonly name: string }
  | { readonly type: "BUY_SPACE_BUILDING"; readonly name: string }
  | { readonly type: "SEND_EMBASSY"; readonly name: string }
  | { readonly type: "TRADE"; readonly name: string; readonly amount?: number | undefined }
  | { readonly type: "BUY_CFU"; readonly name: string }
  | { readonly type: "BUY_VSU"; readonly name: string }
  | { readonly type: "SHATTER_TC" }
  | { readonly type: "BURN_PARAGON" }
  | { readonly type: "SACRIFICE_UNICORNS" }
  | { readonly type: "SACRIFICE_ALICORNS" }
  | { readonly type: "REFINE_TIME_CRYSTALS" }
  | { readonly type: "HUNT"; readonly amount?: number | undefined }
  | { readonly type: "HOLD_FESTIVAL" }
  | { readonly type: "PROMOTE_KITTEN"; readonly kittenId: string }
  | { readonly type: "TOGGLE_FAVORITE"; readonly kittenId: string }
  | { readonly type: "UNASSIGN_KITTEN"; readonly kittenId: string }
  | { readonly type: "SET_LEADER"; readonly kittenId: string }
  | { readonly type: "REMOVE_LEADER" }
  | { readonly type: "SET_KITTEN_PORTRAIT"; readonly kittenId: string; readonly path: string | null }
  | { readonly type: "UPGRADE_BUILDING_STAGE"; readonly name: string }
  | { readonly type: "DOWNGRADE_BUILDING_STAGE"; readonly name: string }
  | { readonly type: "TOGGLE_RESOURCE_VISIBILITY"; readonly name: string }
  | { readonly type: "RENAME_VILLAGE"; readonly name: string };

/**
 * Pure reducer: apply an action to a state and return the next state.
 * Never mutates the input state.
 *
 * For full tick semantics (manager updates + effect cache), use `tick()` from tick.ts.
 * This reducer is used by the server for single-action dispatch.
 */
export function applyAction(
  state: GameState,
  action: GameAction,
  managers: readonly Manager[] = [],
): GameState {
  switch (action.type) {
    case "TICK": {
      // Inline tick to avoid circular imports; mirrors tick.ts logic
      let next: GameState = { ...state, tick: (state.tick + 1) as Tick };
      for (const manager of managers) {
        next = manager.update(next);
      }
      return next;
    }
    case "GATHER_CATNIP": {
      return produce(state, (draft) => {
        const catnip = draft.resources.catnip ?? { value: 0, maxValue: 0 };
        // Match legacy addRes: no cap when maxValue === 0, clamp to maxValue when > 0.
        if (catnip.maxValue > 0) {
          catnip.value = Math.min(catnip.value + 1, catnip.maxValue);
        } else {
          catnip.value += 1;
        }
        draft.resources.catnip = catnip;
      });
    }
    case "BUY_BUILDING": {
      const def = BUILDING_DEFS.find((b) => b.name === action.name);
      if (!def) return state;

      const building = state.buildings[action.name] ?? { val: 0, on: 0, unlocked: false };
      const prices = getBuildingPrice(def, building.val, state.effectCache);

      if (!canAfford(prices, state.resources)) return state;

      // First-time milestone marker: snapshot before increment.
      const wasFirstEver = building.val === 0;

      const next = produce(state, (draft) => {
        // Deduct resources
        for (const price of prices) {
          const entry = draft.resources[price.name];
          if (entry) {
            entry.value -= price.val;
          }
        }
        // Increment building val and on
        const b = draft.buildings[action.name] ?? { val: 0, on: 0, unlocked: false };
        b.val += 1;
        b.on += 1;
        draft.buildings[action.name] = b;
      });

      // Witness-event only on the very first build, never on repeats —
      // keeps the log meaningful instead of spammy.
      if (wasFirstEver) {
        return applyMilestoneWitnesses(
          next,
          `building:${action.name}`,
          describeMilestoneBuilding,
          BUILDING_MILESTONE_TRAITS[action.name] ?? [],
          action.name,
        );
      }
      return next;
    }
    case "ENABLE_BUILDING": {
      if (!BUILDING_DEFS.some((b) => b.name === action.name)) return state;

      const building = state.buildings[action.name];
      if (!building || building.on >= building.val) return state;
      const amount = Math.max(1, Math.floor(action.amount ?? 1));

      return produce(state, (draft) => {
        const b = draft.buildings[action.name];
        if (!b || b.on >= b.val) return;
        b.on = Math.min(b.val, b.on + amount);
      });
    }
    case "DISABLE_BUILDING": {
      if (!BUILDING_DEFS.some((b) => b.name === action.name)) return state;

      const building = state.buildings[action.name];
      if (!building || building.on <= 0) return state;
      const amount = Math.max(1, Math.floor(action.amount ?? 1));

      return produce(state, (draft) => {
        const b = draft.buildings[action.name];
        if (!b || b.on <= 0) return;
        b.on = Math.max(0, b.on - amount);
      });
    }
    case "ENABLE_BUILDING_AUTOMATION": {
      if (!BUILDING_DEFS.some((b) => b.name === action.name)) return state;

      return produce(state, (draft) => {
        const b = draft.buildings[action.name];
        if (!b) return;
        b.automationEnabled = true;
      });
    }
    case "DISABLE_BUILDING_AUTOMATION": {
      if (!BUILDING_DEFS.some((b) => b.name === action.name)) return state;

      return produce(state, (draft) => {
        const b = draft.buildings[action.name];
        if (!b) return;
        b.automationEnabled = false;
      });
    }
    case "ASSIGN_JOB": {
      const def = JOB_DEFS.find((j) => j.name === action.job);
      if (!def) return state;

      const assigned = totalAssignedKittens(state.village);
      const freeKittens = state.village.kittens - assigned;
      if (freeKittens <= 0) return state;

      const count = Math.min(action.count ?? 1, freeKittens);
      if (count <= 0) return state;

      // Trait-affinity-aware pick: matched kittens first, then by skill.
      // Each gets a lore line that reflects *why* they were chosen.
      const picks = pickKittensForJob(state.village.sim, action.job, count);
      const pickById = new Map(picks.map((p) => [p.id, p.score] as const));

      const year = state.calendar.year;
      return produce(state, (draft) => {
        const job = draft.village.jobs[action.job] ?? { value: 0 };
        // Counter increments by full `count` to stay consistent with legacy state
        // where `village.kittens` may exceed `sim.length` (older saves / tests).
        job.value += count;
        draft.village.jobs[action.job] = job;
        for (const k of draft.village.sim) {
          const score = pickById.get(k.id);
          if (score === undefined) continue;
          k.job = action.job;
          const reason = score >= 1 ? "matchedTrait" : "reassigned";
          (k as { lifeEvents: { year: number; kind: string; text: string }[] }).lifeEvents = [
            ...k.lifeEvents,
            { year, kind: "jobChange", text: describeJobAssigned(action.job, reason) },
          ];
        }
      });
    }
    case "UNASSIGN_JOB": {
      const def = JOB_DEFS.find((j) => j.name === action.job);
      if (!def) return state;

      const job = state.village.jobs[action.job] ?? { value: 0 };
      if (job.value <= 0) return state;

      const count = Math.min(action.count ?? 1, job.value);
      if (action.job === "engineer") {
        const nextValue = job.value - count;
        if (nextValue < getAssignedCraftEngineers(state)) return state;
      }

      const year = state.calendar.year;
      return produce(state, (draft) => {
        const j = draft.village.jobs[action.job] ?? { value: 0 };
        j.value -= count;
        draft.village.jobs[action.job] = j;
        // Unassign individual kittens (from end, lowest skill first isn't implemented yet)
        let remaining = count;
        for (let i = draft.village.sim.length - 1; i >= 0 && remaining > 0; i--) {
          const k = draft.village.sim[i]!;
          if (k.job === action.job) {
            k.job = null;
            (k as { lifeEvents: { year: number; kind: string; text: string }[] }).lifeEvents = [
              ...k.lifeEvents,
              { year, kind: "jobLeft", text: describeJobLeft(action.job, "quotaCut") },
            ];
            remaining--;
          }
        }
      });
    }
    case "RESEARCH": {
      const before = state.science.techs[action.name];
      const next = applyResearch(state, action.name);
      // Witness only when research actually completed this call (transition
      // false → true). applyResearch is a no-op if already researched / not
      // unlocked / unaffordable, so identity comparison is the cheapest gate.
      if (next === state) return next;
      const after = next.science.techs[action.name];
      if (!before?.researched && after?.researched) {
        return applyMilestoneWitnesses(
          next,
          `research:${action.name}`,
          describeMilestoneResearch,
          [], // No trait preference for now — scientific moments belong to whole village
          action.name,
        );
      }
      return next;
    }
    case "RESEARCH_POLICY": {
      return applyResearchPolicy(state, action.name);
    }
    case "PURCHASE_UPGRADE": {
      return applyPurchaseUpgrade(state, action.name);
    }
    case "CRAFT": {
      return applyCraft(state, action.name, action.amount);
    }
    case "ASSIGN_CRAFT_ENGINEER": {
      return applyAssignCraftEngineer(state, action.name);
    }
    case "UNASSIGN_CRAFT_ENGINEER": {
      return applyUnassignCraftEngineer(state, action.name);
    }
    case "BUY_ZIGGURAT_UPGRADE": {
      return applyBuyZigguratUpgrade(state, action.name);
    }
    case "BUY_RELIGION_UPGRADE": {
      return applyBuyReligionUpgrade(state, action.name);
    }
    case "BUY_TRANSCENDENCE_UPGRADE": {
      return applyBuyTranscendenceUpgrade(state, action.name);
    }
    case "PRAISE": {
      return applyPraise(state);
    }
    case "ADORE": {
      return applyAdore(state);
    }
    case "TRANSCEND": {
      return applyTranscend(state);
    }
    case "PURCHASE_PERK": {
      return applyPurchasePerk(state, action.name);
    }
    case "SOFT_RESET": {
      return applySoftReset(state, managers);
    }
    case "START_CHALLENGE": {
      return applyStartChallenge(state, action.name);
    }
    case "COMPLETE_CHALLENGE": {
      return applyCompleteChallenge(state, action.name);
    }
    case "LAUNCH_MISSION": {
      return applyLaunchMission(state, action.name);
    }
    case "BUY_SPACE_BUILDING": {
      return applyBuySpaceBuilding(state, action.name);
    }
    case "SEND_EMBASSY": {
      return applySendEmbassy(state, action.name);
    }
    case "TRADE": {
      const times = action.amount ?? 1;
      let s = state;
      for (let i = 0; i < times; i++) s = applyTrade(s, action.name);
      return s;
    }
    case "BUY_CFU": {
      return applyBuyCfu(state, action.name);
    }
    case "BUY_VSU": {
      return applyBuyVsu(state, action.name);
    }
    case "SHATTER_TC": {
      return applyShatterTc(state);
    }
    case "BURN_PARAGON": {
      return applyBurnParagon(state);
    }
    case "SACRIFICE_UNICORNS": {
      return applySacrificeUnicorns(state);
    }
    case "SACRIFICE_ALICORNS": {
      return applySacrificeAlicorns(state);
    }
    case "REFINE_TIME_CRYSTALS": {
      return applyRefineTimeCrystals(state);
    }
    case "HUNT": {
      return applyHunt(state, action.amount);
    }
    case "HOLD_FESTIVAL": {
      return applyHoldFestival(state);
    }
    case "PROMOTE_KITTEN": {
      return applyPromoteKitten(state, action.kittenId);
    }
    case "TOGGLE_FAVORITE": {
      return applyToggleFavorite(state, action.kittenId);
    }
    case "UNASSIGN_KITTEN": {
      return applyUnassignKitten(state, action.kittenId);
    }
    case "SET_LEADER": {
      return applySetLeader(state, action.kittenId);
    }
    case "REMOVE_LEADER": {
      return applyRemoveLeader(state);
    }
    case "SET_KITTEN_PORTRAIT": {
      return applySetKittenPortrait(state, action.kittenId, action.path);
    }
    case "UPGRADE_BUILDING_STAGE": {
      return applyUpgradeBuildingStage(state, action.name);
    }
    case "DOWNGRADE_BUILDING_STAGE": {
      return applyDowngradeBuildingStage(state, action.name);
    }
    case "TOGGLE_RESOURCE_VISIBILITY": {
      const hidden = state.hiddenResources;
      const idx = hidden.indexOf(action.name);
      return {
        ...state,
        hiddenResources: idx >= 0
          ? hidden.filter((n) => n !== action.name)
          : [...hidden, action.name],
      };
    }
    case "RENAME_VILLAGE": {
      const clean = sanitizeVillageName(action.name);
      if (clean === null) return state;
      return { ...state, village: { ...state.village, name: clean } };
    }
  }
}
