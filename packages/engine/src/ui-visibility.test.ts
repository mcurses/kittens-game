import { describe, expect, it } from "vitest";
import { deriveUiVisibility, getVisibleMainTabs } from "./ui-visibility.js";

function makeState(overrides: Record<string, unknown> = {}) {
  return {
    version: 1,
    tick: 0,
    resources: {},
    buildings: {},
    village: { kittens: 0, kittenProgress: 0, jobs: {}, deadKittens: 0, happiness: 1 },
    science: { techs: {}, policies: {} },
    workshop: { upgrades: {}, crafts: {} },
    religion: { zu: {}, ru: {}, tu: {}, worship: 0, faithRatio: 0, transcendenceTier: 0 },
    prestige: { perks: {} },
    challenges: { challenges: {} },
    diplomacy: { races: {} },
    time: { cfus: {}, vsus: {}, heat: 0, flux: 0, isAccelerated: false },
    achievements: { achievements: [], badges: [], badgesUnlocked: false },
    ...overrides,
  } as unknown as import("./state.js").SerializedGameState;
}

describe("getVisibleMainTabs", () => {
  it("keeps village and workshop hidden on a fresh save", () => {
    const visible = getVisibleMainTabs(makeState());
    expect(visible).toEqual(["buildings"]);
  });

  it("shows village when huts are built", () => {
    const visible = getVisibleMainTabs(
      makeState({ buildings: { hut: { val: 1, on: 1 } } }),
    );
    expect(visible).toContain("jobs");
  });

  it("shows workshop only when the workshop building is built", () => {
    expect(getVisibleMainTabs(makeState())).not.toContain("workshop");
    expect(
      getVisibleMainTabs(makeState({ buildings: { workshop: { val: 1, on: 1 } } })),
    ).toContain("workshop");
  });

  it("shows religion in atheism when ziggurat exists even with zero faith", () => {
    const visible = getVisibleMainTabs(
      makeState({
        buildings: { ziggurat: { val: 1, on: 1 } },
        challenges: {
          challenges: { atheism: { unlocked: true, active: true, researched: false, on: 0, pending: false } },
        },
      }),
    );
    expect(visible).toContain("religion");
  });

  it("shows stats when math is researched", () => {
    const visible = getVisibleMainTabs(
      makeState({
        science: { techs: { math: { unlocked: true, researched: true } }, policies: {} },
      }),
    );
    expect(visible).toContain("stats");
  });

  it("shows challenges when adjustment bureau is researched", () => {
    const visible = getVisibleMainTabs(
      makeState({
        prestige: { perks: { adjustmentBureau: { unlocked: true, researched: true } } },
      }),
    );
    expect(visible).toContain("challenges");
  });
});

