// InspectorContext tests
import { act, cleanup, render, screen } from "@testing-library/react";
import type React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { type InspectorEntity, InspectorProvider, useInspector } from "./InspectorContext.js";

afterEach(cleanup);

function TestConsumer(): React.ReactElement {
  const { inspected, setInspected, clearInspected } = useInspector();
  return (
    <div>
      <span data-testid="kind">{inspected?.kind ?? "none"}</span>
      <span data-testid="name">{inspected?.name ?? "none"}</span>
      <button
        type="button"
        data-testid="set-building"
        onClick={() =>
          setInspected({
            kind: "building",
            name: "field",
            description: "A field",
            val: 1,
            effects: { catnipPerTickBase: 0.125 },
            prices: [{ name: "catnip", val: 10 }],
          })
        }
      >
        set
      </button>
      <button type="button" data-testid="clear" onClick={clearInspected}>
        clear
      </button>
    </div>
  );
}

describe("InspectorContext", () => {
  it("starts with no inspected entity", () => {
    render(
      <InspectorProvider>
        <TestConsumer />
      </InspectorProvider>,
    );
    expect(screen.getByTestId("kind").textContent).toBe("none");
  });

  it("setInspected updates the context", () => {
    render(
      <InspectorProvider>
        <TestConsumer />
      </InspectorProvider>,
    );
    act(() => {
      screen.getByTestId("set-building").click();
    });
    expect(screen.getByTestId("kind").textContent).toBe("building");
    expect(screen.getByTestId("name").textContent).toBe("field");
  });

  it("clearInspected resets to null", () => {
    render(
      <InspectorProvider>
        <TestConsumer />
      </InspectorProvider>,
    );
    act(() => {
      screen.getByTestId("set-building").click();
    });
    act(() => {
      screen.getByTestId("clear").click();
    });
    expect(screen.getByTestId("kind").textContent).toBe("none");
  });

  it("useInspector default value is null with no-op functions", () => {
    // Without a provider, context returns null entity with no-op setters
    let inspectedValue: InspectorEntity | null = undefined as unknown as InspectorEntity | null;
    function DirectConsumer() {
      const { inspected } = useInspector();
      inspectedValue = inspected;
      return null;
    }
    render(<DirectConsumer />);
    expect(inspectedValue).toBeNull();
  });
});
