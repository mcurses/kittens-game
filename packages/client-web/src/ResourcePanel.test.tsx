import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { InspectorProvider } from "./InspectorContext.js";
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
