import { describe, expect, it, vi } from "vitest";
import { runLiveImportParityAudit } from "./liveParity.js";

describe("run8-live-parity", () => {
  it("runLiveImportParityAudit returns result with fixture and snapshots", () => {
    const result = runLiveImportParityAudit(1);

    expect(result).toBeDefined();
    expect(result.fixture).toBeDefined();
    expect(result.imported).toBeDefined();
    expect(result.live).toBeDefined();
    expect(result.importMismatches).toBeInstanceOf(Array);
    expect(result.liveMismatches).toBeInstanceOf(Array);
    expect(result.ticks).toBe(1);
  });

  it("runLiveImportParityAudit captures fixture metadata", () => {
    const result = runLiveImportParityAudit(1);

    expect(result.fixture.fixture).toBeDefined();
    expect(result.fixture.capturedAt).toBeDefined();
    expect(result.fixture.source).toBeDefined();
    expect(result.fixture.snapshot).toBeDefined();
  });

  it("runLiveImportParityAudit imported snapshot matches fixture snapshot", () => {
    const result = runLiveImportParityAudit(0);

    // With 0 ticks, import should match fixture (no time for drift)
    expect(result.importMismatches.length).toBe(0);
  });

  it("runLiveImportParityAudit advances calendar days with ticks", () => {
    const result1 = runLiveImportParityAudit(0);
    const result10 = runLiveImportParityAudit(10);

    const day1 = result1.live.calendar.day;
    const day10 = result10.live.calendar.day;

    expect(day10).toBeGreaterThanOrEqual(day1);
  });

  it("runLiveImportParityAudit captures full audit snapshot structure", () => {
    const result = runLiveImportParityAudit(1);

    const { imported } = result;
    expect(imported.calendar).toBeDefined();
    expect(imported.calendar.year).toBeGreaterThan(0);
    expect(imported.calendar.season).toBeGreaterThanOrEqual(0);
    expect(imported.calendar.day).toBeGreaterThanOrEqual(0);

    expect(imported.village).toBeDefined();
    expect(imported.village.kittens).toBeGreaterThan(0);

    expect(imported.resources).toBeDefined();
    expect(Object.keys(imported.resources).length).toBeGreaterThan(0);

    expect(imported.buildings).toBeDefined();
    expect(Object.keys(imported.buildings).length).toBeGreaterThan(0);

    expect(imported.automation).toBeDefined();
    expect(imported.workshop).toBeDefined();
    expect(imported.policies).toBeDefined();
    expect(imported.time).toBeDefined();
  });

  it("runLiveImportParityAudit default ticks is 10", () => {
    const result = runLiveImportParityAudit();

    expect(result.ticks).toBe(10);
  });

  it("runLiveImportParityAudit allows custom tick counts", () => {
    const result5 = runLiveImportParityAudit(5);
    const result50 = runLiveImportParityAudit(50);

    expect(result5.ticks).toBe(5);
    expect(result50.ticks).toBe(50);
  });
});
