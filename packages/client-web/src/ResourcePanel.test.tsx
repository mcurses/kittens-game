import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ResourcePanel } from "./ResourcePanel.js";

// Minimal mock state with resources
function makeState(
  resources: Record<
    string,
    { value: number; maxValue?: number; perTick?: number }
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

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
});

describe("ResourcePanel", () => {
  it("shows loading placeholder when state is null", () => {
    render(<ResourcePanel state={null} />);
    expect(screen.getByTestId("resource-panel-loading")).toBeTruthy();
    expect(screen.getByText("Loading resources...")).toBeTruthy();
  });

  it("shows loading placeholder when state is undefined", () => {
    render(<ResourcePanel state={undefined} />);
    expect(screen.getByTestId("resource-panel-loading")).toBeTruthy();
  });

  it("renders resource name and value", () => {
    const state = makeState({ catnip: { value: 42.5, maxValue: 5000 } });
    render(<ResourcePanel state={state} />);
    expect(screen.getByTestId("resource-catnip")).toBeTruthy();
    expect(screen.getByText(/catnip/)).toBeTruthy();
    expect(screen.getByText(/42\.50/)).toBeTruthy();
  });

  it("shows max value when present", () => {
    const state = makeState({ catnip: { value: 10, maxValue: 5000 } });
    render(<ResourcePanel state={state} />);
    expect(screen.getByText(/5000/)).toBeTruthy();
  });

  it("shows positive perTick rate", () => {
    const state = makeState({ catnip: { value: 10, perTick: 1.234 } });
    render(<ResourcePanel state={state} />);
    expect(screen.getByText(/\+1\.234\/tick/)).toBeTruthy();
  });

  it("shows negative perTick rate", () => {
    const state = makeState({ catnip: { value: 10, perTick: -0.5 } });
    render(<ResourcePanel state={state} />);
    expect(screen.getByText(/-0\.500\/tick/)).toBeTruthy();
  });

  it("shows a hover tooltip with net income breakdown", async () => {
    const state = makeState(
      { catnip: { value: 10, maxValue: 100, perTick: 1.5 } },
      {
        catnipPerTickBase: 1,
        catnipRatio: 0.5,
      },
    );
    const userEvent = (await import("@testing-library/user-event")).default;
    render(<ResourcePanel state={state} />);

    await userEvent.hover(screen.getByTestId("resource-catnip"));

    expect(screen.getByTestId("resource-tooltip-catnip")).toBeTruthy();
    expect(screen.getByText(/Base: \+1\.000\/tick/)).toBeTruthy();
    expect(screen.getByText(/Ratio bonus: \+50\.0% \(\+0\.500\/tick\)/)).toBeTruthy();
    expect(screen.getByText(/Net income: \+1\.500\/tick/)).toBeTruthy();
    expect(screen.getByText(/Time to cap: 12s/)).toBeTruthy();
  });

  it("shows time to zero for negative net income", async () => {
    const state = makeState(
      { catnip: { value: 10, perTick: -0.5 } },
      {
        catnipPerTickCon: -0.5,
      },
    );
    const userEvent = (await import("@testing-library/user-event")).default;
    render(<ResourcePanel state={state} />);

    await userEvent.hover(screen.getByTestId("resource-catnip"));

    expect(screen.getByText(/Consumption: -0\.500\/tick/)).toBeTruthy();
    expect(screen.getByText(/Net income: -0\.500\/tick/)).toBeTruthy();
    expect(screen.getByText(/Time to zero: 4s/)).toBeTruthy();
  });

  it("shows tooltip values in per-second mode", async () => {
    const state = makeState(
      { catnip: { value: 10, maxValue: 100, perTick: 1.5 } },
      {
        catnipPerTickBase: 1,
        catnipRatio: 0.5,
      },
    );
    const userEvent = (await import("@testing-library/user-event")).default;
    render(<ResourcePanel state={state} />);

    await userEvent.click(screen.getByRole("button", { name: /show per second/i }));
    await userEvent.hover(screen.getByTestId("resource-catnip"));

    expect(screen.getByText(/Base: \+5\.000\/sec/)).toBeTruthy();
    expect(screen.getByText(/Ratio bonus: \+50\.0% \(\+2\.500\/sec\)/)).toBeTruthy();
    expect(screen.getByText(/Net income: \+7\.500\/sec/)).toBeTruthy();
  });

  it("shows and hides the tooltip on keyboard focus", async () => {
    const state = makeState(
      { catnip: { value: 10, perTick: 1 } },
      {
        catnipPerTickBase: 1,
      },
    );
    render(<ResourcePanel state={state} />);

    fireEvent.focus(screen.getByTestId("resource-catnip"));
    expect(screen.getByTestId("resource-tooltip-catnip")).toBeTruthy();

    fireEvent.blur(screen.getByTestId("resource-catnip"));
    expect(screen.queryByTestId("resource-tooltip-catnip")).toBeNull();
  });

  it("shows per-second gain when switched to /sec mode", async () => {
    const state = makeState({ catnip: { value: 10, perTick: 1.234 } });
    const userEvent = (await import("@testing-library/user-event")).default;
    render(<ResourcePanel state={state} />);
    await userEvent.click(screen.getByRole("button", { name: /show per second/i }));
    expect(screen.getByText(/\+6\.170\/sec/)).toBeTruthy();
  });

  it("shows negative per-second gain when switched to /sec mode", async () => {
    const state = makeState({ catnip: { value: 10, perTick: -0.5 } });
    const userEvent = (await import("@testing-library/user-event")).default;
    render(<ResourcePanel state={state} />);
    await userEvent.click(screen.getByRole("button", { name: /show per second/i }));
    expect(screen.getByText(/-2\.500\/sec/)).toBeTruthy();
  });

  it("can switch back to /tick mode after enabling /sec mode", async () => {
    const state = makeState({ catnip: { value: 10, perTick: 1 } });
    const userEvent = (await import("@testing-library/user-event")).default;
    render(<ResourcePanel state={state} />);
    await userEvent.click(screen.getByRole("button", { name: /show per second/i }));
    expect(screen.getByText(/\+5\.000\/sec/)).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: /show per tick/i }));
    expect(screen.getByText(/\+1\.000\/tick/)).toBeTruthy();
  });

  it("restores the saved rate unit on remount", async () => {
    const state = makeState({ catnip: { value: 10, perTick: 1 } });
    const userEvent = (await import("@testing-library/user-event")).default;
    const { unmount } = render(<ResourcePanel state={state} />);
    await userEvent.click(screen.getByRole("button", { name: /show per second/i }));
    expect(window.localStorage.getItem("kittens.ui.resourceRateUnit")).toBe('"perSecond"');
    unmount();

    render(<ResourcePanel state={state} />);
    expect(screen.getByRole("button", { name: /show per tick/i })).toBeTruthy();
    expect(screen.getByText(/\+5\.000\/sec/)).toBeTruthy();
  });

  it("does not show rate when perTick is 0", () => {
    const state = makeState({ catnip: { value: 10, perTick: 0 } });
    render(<ResourcePanel state={state} />);
    expect(screen.queryByText(/\/tick/)).toBeNull();
  });

  it("shows no resources message when resources object is empty", () => {
    const state = makeState({});
    render(<ResourcePanel state={state} />);
    expect(screen.getByText("No resources yet.")).toBeTruthy();
  });

  it("renders multiple resources", () => {
    const state = makeState({
      catnip: { value: 10, perTick: 1 },
      wood: { value: 50, perTick: 0.5 },
    });
    render(<ResourcePanel state={state} />);
    expect(screen.getByTestId("resource-catnip")).toBeTruthy();
    expect(screen.getByTestId("resource-wood")).toBeTruthy();
  });

  // Story 20-1: Resource filtering
  it("hides resources with value 0", () => {
    const state = makeState({
      catnip: { value: 0, perTick: 0.5 },
      wood: { value: 50 },
    });
    render(<ResourcePanel state={state} />);
    expect(screen.queryByTestId("resource-catnip")).toBeNull();
    expect(screen.getByTestId("resource-wood")).toBeTruthy();
  });

  it("shows no resources message when all resources have value 0", () => {
    const state = makeState({
      catnip: { value: 0 },
      wood: { value: 0 },
    });
    render(<ResourcePanel state={state} />);
    expect(screen.getByText("No resources yet.")).toBeTruthy();
    expect(screen.queryByTestId("resource-catnip")).toBeNull();
    expect(screen.queryByTestId("resource-wood")).toBeNull();
  });

  it("shows resources with positive value and hides those with 0", () => {
    const state = makeState({
      catnip: { value: 100 },
      wood: { value: 0 },
      minerals: { value: 0.01 },
    });
    render(<ResourcePanel state={state} />);
    expect(screen.getByTestId("resource-catnip")).toBeTruthy();
    expect(screen.queryByTestId("resource-wood")).toBeNull();
    expect(screen.getByTestId("resource-minerals")).toBeTruthy();
  });
});
