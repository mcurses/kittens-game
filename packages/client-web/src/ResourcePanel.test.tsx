import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type BuildingEntity, InspectorProvider, useInspector } from "./InspectorContext.js";
import { InspectorPanel } from "./InspectorPanel.js";
import { ResourcePanel } from "./ResourcePanel.js";

// Minimal mock state with resources
function makeState(
  resources: Record<
    string,
    { value: number; maxValue?: number; perTick?: number; unlocked?: boolean }
  >,
  effectCache: Record<string, number> = {},
) {
  return {
    version: 1,
    tick: 0,
    resources,
    effectCache,
  } as unknown as import("@kittens/api-spec").GameStateResponse;
}

// Wrap with InspectorProvider for hover tests
function WithInspector({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <InspectorProvider>
      {children}
      <InspectorPanel />
    </InspectorProvider>
  );
}

// Helper: component that simulates an action panel item being hovered
// (i.e., sets a building entity with prices in the inspector context)
function HoverAction({
  prices,
  resourceHover = false,
}: {
  prices: Array<{ name: string; val: number }>;
  resourceHover?: boolean;
}): React.ReactElement {
  const { setInspected, clearInspected } = useInspector();

  React.useEffect(() => {
    if (resourceHover) {
      // Simulate resource hover — ResourceEntity has no prices
      setInspected({
        kind: "resource",
        name: "catnip",
        value: 10,
        breakdown: { base: 1, ratio: 0, direct: 0, consumption: 0 },
      });
    } else {
      const entity: BuildingEntity = {
        kind: "building",
        name: "TestBuilding",
        val: 1,
        effects: {},
        prices,
        resources: {},
      };
      setInspected(entity);
    }
    return clearInspected;
  }, []);

  return <div data-testid="hover-action-trigger" />;
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
});

