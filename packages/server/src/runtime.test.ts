import { describe, expect, it } from "vitest";
import { getServerDbPath, getStartupSlots } from "./runtime.js";

describe("getServerDbPath", () => {
  it("resolves a stable absolute db path relative to the server package", () => {
    const path = getServerDbPath("file:///repo/packages/server/src/index.ts");
    expect(path).toBe("/repo/packages/server/kittens.db");
  });
});

describe("getStartupSlots", () => {
  it("always includes the default slot", () => {
    expect(getStartupSlots([])).toEqual(["default"]);
  });

  it("includes persisted named slots without duplicates", () => {
    expect(getStartupSlots(["default", "alpha", "beta", "alpha"])).toEqual([
      "default",
      "alpha",
      "beta",
    ]);
  });
});
