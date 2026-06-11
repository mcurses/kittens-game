// SlotContext tests
import { cleanup, render, screen } from "@testing-library/react";
import type React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { SlotProvider, useSlot } from "./SlotContext.js";

afterEach(cleanup);

function SlotConsumer(): React.ReactElement {
  const slot = useSlot();
  return <span data-testid="slot">{slot}</span>;
}

describe("SlotContext", () => {
  it("provides 'default' when no provider is present", () => {
    render(<SlotConsumer />);
    expect(screen.getByTestId("slot").textContent).toBe("default");
  });

  it("provides the slot value from SlotProvider", () => {
    render(
      <SlotProvider slot="mysave">
        <SlotConsumer />
      </SlotProvider>,
    );
    expect(screen.getByTestId("slot").textContent).toBe("mysave");
  });

  it("nested consumers read the nearest provider", () => {
    render(
      <SlotProvider slot="outer">
        <SlotProvider slot="inner">
          <SlotConsumer />
        </SlotProvider>
      </SlotProvider>,
    );
    expect(screen.getByTestId("slot").textContent).toBe("inner");
  });
});