describe("ResourcePanel", () => {
  it("shows loading placeholder when state is null", () => {
    render(<WithInspector><ResourcePanel state={null} /></WithInspector>);
    expect(screen.getByTestId("resource-panel-loading")).toBeTruthy();
    expect(screen.getByText("Loading resources...")).toBeTruthy();
  });

  it("shows loading placeholder when state is undefined", () => {
    render(<WithInspector><ResourcePanel state={undefined} /></WithInspector>);
    expect(screen.getByTestId("resource-panel-loading")).toBeTruthy();
  });

  it("renders resource name and value", () => {
    const state = makeState({ catnip: { value: 42.5, maxValue: 5000 } });
    render(<WithInspector><ResourcePanel state={state} /></WithInspector>);
    expect(screen.getByTestId("resource-catnip")).toBeTruthy();
    expect(screen.getByText(/catnip/)).toBeTruthy();
    expect(screen.getByText(/42\.50/)).toBeTruthy();
  });

  it("shows max value when present", () => {
    const state = makeState({ catnip: { value: 10, maxValue: 5000 } });
    render(<WithInspector><ResourcePanel state={state} /></WithInspector>);
    expect(screen.getByText(/5000/)).toBeTruthy();
  });

  it("shows positive perTick rate", () => {
    const state = makeState({ catnip: { value: 10, perTick: 1.234 } });
    render(<WithInspector><ResourcePanel state={state} /></WithInspector>);
    expect(screen.getByText(/\+1\.234\/tick/)).toBeTruthy();
  });

  it("shows negative perTick rate", () => {
    const state = makeState({ catnip: { value: 10, perTick: -0.5 } });
    render(<WithInspector><ResourcePanel state={state} /></WithInspector>);
    expect(screen.getByText(/-0\.500\/tick/)).toBeTruthy();
  });

  it("shows inspector panel with net income breakdown on hover", async () => {
    const state = makeState(
      { catnip: { value: 10, maxValue: 100, perTick: 1.5 } },
      {
        catnipPerTickBase: 1,
        catnipRatio: 0.5,
      },
    );
    const userEvent = (await import("@testing-library/user-event")).default;
    render(<WithInspector><ResourcePanel state={state} /></WithInspector>);

    await userEvent.hover(screen.getByTestId("resource-catnip"));

    expect(screen.getByTestId("inspector-panel")).toBeTruthy();
    expect(screen.getByText(/Base/)).toBeTruthy();
    expect(screen.getByText(/Ratio bonus/)).toBeTruthy();
    expect(screen.getByText(/Net income/)).toBeTruthy();
    expect(screen.getByText(/Time to cap/)).toBeTruthy();
  });

  it("shows time to zero for negative net income in inspector", async () => {
    const state = makeState(
      { catnip: { value: 10, perTick: -0.5 } },
      {
        catnipPerTickCon: -0.5,
      },
    );
    const userEvent = (await import("@testing-library/user-event")).default;
    render(<WithInspector><ResourcePanel state={state} /></WithInspector>);

    await userEvent.hover(screen.getByTestId("resource-catnip"));

    expect(screen.getByText(/Time to zero/)).toBeTruthy();
  });

  it("clears inspector on mouse leave", async () => {
    const state = makeState({ catnip: { value: 10, perTick: 1 } }, { catnipPerTickBase: 1 });
    const userEvent = (await import("@testing-library/user-event")).default;
    render(<WithInspector><ResourcePanel state={state} /></WithInspector>);

    await userEvent.hover(screen.getByTestId("resource-catnip"));
    expect(screen.queryByText(/Net income/)).toBeTruthy();

    await userEvent.unhover(screen.getByTestId("resource-catnip"));
    expect(screen.getByText("Hover an item to inspect it")).toBeTruthy();
  });

  it("shows inspector on keyboard focus and clears on blur", () => {
    const state = makeState(
      { catnip: { value: 10, perTick: 1 } },
      { catnipPerTickBase: 1 },
    );
    render(<WithInspector><ResourcePanel state={state} /></WithInspector>);

    fireEvent.focus(screen.getByTestId("resource-catnip"));
    expect(screen.queryByText(/Hover an item to inspect it/)).toBeNull();

    fireEvent.blur(screen.getByTestId("resource-catnip"));
    expect(screen.getByText("Hover an item to inspect it")).toBeTruthy();
  });

  it("shows per-second gain when switched to /sec mode", async () => {
    const state = makeState({ catnip: { value: 10, perTick: 1.234 } });
    const userEvent = (await import("@testing-library/user-event")).default;
    render(<WithInspector><ResourcePanel state={state} /></WithInspector>);
    await userEvent.click(screen.getByRole("button", { name: /show per second/i }));
    expect(screen.getByText(/\+6\.170\/sec/)).toBeTruthy();
  });

  it("shows negative per-second gain when switched to /sec mode", async () => {
    const state = makeState({ catnip: { value: 10, perTick: -0.5 } });
    const userEvent = (await import("@testing-library/user-event")).default;
    render(<WithInspector><ResourcePanel state={state} /></WithInspector>);
    await userEvent.click(screen.getByRole("button", { name: /show per second/i }));
    expect(screen.getByText(/-2\.500\/sec/)).toBeTruthy();
  });

  it("can switch back to /tick mode after enabling /sec mode", async () => {
    const state = makeState({ catnip: { value: 10, perTick: 1 } });
    const userEvent = (await import("@testing-library/user-event")).default;
    render(<WithInspector><ResourcePanel state={state} /></WithInspector>);
    await userEvent.click(screen.getByRole("button", { name: /show per second/i }));
    expect(screen.getByText(/\+5\.000\/sec/)).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: /show per tick/i }));
    expect(screen.getByText(/\+1\.000\/tick/)).toBeTruthy();
  });

  it("restores the saved rate unit on remount", async () => {
    const state = makeState({ catnip: { value: 10, perTick: 1 } });
    const userEvent = (await import("@testing-library/user-event")).default;
    const { unmount } = render(<WithInspector><ResourcePanel state={state} /></WithInspector>);
    await userEvent.click(screen.getByRole("button", { name: /show per second/i }));
    expect(window.localStorage.getItem("kittens.ui.resourceRateUnit")).toBe('"perSecond"');
    unmount();

    render(<WithInspector><ResourcePanel state={state} /></WithInspector>);
    expect(screen.getByRole("button", { name: /show per tick/i })).toBeTruthy();
    expect(screen.getByText(/\+5\.000\/sec/)).toBeTruthy();
  });

  it("does not show rate when perTick is 0", () => {
    const state = makeState({ catnip: { value: 10, perTick: 0 } });
    render(<WithInspector><ResourcePanel state={state} /></WithInspector>);
    expect(screen.queryByText(/\/tick/)).toBeNull();
  });

  it("shows no resources message when resources object is empty", () => {
    const state = makeState({});
    render(<WithInspector><ResourcePanel state={state} /></WithInspector>);
    expect(screen.getByText("No resources yet.")).toBeTruthy();
  });

  it("renders multiple resources", () => {
    const state = makeState({
      catnip: { value: 10, perTick: 1 },
      wood: { value: 50, perTick: 0.5 },
    });
    render(<WithInspector><ResourcePanel state={state} /></WithInspector>);
    expect(screen.getByTestId("resource-catnip")).toBeTruthy();
    expect(screen.getByTestId("resource-wood")).toBeTruthy();
  });

  it("keeps zero-valued unlocked resources visible", () => {
    const state = makeState({
      catnip: { value: 0, perTick: 0.5, unlocked: true },
      wood: { value: 50, unlocked: true },
    });
    render(<WithInspector><ResourcePanel state={state} /></WithInspector>);
    expect(screen.getByTestId("resource-catnip")).toBeTruthy();
    expect(screen.getByTestId("resource-wood")).toBeTruthy();
  });

  it("still shows catnip when everything else is locked at zero", () => {
    const state = makeState({
      catnip: { value: 0, unlocked: false },
      wood: { value: 0, unlocked: false },
    });
    render(<WithInspector><ResourcePanel state={state} /></WithInspector>);
    expect(screen.getByTestId("resource-catnip")).toBeTruthy();
    expect(screen.queryByTestId("resource-wood")).toBeNull();
  });

  it("hides locked hidden resources even when they have placeholder rows", () => {
    const state = makeState({
      catnip: { value: 100, unlocked: true },
      temporalFlux: { value: 0, unlocked: false },
      minerals: { value: 0.01, unlocked: true },
    });
    render(<WithInspector><ResourcePanel state={state} /></WithInspector>);
    expect(screen.getByTestId("resource-catnip")).toBeTruthy();
    expect(screen.queryByTestId("resource-temporalFlux")).toBeNull();
    expect(screen.getByTestId("resource-minerals")).toBeTruthy();
  });

  it("does not render a kittens row even if serialized data still contains one", () => {
    const state = makeState({
      catnip: { value: 100, unlocked: true },
      kittens: { value: 6217.28, maxValue: 0, perTick: 0.01, unlocked: true },
    });
    render(<WithInspector><ResourcePanel state={state} /></WithInspector>);
    expect(screen.getByTestId("resource-catnip")).toBeTruthy();
    expect(screen.queryByTestId("resource-kittens")).toBeNull();
    expect(screen.queryByText(/^kittens$/i)).toBeNull();
  });
});

