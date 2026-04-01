import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ReligionPanel } from "./ReligionPanel.js";

const mockMutate = vi.fn();
vi.mock("./useGameAction.js", () => ({
  useGameAction: () => ({ mutate: mockMutate, isPending: false, error: null }),
}));

function makeState(
  religion: {
    worship?: number;
    faithRatio?: number;
    transcendenceTier?: number;
    zu?: Record<string, { val: number; on: number; unlocked: boolean }>;
    ru?: Record<string, { val: number; on: number }>;
    tu?: Record<string, { val: number; on: number; unlocked: boolean }>;
  },
  resources: Record<string, { value: number; maxValue?: number }> = {},
) {
  return {
    version: 1,
    tick: 0,
    religion: {
      worship: religion.worship ?? 0,
      faithRatio: religion.faithRatio ?? 0,
      transcendenceTier: religion.transcendenceTier ?? 0,
      zu: religion.zu ?? {},
      ru: religion.ru ?? {},
      tu: religion.tu ?? {},
    },
    resources: Object.fromEntries(
      Object.entries(resources).map(([k, v]) => [k, { value: v.value, maxValue: v.maxValue ?? 0, perTick: 0 }]),
    ),
  } as unknown as import("@kittens/api-spec").GameStateResponse;
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ReligionPanel", () => {
  it("shows loading placeholder when state is null", () => {
    render(<ReligionPanel state={null} />);
    expect(screen.getByTestId("religion-panel-loading")).toBeTruthy();
  });

  it("shows loading placeholder when state is undefined", () => {
    render(<ReligionPanel state={undefined} />);
    expect(screen.getByTestId("religion-panel-loading")).toBeTruthy();
  });

  it("renders religion panel with worship amount", () => {
    const state = makeState({ worship: 42.5 });
    render(<ReligionPanel state={state} />);
    expect(screen.getByTestId("religion-panel")).toBeTruthy();
    expect(screen.getByText(/42\.5/)).toBeTruthy();
  });

  it("renders Praise button that dispatches PRAISE action", () => {
    const state = makeState({});
    render(<ReligionPanel state={state} />);
    const btn = screen.getByRole("button", { name: /praise/i });
    fireEvent.click(btn);
    expect(mockMutate).toHaveBeenCalledWith({ type: "PRAISE" });
  });

  it("renders Adore button that dispatches ADORE action", () => {
    const state = makeState({});
    render(<ReligionPanel state={state} />);
    const btn = screen.getByRole("button", { name: /adore/i });
    fireEvent.click(btn);
    expect(mockMutate).toHaveBeenCalledWith({ type: "ADORE" });
  });

  it("shows ziggurat upgrades that are unlocked", () => {
    const state = makeState({
      zu: {
        unicornTomb: { val: 1, on: 1, unlocked: true },
        ivoryTower: { val: 0, on: 0, unlocked: false },
      },
    });
    render(<ReligionPanel state={state} />);
    expect(screen.getByTestId("zu-unicornTomb")).toBeTruthy();
    expect(screen.queryByTestId("zu-ivoryTower")).toBeNull();
  });

  it("dispatches BUY_ZIGGURAT_UPGRADE when ziggurat buy button is clicked", () => {
    const state = makeState(
      { zu: { unicornTomb: { val: 0, on: 0, unlocked: true } } },
      // provide enough resources (unicornTomb costs 500 ivory + 5 tears)
      { ivory: { value: 1000 }, tears: { value: 100 } },
    );
    render(<ReligionPanel state={state} />);
    const btn = screen.getByTestId("zu-unicornTomb-buy");
    fireEvent.click(btn);
    expect(mockMutate).toHaveBeenCalledWith({ type: "BUY_ZIGGURAT_UPGRADE", name: "unicornTomb" });
  });

  it("shows religion upgrades", () => {
    const state = makeState({
      ru: { solarchant: { val: 0, on: 0 } },
    });
    render(<ReligionPanel state={state} />);
    expect(screen.getByTestId("ru-solarchant")).toBeTruthy();
  });

  it("dispatches BUY_RELIGION_UPGRADE when religion upgrade buy is clicked", () => {
    const state = makeState(
      { ru: { solarchant: { val: 0, on: 0 } } },
      { faith: { value: 10000 } },
    );
    render(<ReligionPanel state={state} />);
    const btn = screen.getByTestId("ru-solarchant-buy");
    fireEvent.click(btn);
    expect(mockMutate).toHaveBeenCalledWith({ type: "BUY_RELIGION_UPGRADE", name: "solarchant" });
  });

  it("keeps Buy button and marks it storage-limited when ziggurat upgrade cost exceeds current storage", () => {
    const state = makeState(
      { zu: { unicornTomb: { val: 0, on: 0, unlocked: true } } },
      { ivory: { value: 0, maxValue: 250 }, tears: { value: 0, maxValue: 1 } },
    );
    render(<ReligionPanel state={state} />);
    const btn = screen.getByTestId("zu-unicornTomb-buy");
    expect(btn.textContent).toBe("Buy");
    expect(btn.className).toMatch(/btn--limited/);
    expect(btn.hasAttribute("disabled")).toBe(true);
  });

  it("shows transcendence tier", () => {
    const state = makeState({ transcendenceTier: 3 });
    render(<ReligionPanel state={state} />);
    expect(screen.getByText(/tier.*3|3.*tier/i)).toBeTruthy();
  });

  it("shows Transcend button dispatching TRANSCEND", () => {
    const state = makeState({}, { faith: { value: 10000 } });
    render(<ReligionPanel state={state} />);
    const btn = screen.getByRole("button", { name: /transcend/i });
    fireEvent.click(btn);
    expect(mockMutate).toHaveBeenCalledWith({ type: "TRANSCEND" });
  });

  it("renders panel when state has no religion key", () => {
    render(<ReligionPanel state={{} as never} />);
    expect(screen.getByTestId("religion-panel")).toBeTruthy();
  });

  it("renders panel when zu and ru are absent", () => {
    const state = { religion: { worship: 1, faithRatio: 0, transcendenceTier: 0 } } as never;
    render(<ReligionPanel state={state} />);
    expect(screen.getByTestId("religion-panel")).toBeTruthy();
  });

  it("skips null zu entries gracefully", () => {
    const state = {
      religion: { worship: 0, faithRatio: 0, transcendenceTier: 0, zu: { bad: null }, ru: { bad: null } },
    } as never;
    render(<ReligionPanel state={state} />);
    expect(screen.getByTestId("religion-panel")).toBeTruthy();
  });
});

