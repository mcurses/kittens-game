// InspectorPanel tests
import { act, cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { InspectorProvider, useInspector } from "./InspectorContext.js";
import { InspectorPanel } from "./InspectorPanel.js";

afterEach(cleanup);

function TestWrapper({ children }: { children: React.ReactNode }): React.ReactElement {
  return <InspectorProvider>{children}</InspectorProvider>;
}

// Helper to set a specific entity via context
function SetEntityButton({ kind }: { kind: string }): React.ReactElement {
  const { setInspected } = useInspector();
  return (
    <button
      type="button"
      data-testid={`set-${kind}`}
      onClick={() => {
        if (kind === "building") {
          setInspected({
            kind: "building",
            name: "field",
            description: "Grows catnip each tick.",
            val: 3,
            effects: { catnipPerTickBase: 0.125 },
            prices: [{ name: "catnip", val: 10 }],
            resources: {},
          });
        } else if (kind === "resource") {
          setInspected({
            kind: "resource",
            name: "catnip",
            value: 50,
            maxValue: 5000,
            perTick: 0.5,
            breakdown: { base: 0.5, ratio: 0.3, direct: 0.1, consumption: -0.1 },
          });
        } else if (kind === "upgrade") {
          setInspected({
            kind: "upgrade",
            name: "mineralHoes",
            description: "Mineral-tipped hoes boost farmer productivity.",
            researched: false,
            effects: { catnipJobRatio: 0.5 },
            prices: [
              { name: "minerals", val: 275 },
              { name: "science", val: 100 },
            ],
            resources: {},
          });
        } else if (kind === "tech") {
          setInspected({
            kind: "tech",
            name: "agriculture",
            description: "Founds organised farming.",
            researched: false,
            effects: {},
            prices: [{ name: "science", val: 100 }],
            resources: {},
          });
        } else if (kind === "building-with-resources") {
          setInspected({
            kind: "building",
            name: "hut",
            description: "Houses a kitten.",
            val: 2,
            effects: {},
            prices: [{ name: "wood", val: 5 }],
            resources: { wood: { value: 2, perTick: 0.5 } },
          });
        }
      }}
    >
      set {kind}
    </button>
  );
}

describe("InspectorPanel", () => {
  it("renders with data-testid inspector-panel", () => {
    render(
      <TestWrapper>
        <InspectorPanel />
      </TestWrapper>,
    );
    expect(screen.getByTestId("inspector-panel")).toBeTruthy();
  });

  it("shows placeholder when nothing is inspected", () => {
    render(
      <TestWrapper>
        <InspectorPanel />
      </TestWrapper>,
    );
    expect(screen.getByText("Hover an item to inspect it")).toBeTruthy();
  });

  it("shows building name and description when a building is inspected", () => {
    render(
      <TestWrapper>
        <SetEntityButton kind="building" />
        <InspectorPanel />
      </TestWrapper>,
    );
    act(() => {
      screen.getByTestId("set-building").click();
    });
    expect(screen.getByText("field")).toBeTruthy();
    expect(screen.getByText("Grows catnip each tick.")).toBeTruthy();
  });

  it("shows effects for a building", () => {
    render(
      <TestWrapper>
        <SetEntityButton kind="building" />
        <InspectorPanel />
      </TestWrapper>,
    );
    act(() => {
      screen.getByTestId("set-building").click();
    });
    expect(screen.getByText("Effects")).toBeTruthy();
    expect(screen.getByText("catnipPerTickBase")).toBeTruthy();
  });

  it("shows resource breakdown when a resource is inspected", () => {
    render(
      <TestWrapper>
        <SetEntityButton kind="resource" />
        <InspectorPanel />
      </TestWrapper>,
    );
    act(() => {
      screen.getByTestId("set-resource").click();
    });
    expect(screen.getByText("catnip")).toBeTruthy();
    expect(screen.getByText("Production breakdown")).toBeTruthy();
    expect(screen.getByText("Base")).toBeTruthy();
  });

  it("shows upgrade description and cost", () => {
    render(
      <TestWrapper>
        <SetEntityButton kind="upgrade" />
        <InspectorPanel />
      </TestWrapper>,
    );
    act(() => {
      screen.getByTestId("set-upgrade").click();
    });
    expect(screen.getByText("mineralHoes")).toBeTruthy();
    expect(screen.getByText("Mineral-tipped hoes boost farmer productivity.")).toBeTruthy();
    expect(screen.getByText("Cost")).toBeTruthy();
  });

  it("shows tech description and cost", () => {
    render(
      <TestWrapper>
        <SetEntityButton kind="tech" />
        <InspectorPanel />
      </TestWrapper>,
    );
    act(() => {
      screen.getByTestId("set-tech").click();
    });
    expect(screen.getByText("agriculture")).toBeTruthy();
    expect(screen.getByText("Founds organised farming.")).toBeTruthy();
  });

  it("shows current/needed amounts in cost section", () => {
    render(
      <TestWrapper>
        <SetEntityButton kind="building-with-resources" />
        <InspectorPanel />
      </TestWrapper>,
    );
    act(() => {
      screen.getByTestId("set-building-with-resources").click();
    });
    // Cost section header visible
    expect(screen.getByText("Cost (next)")).toBeTruthy();
    // Resource name shown
    expect(screen.getAllByText(/wood/).length).toBeGreaterThan(0);
    // Time to afford: shortfall=3, perTick=0.5/tick, 5ticks/sec → 3/(0.5*5)=1.2s → "~1s"
    expect(screen.getByText(/~1s/)).toBeTruthy();
  });

  it("hides cost section for purchased upgrades", () => {
    render(
      <TestWrapper>
        <InspectorProvider>
          <HookSetter />
          <InspectorPanel />
        </InspectorProvider>
      </TestWrapper>,
    );
    act(() => {
      screen.getByTestId("set-researched-upgrade").click();
    });
    expect(screen.queryByText("Cost")).toBeNull();
    expect(screen.getByText("Workshop Upgrade · Purchased")).toBeTruthy();
  });
});

function HookSetter(): React.ReactElement {
  const { setInspected } = useInspector();
  return (
    <button
      type="button"
      data-testid="set-researched-upgrade"
      onClick={() =>
        setInspected({
          kind: "upgrade",
          name: "ironHoes",
          description: "Iron hoes improve catnip harvest.",
          researched: true,
          effects: { catnipJobRatio: 0.3 },
          prices: [{ name: "iron", val: 25 }],
          resources: {},
        })
      }
    >
      set researched
    </button>
  );
}