// ── Epic 41: Resource Cost Highlighting ─────────────────────────────────────

describe("Story 41-01: Highlight required resources on action hover", () => {
  it("highlights required resources and dims others when an action is hovered", async () => {
    // Use minerals (base resource, not craftable) as the required resource
    // so no secondary expansion occurs
    const state = makeState({
      minerals: { value: 10, maxValue: 500 },
      iron: { value: 5, maxValue: 500 },
      science: { value: 100, maxValue: 99_999 },
    });
    render(
      <WithInspector>
        <HoverAction prices={[{ name: "minerals", val: 100 }]} />
        <ResourcePanel state={state} />
      </WithInspector>,
    );

    const mineralsItem = screen.getByTestId("resource-minerals");
    const ironItem = screen.getByTestId("resource-iron");
    const scienceItem = screen.getByTestId("resource-science");

    expect(mineralsItem.className).toContain("resource-item--highlighted");
    expect(ironItem.className).toContain("resource-item--dimmed");
    expect(scienceItem.className).toContain("resource-item--dimmed");
  });

  it("applies no highlighting or dimming when nothing is inspected", () => {
    const state = makeState({
      wood: { value: 10, maxValue: 500 },
      minerals: { value: 5, maxValue: 500 },
    });
    render(
      <WithInspector>
        <ResourcePanel state={state} />
      </WithInspector>,
    );

    const woodItem = screen.getByTestId("resource-wood");
    const mineralsItem = screen.getByTestId("resource-minerals");

    expect(woodItem.className).not.toContain("resource-item--highlighted");
    expect(woodItem.className).not.toContain("resource-item--dimmed");
    expect(mineralsItem.className).not.toContain("resource-item--dimmed");
  });

  it("does not dim resources when a resource entity (no prices) is hovered", async () => {
    const state = makeState({
      wood: { value: 10, maxValue: 500 },
      minerals: { value: 5, maxValue: 500 },
    });
    render(
      <WithInspector>
        <HoverAction prices={[]} resourceHover={true} />
        <ResourcePanel state={state} />
      </WithInspector>,
    );

    const woodItem = screen.getByTestId("resource-wood");
    const mineralsItem = screen.getByTestId("resource-minerals");

    expect(woodItem.className).not.toContain("resource-item--highlighted");
    expect(woodItem.className).not.toContain("resource-item--dimmed");
    expect(mineralsItem.className).not.toContain("resource-item--dimmed");
  });

  it("highlights multiple required resources simultaneously", () => {
    // Use base (non-craftable) resources: minerals + iron, so no secondary expansion
    const state = makeState({
      minerals: { value: 10, maxValue: 500 },
      iron: { value: 5, maxValue: 500, unlocked: true },
      science: { value: 100, maxValue: 99_999 },
    });
    render(
      <WithInspector>
        <HoverAction prices={[{ name: "minerals", val: 50 }, { name: "iron", val: 10 }]} />
        <ResourcePanel state={state} />
      </WithInspector>,
    );

    expect(screen.getByTestId("resource-minerals").className).toContain("resource-item--highlighted");
    expect(screen.getByTestId("resource-iron").className).toContain("resource-item--highlighted");
    expect(screen.getByTestId("resource-science").className).toContain("resource-item--dimmed");
  });
});