describe("deriveUiVisibility", () => {
  it("adds the free-kitten warning count to the village tab label", () => {
    const visibility = deriveUiVisibility(
      makeState({
        buildings: { hut: { val: 1, on: 1 } },
        village: {
          kittens: 3,
          jobs: { woodcutter: { value: 1 } },
          deadKittens: 0,
        },
      }),
    );

    expect(visibility.tabs.jobs.label).toBe("Small Village (2)");
  });

  it("hides festival controls until drama is researched", () => {
    const hidden = deriveUiVisibility(makeState());
    const shown = deriveUiVisibility(
      makeState({
        science: { techs: { drama: { unlocked: true, researched: true } }, policies: {} },
      }),
    );

    expect(hidden.village.festivalVisible).toBe(false);
    expect(shown.village.festivalVisible).toBe(true);
  });

  it("only exposes building on/off controls for legacy-toggleable buildings", () => {
    const hidden = deriveUiVisibility(
      makeState({
        buildings: {
          field: { val: 2, on: 2, unlocked: true },
          brewery: { val: 1, on: 1, unlocked: true },
          smelter: { val: 1, on: 1, unlocked: true },
          mine: { val: 1, on: 1, unlocked: true },
        },
      }),
    );
    const ecologyShown = deriveUiVisibility(
      makeState({
        buildings: {
          mine: { val: 1, on: 1, unlocked: true },
        },
        science: { techs: { ecology: { unlocked: true, researched: true } }, policies: {} },
      }),
    );

    expect(hidden.buildings.field?.toggleVisible).toBe(false);
    expect(hidden.buildings.brewery?.toggleVisible).toBe(true);
    expect(hidden.buildings.smelter?.toggleVisible).toBe(true);
    expect(hidden.buildings.mine?.toggleVisible).toBe(false);
    expect(ecologyShown.buildings.mine?.toggleVisible).toBe(true);
  });

  it("distinguishes count-adjustable controls from binary toggle controls", () => {
    const visibility = deriveUiVisibility(
      makeState({
        buildings: {
          field: { val: 2, on: 2, unlocked: true },
          smelter: { val: 3, on: 2, unlocked: true },
          calciner: { val: 2, on: 1, unlocked: true },
          mint: { val: 2, on: 2, unlocked: true },
          accelerator: { val: 1, on: 1, unlocked: true },
          steamworks: { val: 1, on: 1, unlocked: true },
        },
      }),
    );

    expect(visibility.buildings.field?.controlMode).toBe("none");
    expect(visibility.buildings.smelter?.controlMode).toBe("count");
    expect(visibility.buildings.calciner?.controlMode).toBe("count");
    expect(visibility.buildings.mint?.controlMode).toBe("count");
    expect(visibility.buildings.accelerator?.controlMode).toBe("count");
    expect(visibility.buildings.steamworks?.controlMode).toBe("binary");
  });

  it("only exposes automation controls for steamworks and factory after their legacy upgrades are researched", () => {
    const locked = deriveUiVisibility(
      makeState({
        buildings: {
          steamworks: { val: 1, on: 1, unlocked: true },
          factory: { val: 1, on: 1, unlocked: true },
          smelter: { val: 1, on: 1, unlocked: true },
        },
      }),
    );
    const unlocked = deriveUiVisibility(
      makeState({
        buildings: {
          steamworks: { val: 1, on: 1, unlocked: true },
          factory: { val: 1, on: 1, unlocked: true },
          smelter: { val: 1, on: 1, unlocked: true },
        },
        workshop: {
          upgrades: {
            factoryAutomation: { unlocked: true, researched: true },
            carbonSequestration: { unlocked: true, researched: true },
          },
          crafts: {},
        },
      }),
    );

    expect(locked.buildings.steamworks?.automationVisible).toBe(false);
    expect(locked.buildings.factory?.automationVisible).toBe(false);
    expect(unlocked.buildings.steamworks?.automationVisible).toBe(true);
    expect(unlocked.buildings.factory?.automationVisible).toBe(true);
    expect(unlocked.buildings.smelter?.automationVisible).toBe(false);
  });

  it("only exposes legacy-default jobs until their unlock techs are researched", () => {
    const early = deriveUiVisibility(makeState());
    const afterAgriculture = deriveUiVisibility(
      makeState({
        science: { techs: { agriculture: { unlocked: true, researched: true } }, policies: {} },
      }),
    );

    expect(early.jobs.woodcutter?.visible).toBe(true);
    expect(early.jobs.farmer?.visible).toBe(false);
    expect(afterAgriculture.jobs.farmer?.visible).toBe(true);
  });

  it("hides priests during atheism even if theology is researched", () => {
    const visibility = deriveUiVisibility(
      makeState({
        science: {
          techs: { theology: { unlocked: true, researched: true } },
          policies: {},
        },
        challenges: {
          challenges: { atheism: { unlocked: true, active: true, researched: false, on: 0, pending: false } },
        },
      }),
    );

    expect(visibility.jobs.priest?.visible).toBe(false);
  });

  it("keeps zero-valued but unlocked resources visible", () => {
    const visibility = deriveUiVisibility(
      makeState({
        resources: {
          catnip: { value: 0, maxValue: 5000, perTick: 0, unlocked: true },
          temporalFlux: { value: 0, maxValue: 0, perTick: 0, unlocked: false },
        },
      }),
    );

    expect(visibility.resources.catnip?.visible).toBe(true);
    expect(visibility.resources.temporalFlux?.visible).toBe(false);
  });

  it("reveals a craftable resource once an input is held and its craft is unlocked", () => {
    const visibility = deriveUiVisibility(
      makeState({
        resources: {
          catnip: { value: 1, maxValue: 5000, perTick: 0, unlocked: true },
          wood: { value: 0, maxValue: 200, perTick: 0, unlocked: false },
          beam: { value: 0, maxValue: 0, perTick: 0, unlocked: false },
        },
        workshop: {
          upgrades: {},
          crafts: {
            wood: { unlocked: true, engineers: 0 },
            beam: { unlocked: true, engineers: 0 },
          },
        },
      }),
    );

    expect(visibility.resources.wood?.visible).toBe(true);
    // beam needs wood > 0 in addition to its craft being unlocked
    expect(visibility.resources.beam?.visible).toBe(false);
  });

  it("hides a craftable resource when its craft is still locked", () => {
    const visibility = deriveUiVisibility(
      makeState({
        resources: {
          catnip: { value: 999, maxValue: 5000, perTick: 0, unlocked: true },
          wood: { value: 0, maxValue: 200, perTick: 0, unlocked: false },
        },
        workshop: {
          upgrades: {},
          crafts: { wood: { unlocked: false, engineers: 0 } },
        },
      }),
    );

    expect(visibility.resources.wood?.visible).toBe(false);
  });

  it("only shows the hunt action after archery and outside pacifism", () => {
    const locked = deriveUiVisibility(makeState());
    const unlocked = deriveUiVisibility(
      makeState({
        science: { techs: { archery: { unlocked: true, researched: true } }, policies: {} },
      }),
    );
    const blocked = deriveUiVisibility(
      makeState({
        science: { techs: { archery: { unlocked: true, researched: true } }, policies: {} },
        challenges: {
          challenges: { pacifism: { unlocked: true, active: true, researched: false, on: 0, pending: false } },
        },
      }),
    );

    expect(locked.actions.huntVisible).toBe(false);
    expect(unlocked.actions.huntVisible).toBe(true);
    expect(blocked.actions.huntVisible).toBe(false);
  });

  it("shows shatter only after tachyon moderator is researched", () => {
    const locked = deriveUiVisibility(makeState({ time: { heat: 100, flux: 0, cfus: {}, vsus: {}, isAccelerated: false } }));
    const unlocked = deriveUiVisibility(
      makeState({
        time: { heat: 100, flux: 0, cfus: {}, vsus: {}, isAccelerated: false },
        workshop: { upgrades: { tachyonModerator: { unlocked: true, researched: true } }, crafts: {} },
      }),
    );

    expect(locked.time.shatterVisible).toBe(false);
    expect(unlocked.time.shatterVisible).toBe(true);
  });
});