// ── Epic 32 Story 32-01: Religion TU (Cryptotheology) section ────────────────

describe("Story 32-01: Religion TU section", () => {
  it("renders TU section when tu has entries with val > 0", () => {
    const state = makeState({
      tu: { blackObelisk: { val: 1, on: 1, unlocked: true } },
    });
    render(<ReligionPanel state={state} />);
    expect(screen.getByTestId("tu-blackObelisk")).toBeTruthy();
  });

  it("does not render TU section when tu is empty", () => {
    const state = makeState({ tu: {} });
    render(<ReligionPanel state={state} />);
    expect(screen.queryByTestId(/^tu-/)).toBeNull();
  });

  it("shows Cryptotheology subsection label when TU entries present", () => {
    const state = makeState({
      tu: { blackObelisk: { val: 1, on: 1, unlocked: true } },
    });
    render(<ReligionPanel state={state} />);
    expect(screen.getByText(/cryptotheology/i)).toBeTruthy();
  });

  it("dispatches BUY_TRANSCENDENCE_UPGRADE when TU buy is clicked", () => {
    const state = makeState(
      { tu: { blackObelisk: { val: 1, on: 0, unlocked: true } } },
      { relic: { value: 1000, maxValue: 1000 } },
    );
    render(<ReligionPanel state={state} />);
    const btn = screen.getByTestId("tu-blackObelisk-buy");
    fireEvent.click(btn);
    expect(mockMutate).toHaveBeenCalledWith({
      type: "BUY_TRANSCENDENCE_UPGRADE",
      name: "blackObelisk",
    });
  });

  it("shows TU count (val)", () => {
    const state = makeState({
      tu: { blackObelisk: { val: 3, on: 3, unlocked: true } },
    });
    render(<ReligionPanel state={state} />);
    expect(screen.getByText(/×3/)).toBeTruthy();
  });

  it("TU section absent when tu is undefined", () => {
    const state = makeState({});
    render(<ReligionPanel state={state} />);
    expect(screen.queryByText(/cryptotheology/i)).toBeNull();
  });
});

// ── Epic 32 Story 32-02: RU one-time upgrade "Done" state ────────────────────

describe("Story 32-02: RU one-time upgrades show Done state", () => {
  it("shows Done label for RU with val >= 1", () => {
    const state = makeState({
      ru: { solarRevolution: { val: 1, on: 1 } },
    });
    render(<ReligionPanel state={state} />);
    // Should show "Done" instead of a Buy button for val:1 one-time upgrades
    expect(screen.queryByTestId("ru-solarRevolution-buy")).toBeNull();
    expect(screen.getByText(/done/i)).toBeTruthy();
  });

  it("still shows Buy for stackable RU with val > 0", () => {
    const state = makeState({
      ru: { solarchant: { val: 2, on: 2 } },
    });
    render(<ReligionPanel state={state} />);
    // solarchant is stackable (no maxVal restriction) — Buy should still appear
    expect(screen.getByTestId("ru-solarchant-buy")).toBeTruthy();
  });
});

// ── Epic 32 Story 32-03: Praise/adore multiplier display ──────────────────────

describe("Story 32-03: Praise/adore multiplier display", () => {
  it("shows worship gain multiplier near Praise button when faithRatio > 0", () => {
    const state = makeState({ faithRatio: 2.5, worship: 100 });
    render(<ReligionPanel state={state} />);
    // Should show a multiplier based on faithRatio (e.g. "+250%" or "×2.5" or similar)
    expect(screen.getByTestId("praise-multiplier")).toBeTruthy();
  });

  it("multiplier reflects faithRatio value", () => {
    const state = makeState({ faithRatio: 3.0 });
    render(<ReligionPanel state={state} />);
    const multiplier = screen.getByTestId("praise-multiplier");
    // should contain "300" or "3" or relevant ratio display
    expect(multiplier.textContent).toMatch(/3/);
  });
});