describe("Story 41-02: Show cost target marker on resource progress bar", () => {
  it("renders a target marker when resource is highlighted", () => {
    const state = makeState({
      wood: { value: 50, maxValue: 500 },
    });
    render(
      <WithInspector>
        <HoverAction prices={[{ name: "wood", val: 200 }]} />
        <ResourcePanel state={state} />
      </WithInspector>,
    );

    const marker = screen
      .getByTestId("resource-wood")
      .querySelector(".resource-bar-target");
    expect(marker).toBeTruthy();
  });

  it("gives marker --unmet class when current < needed", () => {
    const state = makeState({
      wood: { value: 50, maxValue: 500 },
    });
    render(
      <WithInspector>
        <HoverAction prices={[{ name: "wood", val: 200 }]} />
        <ResourcePanel state={state} />
      </WithInspector>,
    );

    const marker = screen.getByTestId("resource-wood").querySelector(".resource-bar-target");
    expect(marker?.className).toContain("resource-bar-target--unmet");
  });

  it("gives marker --met class when current >= needed", () => {
    const state = makeState({
      wood: { value: 300, maxValue: 500 },
    });
    render(
      <WithInspector>
        <HoverAction prices={[{ name: "wood", val: 200 }]} />
        <ResourcePanel state={state} />
      </WithInspector>,
    );

    const marker = screen.getByTestId("resource-wood").querySelector(".resource-bar-target");
    expect(marker?.className).toContain("resource-bar-target--met");
  });

  it("gives marker --limited class and pins at 100% when needed > maxValue", () => {
    const state = makeState({
      wood: { value: 50, maxValue: 100 },
    });
    render(
      <WithInspector>
        <HoverAction prices={[{ name: "wood", val: 500 }]} />
        <ResourcePanel state={state} />
      </WithInspector>,
    );

    const marker = screen.getByTestId("resource-wood").querySelector(".resource-bar-target") as HTMLElement;
    expect(marker?.className).toContain("resource-bar-target--limited");
    expect(marker?.style.left).toBe("100%");
  });

  it("does not render a target marker for dimmed (non-required) resources", () => {
    const state = makeState({
      wood: { value: 50, maxValue: 500 },
      minerals: { value: 5, maxValue: 500 },
    });
    render(
      <WithInspector>
        <HoverAction prices={[{ name: "wood", val: 200 }]} />
        <ResourcePanel state={state} />
      </WithInspector>,
    );

    const marker = screen.getByTestId("resource-minerals").querySelector(".resource-bar-target");
    expect(marker).toBeNull();
  });

  it("positions marker at correct percentage (needed / maxValue)", () => {
    const state = makeState({
      wood: { value: 50, maxValue: 400 },
    });
    render(
      <WithInspector>
        <HoverAction prices={[{ name: "wood", val: 200 }]} />
        <ResourcePanel state={state} />
      </WithInspector>,
    );

    const marker = screen.getByTestId("resource-wood").querySelector(".resource-bar-target") as HTMLElement;
    // 200 / 400 = 50%
    expect(marker?.style.left).toBe("50%");
  });
});

