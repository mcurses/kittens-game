import { act, render } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useCardSize, type CardSize } from "./useCardSize.js";

function HookProbe({
  onState,
}: {
  onState: (value: CardSize, setter: React.Dispatch<React.SetStateAction<CardSize>>) => void;
}): null {
  const [value, setValue] = useCardSize();
  React.useEffect(() => {
    onState(value, setValue);
  }, [value, setValue, onState]);
  return null;
}

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-card-size");
});

afterEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-card-size");
});

describe("useCardSize", () => {
  it("defaults to 'compact' on a fresh load", () => {
    let captured: CardSize | undefined;
    render(<HookProbe onState={(v) => { captured = v; }} />);
    expect(captured).toBe("compact");
  });

  it("sets data-card-size on <html> with the current value", () => {
    render(<HookProbe onState={() => {}} />);
    expect(document.documentElement.getAttribute("data-card-size")).toBe("compact");
  });

  it("updates data-card-size when the setter is called", () => {
    let setter: React.Dispatch<React.SetStateAction<CardSize>> | undefined;
    render(<HookProbe onState={(_v, s) => { setter = s; }} />);
    act(() => {
      setter?.("large");
    });
    expect(document.documentElement.getAttribute("data-card-size")).toBe("large");
  });

  it("persists the value in localStorage and reads it back on remount", () => {
    let setter: React.Dispatch<React.SetStateAction<CardSize>> | undefined;
    const { unmount } = render(<HookProbe onState={(_v, s) => { setter = s; }} />);
    act(() => {
      setter?.("large");
    });
    unmount();

    let captured: CardSize | undefined;
    render(<HookProbe onState={(v) => { captured = v; }} />);
    expect(captured).toBe("large");
  });

  it("rejects an invalid persisted value and falls back to default", () => {
    window.localStorage.setItem("ui:cardSize", JSON.stringify("huge"));
    let captured: CardSize | undefined;
    render(<HookProbe onState={(v) => { captured = v; }} />);
    expect(captured).toBe("compact");
  });
});