describe("Story 41-03: Live ETA to reach required amount", () => {
  it("shows ETA label when current < needed and perTick > 0", () => {
    // wood: 50/500, need 200, perTick = 1/tick * 5 ticks/s = 5/s
    // seconds to accumulate: (200 - 50) / 5 = 30s
    const state = makeState({
      wood: { value: 50, maxValue: 500, perTick: 1 },
    });
    render(
      <WithInspector>
        <HoverAction prices={[{ name: "wood", val: 200 }]} />
        <ResourcePanel state={state} />
      </WithInspector>,
    );

    const etaLabel = screen.getByTestId("resource-wood").querySelector(".resource-item-eta");
    expect(etaLabel).toBeTruthy();
    // 30s = "in 30s"
    expect(etaLabel?.textContent).toMatch(/in 30s|in 0m 30s/);
  });

  it("shows — when perTick is 0", () => {
    const state = makeState({
      wood: { value: 50, maxValue: 500, perTick: 0 },
    });
    render(
      <WithInspector>
        <HoverAction prices={[{ name: "wood", val: 200 }]} />
        <ResourcePanel state={state} />
      </WithInspector>,
    );

    const etaLabel = screen.getByTestId("resource-wood").querySelector(".resource-item-eta");
    expect(etaLabel?.textContent).toContain("—");
  });

  it("shows — when perTick is negative", () => {
    const state = makeState({
      wood: { value: 50, maxValue: 500, perTick: -1 },
    });
    render(
      <WithInspector>
        <HoverAction prices={[{ name: "wood", val: 200 }]} />
        <ResourcePanel state={state} />
      </WithInspector>,
    );

    const etaLabel = screen.getByTestId("resource-wood").querySelector(".resource-item-eta");
    expect(etaLabel?.textContent).toContain("—");
  });

  it("hides ETA label when resource requirement is already met", () => {
    const state = makeState({
      wood: { value: 300, maxValue: 500, perTick: 1 },
    });
    render(
      <WithInspector>
        <HoverAction prices={[{ name: "wood", val: 200 }]} />
        <ResourcePanel state={state} />
      </WithInspector>,
    );

    const etaLabel = screen.getByTestId("resource-wood").querySelector(".resource-item-eta");
    expect(etaLabel).toBeNull();
  });

  it("hides ETA label for storage-limited case (warning marker only)", () => {
    const state = makeState({
      wood: { value: 50, maxValue: 100, perTick: 1 },
    });
    render(
      <WithInspector>
        <HoverAction prices={[{ name: "wood", val: 500 }]} />
        <ResourcePanel state={state} />
      </WithInspector>,
    );

    const etaLabel = screen.getByTestId("resource-wood").querySelector(".resource-item-eta");
    expect(etaLabel).toBeNull();
  });

  it("shows no ETA label on non-highlighted (dimmed) resources", () => {
    const state = makeState({
      wood: { value: 50, maxValue: 500, perTick: 1 },
      minerals: { value: 5, maxValue: 500, perTick: 1 },
    });
    render(
      <WithInspector>
        <HoverAction prices={[{ name: "wood", val: 200 }]} />
        <ResourcePanel state={state} />
      </WithInspector>,
    );

    const etaLabel = screen.getByTestId("resource-minerals").querySelector(".resource-item-eta");
    expect(etaLabel).toBeNull();
  });

  it("shows live countdown that updates every second", async () => {
    vi.useFakeTimers();
    const TICKS_PER_SECOND = 5;
    // wood: 50, need 200, perTick=2/tick → 10/s → (200-50)/10 = 15s ETA
    const state = makeState({
      wood: { value: 50, maxValue: 500, perTick: 2 },
    });
    render(
      <WithInspector>
        <HoverAction prices={[{ name: "wood", val: 200 }]} />
        <ResourcePanel state={state} />
      </WithInspector>,
    );

    const getEta = () =>
      screen.getByTestId("resource-wood").querySelector(".resource-item-eta")?.textContent ?? "";

    // Initial: 15s
    expect(getEta()).toMatch(/15s/);

    // Advance 5 seconds
    await act(async () => { vi.advanceTimersByTime(5000); });
    expect(getEta()).toMatch(/10s/);

    vi.useRealTimers();
    (TICKS_PER_SECOND); // used in production, silence unused warning
  });
});

describe("Story 41-05: No visual regression on existing resource panel behavior", () => {
  it("renders all resources at full opacity with no markers or ETA when nothing is hovered", () => {
    const state = makeState({
      catnip: { value: 10, maxValue: 5000, perTick: 1 },
      wood: { value: 100, maxValue: 1000 },
    });
    render(
      <WithInspector>
        <ResourcePanel state={state} />
      </WithInspector>,
    );

    const catnipItem = screen.getByTestId("resource-catnip");
    expect(catnipItem.className).not.toContain("highlighted");
    expect(catnipItem.className).not.toContain("dimmed");
    expect(catnipItem.querySelector(".resource-bar-target")).toBeNull();
    expect(catnipItem.querySelector(".resource-item-eta")).toBeNull();

    const woodItem = screen.getByTestId("resource-wood");
    expect(woodItem.className).not.toContain("highlighted");
    expect(woodItem.className).not.toContain("dimmed");
  });
});

describe("Story 41-06: Secondary ingredient highlighting", () => {
  it("shows secondary annotation for craft ingredient of a required resource", () => {
    // Require compedium (craftable: science + manuscript) but have none
    // manuscript should appear highlighted at secondary depth with annotation
    const state = makeState({
      compedium: { value: 0, maxValue: 100, unlocked: true },
      manuscript: { value: 0, maxValue: 100, unlocked: true },
      science: { value: 0, maxValue: 999_999, unlocked: true },
    });
    render(
      <WithInspector>
        <HoverAction prices={[{ name: "compedium", val: 3 }]} />
        <ResourcePanel state={state} />
      </WithInspector>,
    );

    const manuscriptItem = screen.getByTestId("resource-manuscript");
    expect(manuscriptItem.className).toContain("resource-item--highlighted-secondary");

    const annotation = manuscriptItem.querySelector(".resource-item-annotation");
    expect(annotation).toBeTruthy();
    expect(annotation?.textContent).toContain("compedium");
  });

  it("secondary rows show softer highlight (not primary) class", () => {
    const state = makeState({
      compedium: { value: 0, maxValue: 100, unlocked: true },
      manuscript: { value: 0, maxValue: 100, unlocked: true },
      science: { value: 9_999_999, maxValue: 9_999_999, unlocked: true },
    });
    render(
      <WithInspector>
        <HoverAction prices={[{ name: "compedium", val: 1 }]} />
        <ResourcePanel state={state} />
      </WithInspector>,
    );

    const manuscriptItem = screen.getByTestId("resource-manuscript");
    expect(manuscriptItem.className).toContain("resource-item--highlighted-secondary");
    expect(manuscriptItem.className).not.toContain("resource-item--highlighted ");
    expect(manuscriptItem.className).not.toMatch(/resource-item--highlighted(?!-)/);
  });

  it("does not expand ingredients when the parent resource requirement is already met", () => {
    // We need 1 compedium, we already have 1 → no secondary highlighting
    const state = makeState({
      compedium: { value: 1, maxValue: 100, unlocked: true },
      manuscript: { value: 0, maxValue: 100, unlocked: true },
    });
    render(
      <WithInspector>
        <HoverAction prices={[{ name: "compedium", val: 1 }]} />
        <ResourcePanel state={state} />
      </WithInspector>,
    );

    // compedium is highlighted (depth 1, met)
    const compediumItem = screen.getByTestId("resource-compedium");
    expect(compediumItem.className).toContain("resource-item--highlighted");
    // manuscript should be dimmed (not a secondary highlight)
    const manuscriptItem = screen.getByTestId("resource-manuscript");
    expect(manuscriptItem.className).not.toContain("resource-item--highlighted");
    expect(manuscriptItem.className).toContain("resource-item--dimmed");
  });
});

// ── Epic 32 Story 32-08: Resource maxValue display ──────────────────────────

describe("Story 32-08: Resource maxValue and demand display", () => {
  it("does not show /0 when maxValue is 0 (uncapped resource)", () => {
    const state = makeState({ catnip: { value: 10, maxValue: 0 } });
    render(<WithInspector><ResourcePanel state={state} /></WithInspector>);
    expect(screen.queryByText(/\/0/)).toBeNull();
  });

  it("shows cap when maxValue is positive", () => {
    const state = makeState({ catnip: { value: 10, maxValue: 5000 } });
    render(<WithInspector><ResourcePanel state={state} /></WithInspector>);
    expect(screen.getByText(/5000/)).toBeTruthy();
  });

  it("shows catnip demand reduction when catnipDemandRatio < 0", () => {
    const state = makeState(
      { catnip: { value: 10 } },
      { catnipDemandRatio: -0.15 },
    );
    render(<WithInspector><ResourcePanel state={state} /></WithInspector>);
    // Should show some demand reduction indicator on the catnip row
    expect(screen.getByTestId("resource-catnip").textContent).toMatch(/-15%|-0\.15|demand/i);
  });
});
