#!/usr/bin/env bun
/**
 * play-test.ts — Drive the kittens game to theology via API
 *
 * Early-game loop (faithful to legacy):
 *   1. GATHER_CATNIP until field unlocks (catnip >= 3)
 *   2. Buy fields with catnip
 *   3. CRAFT wood from catnip (100 catnip → 1 wood) to buy huts
 *   4. Once kittens arrive, assign woodcutters, then scholars
 *   5. Research tech tree up to theology
 */

const BASE = "http://localhost:3000";

type Resources = Record<string, { value: number; maxValue: number; perTick?: number }>;
type GameState = {
  tick: number;
  resources: Resources;
  buildings: Record<string, { val: number; on: number; unlocked?: boolean }>;
  village: { kittens: number; jobs: Record<string, { value: number }>; happiness: number };
  science: { techs: Record<string, { unlocked: boolean; researched: boolean }> };
  workshop: { crafts: Record<string, { unlocked: boolean }> };
};

async function getState(): Promise<GameState> {
  return (await fetch(`${BASE}/api/game/state`)).json() as Promise<GameState>;
}

async function act(body: object): Promise<{ ok: boolean; state: GameState }> {
  return (
    await fetch(`${BASE}/api/game/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  ).json() as Promise<{ ok: boolean; state: GameState }>;
}

async function advanceTick(n = 1): Promise<GameState> {
  let state!: GameState;
  for (let i = 0; i < n; i++) {
    state = (await (await fetch(`${BASE}/api/game/tick`, { method: "POST" })).json()) as GameState;
  }
  return state!;
}

const r = (s: GameState, name: string) => s.resources[name]?.value ?? 0;
const researched = (s: GameState, name: string) => s.science.techs[name]?.researched === true;
const unlocked = (s: GameState, tech: string) => s.science.techs[tech]?.unlocked === true;
const bldVal = (s: GameState, name: string) => s.buildings[name]?.val ?? 0;
const bldOn = (s: GameState, name: string) => s.buildings[name]?.on ?? 0;
const jobCount = (s: GameState, job: string) => s.village.jobs[job]?.value ?? 0;
const freeKittens = (s: GameState) =>
  s.village.kittens - Object.values(s.village.jobs).reduce((a, j) => a + j.value, 0);

let _lastStatus = 0;
function logStatus(s: GameState) {
  if (s.tick - _lastStatus < 100) return;
  _lastStatus = s.tick;
  console.log(
    `  [t=${s.tick}] 🐱${s.village.kittens}/${s.effectCache?.maxKittens ?? 0} ` +
      `catnip=${r(s, "catnip").toFixed(0)} wood=${r(s, "wood").toFixed(1)} ` +
      `minerals=${r(s, "minerals").toFixed(0)} science=${r(s, "science").toFixed(0)} ` +
      `manpower=${r(s, "manpower").toFixed(0)} furs=${r(s, "furs").toFixed(0)} ` +
      `culture=${r(s, "culture").toFixed(0)} manuscript=${r(s, "manuscript").toFixed(0)}`,
  );
}

async function tryBuy(name: string) {
  return (await act({ type: "BUY_BUILDING", name })).ok;
}
async function tryResearch(name: string) {
  const r = await act({ type: "RESEARCH", name });
  if (r.ok) console.log(`  ✅ Researched: ${name}`);
  return r.ok;
}
async function tryCraft(name: string, amount: number) {
  return (await act({ type: "CRAFT", name, amount })).ok;
}
async function tryAssign(job: string) {
  return (await act({ type: "ASSIGN_JOB", job })).ok;
}
async function tryUnassign(job: string) {
  return (await act({ type: "UNASSIGN_JOB", job })).ok;
}
async function tryHunt() {
  return (await act({ type: "HUNT" })).ok;
}

/** Set job counts, unassigning excess then assigning up to target */
async function setJobs(s: GameState, targets: Record<string, number>): Promise<GameState> {
  for (const [job, target] of Object.entries(targets)) {
    let cur = jobCount(s, job);
    while (cur > target) {
      await tryUnassign(job);
      cur--;
    }
  }
  s = await getState();
  for (const [job, target] of Object.entries(targets)) {
    let cur = jobCount(s, job);
    while (cur < target && freeKittens(s) > 0) {
      if (!(await tryAssign(job))) break;
      cur++;
      s = await getState();
    }
  }
  return getState();
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Kittens Play-Test: Race to Theology ===\n");

  // Hard reset
  await fetch(`${BASE}/api/game/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hard: true }),
  });
  console.log("🔄 Hard reset\n");

  // ─────────────────────────────────────────────────────────────────────────
  // Phase 1: Gather catnip → buy fields → craft wood → buy huts → kittens
  // ─────────────────────────────────────────────────────────────────────────
  console.log("=== Phase 1: Early game — fields, huts, first kittens ===");
  let s = await getState();

  // Keep gathering + ticking until we have 5 kittens
  while (s.village.kittens < 5) {
    // Gather catnip manually (gives 1 catnip each)
    for (let i = 0; i < 5; i++) await act({ type: "GATHER_CATNIP" });
    s = await advanceTick(5);
    logStatus(s);

    // Buy fields whenever we can afford them
    while (s.buildings.field?.unlocked && r(s, "catnip") >= 10) {
      if (!(await tryBuy("field"))) break;
      s = await getState();
    }

    // Once we have ≥100 catnip, craft wood (100 catnip → 1 wood)
    const woodCraftable = Math.floor(r(s, "catnip") / 100);
    if (woodCraftable >= 1) {
      await tryCraft("wood", woodCraftable);
      s = await getState();
    }

    // Buy huts when wood >= 5 and hut is unlocked (unlockRatio 0.3 × 5 = 1.5)
    while (s.buildings.hut?.unlocked && r(s, "wood") >= 5) {
      if (!(await tryBuy("hut"))) break;
      s = await getState();
      console.log(`  🏠 Hut #${bldVal(s, "hut")} built (maxKittens=${(bldVal(s, "hut") * 2)})`);
    }
  }
  console.log(`  ✅ ${s.village.kittens} kittens arrived\n`);

  // ─────────────────────────────────────────────────────────────────────────
  // Phase 2: Library + scholars → research calendar, agriculture, mining
  // ─────────────────────────────────────────────────────────────────────────
  console.log("=== Phase 2: Library + scholars → calendar, agriculture, mining ===");

  // Get more huts up to 10 kittens capacity
  while (bldVal(s, "hut") < 5) {
    while (r(s, "wood") < 5) {
      for (let i = 0; i < 5; i++) await act({ type: "GATHER_CATNIP" });
      s = await advanceTick(10);
      const woodCraftable = Math.floor(r(s, "catnip") / 100);
      if (woodCraftable >= 1) { await tryCraft("wood", woodCraftable); s = await getState(); }
    }
    if (!(await tryBuy("hut"))) break;
    s = await getState();
    console.log(`  🏠 Hut #${bldVal(s, "hut")}`);
  }

  // Assign 2 woodcutters, rest scholars
  s = await setJobs(s, { woodcutter: 2, scholar: Math.max(0, s.village.kittens - 2) });
  console.log(`  👷 Jobs: woodcutter=${jobCount(s, "woodcutter")} scholar=${jobCount(s, "scholar")}`);

  // Buy first library (costs 25 wood)
  while (bldVal(s, "library") < 1) {
    while (r(s, "wood") < 25) {
      s = await advanceTick(20);
      logStatus(s);
    }
    if (await tryBuy("library")) {
      s = await getState();
      console.log("  📚 Library #1 built");
    }
  }

  // Research calendar → agriculture → mining in order
  for (const tech of ["calendar", "agriculture", "mining"] as const) {
    const costs: Record<string, number> = { calendar: 30, agriculture: 100, mining: 500 };
    const cost = costs[tech]!;
    console.log(`  Researching ${tech} (needs ${cost} science)...`);
    while (!researched(s, tech)) {
      // Scale up libraries as science cap fills
      if (bldVal(s, "library") < 3 && r(s, "wood") >= 25) {
        if (await tryBuy("library")) { s = await getState(); console.log(`  📚 Library #${bldVal(s, "library")}`); }
      }
      if (unlocked(s, tech) && r(s, "science") >= cost) {
        await tryResearch(tech);
      }
      s = await advanceTick(20);
      logStatus(s);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Phase 3: Scale up — more kittens, barns, engineering, writing
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n=== Phase 3: Scale — barns, engineering, writing ===");

  // Grow to 15 kittens
  while (s.village.kittens < 15) {
    while (r(s, "wood") < 5) {
      s = await advanceTick(20);
      logStatus(s);
    }
    if (bldVal(s, "hut") * 2 <= s.village.kittens + 1 && r(s, "wood") >= 5) {
      if (await tryBuy("hut")) { s = await getState(); console.log(`  🏠 Hut #${bldVal(s, "hut")}`); }
    }
    s = await advanceTick(20);
    logStatus(s);
  }

  // Rebalance jobs: woodcutters for wood, scholars for science
  s = await setJobs(s, { woodcutter: 3, scholar: s.village.kittens - 3 });

  // Build more libraries (up to 8)
  while (bldVal(s, "library") < 8) {
    while (r(s, "wood") < 25) { s = await advanceTick(10); }
    if (!(await tryBuy("library"))) break;
    s = await getState();
    console.log(`  📚 Library #${bldVal(s, "library")}`);
  }

  // Research: metal, animal, engineering in order
  for (const [tech, cost] of [["metal", 900], ["animal", 500], ["engineering", 1500]] as const) {
    console.log(`  Researching ${tech} (needs ${cost} science)...`);
    while (!researched(s, tech)) {
      if (unlocked(s, tech) && r(s, "science") >= cost) {
        await tryResearch(tech);
      } else {
        s = await advanceTick(20);
        logStatus(s);
      }
    }
  }

  // Research writing (3600 science) — unlocks parchment crafting
  console.log("  Researching writing (needs 3600 science)...");
  while (!researched(s, "writing")) {
    // Keep building libraries
    if (bldVal(s, "library") < 15 && r(s, "wood") >= 25) {
      if (await tryBuy("library")) { s = await getState(); console.log(`  📚 Library #${bldVal(s, "library")}`); }
    }
    if (unlocked(s, "writing") && r(s, "science") >= 3600) {
      await tryResearch("writing");
    }
    s = await advanceTick(30);
    logStatus(s);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Phase 4: Hunters → furs → parchment → manuscript
  // ─────────────────────────────────────────────────────────────────────────
  console.log("\n=== Phase 4: Hunters + furs → parchment → manuscript ===");

  // Need 35 manuscripts for theology.
  // Manuscript = 25 parchment + 400 culture
  // Parchment = 175 furs
  // Total furs needed: 35 * 25 * 175 = 153,125 furs
  // With hunters accumulating manpower → hunting → furs

  // Grow to 25 kittens
  while (s.village.kittens < 25) {
    if (bldVal(s, "hut") * 2 <= s.village.kittens + 1 && r(s, "wood") >= 5) {
      if (await tryBuy("hut")) { s = await getState(); console.log(`  🏠 Hut #${bldVal(s, "hut")}`); }
    }
    s = await advanceTick(20);
    logStatus(s);
  }

  // Assign hunters alongside scholars
  s = await setJobs(s, { woodcutter: 2, scholar: 15, hunter: 6 });
  console.log(`  🏹 Jobs: woodcutter=${jobCount(s, "woodcutter")} scholar=${jobCount(s, "scholar")} hunter=${jobCount(s, "hunter")}`);

  // Hunt + craft loop until 35 manuscripts
  console.log("  Hunting for furs and crafting manuscripts...");
  while (r(s, "manuscript") < 35) {
    // Hunt whenever we have ≥100 manpower
    if (r(s, "manpower") >= 100) {
      await tryHunt();
      s = await getState();
    }

    // Craft parchment from furs (175 furs each)
    const parchAmt = Math.floor(r(s, "furs") / 175);
    if (parchAmt >= 1) { await tryCraft("parchment", parchAmt); s = await getState(); }

    // Craft manuscript from parchment + culture (25 parchment + 400 culture each)
    const mssAmt = Math.floor(Math.min(r(s, "parchment") / 25, r(s, "culture") / 400));
    if (mssAmt >= 1) {
      await tryCraft("manuscript", mssAmt);
      s = await getState();
      console.log(`  📜 Manuscripts: ${r(s, "manuscript").toFixed(0)}`);
    }

    s = await advanceTick(30);
    logStatus(s);
  }
  console.log("  ✅ 35+ manuscripts ready\n");

  // ─────────────────────────────────────────────────────────────────────────
  // Phase 5: math, construction, philosophy → theology
  // ─────────────────────────────────────────────────────────────────────────
  console.log("=== Phase 5: math → construction → philosophy → theology ===");

  for (const [tech, cost] of [
    ["math", 1000],
    ["construction", 1300],
    ["philosophy", 9500],
  ] as const) {
    console.log(`  Researching ${tech} (needs ${cost} science)...`);
    while (!researched(s, tech)) {
      if (bldVal(s, "library") < 20 && r(s, "wood") >= 25) {
        if (await tryBuy("library")) { s = await getState(); console.log(`  📚 Library #${bldVal(s, "library")}`); }
      }
      if (unlocked(s, tech) && r(s, "science") >= cost) {
        await tryResearch(tech);
      } else {
        s = await advanceTick(50);
        logStatus(s);
      }
    }
  }

  // Final: theology (20000 science + 35 manuscripts)
  console.log("\n  Researching theology (needs 20000 science + 35 manuscript)...");
  while (!researched(s, "theology")) {
    // Top up manuscripts if somehow consumed
    if (r(s, "manuscript") < 35) {
      if (r(s, "manpower") >= 100) { await tryHunt(); s = await getState(); }
      const p = Math.floor(r(s, "furs") / 175);
      if (p >= 1) { await tryCraft("parchment", p); s = await getState(); }
      const m = Math.floor(Math.min(r(s, "parchment") / 25, r(s, "culture") / 400));
      if (m >= 1) { await tryCraft("manuscript", m); s = await getState(); }
    }

    if (bldVal(s, "library") < 25 && r(s, "wood") >= 25) {
      if (await tryBuy("library")) { s = await getState(); console.log(`  📚 Library #${bldVal(s, "library")}`); }
    }

    if (unlocked(s, "theology") && r(s, "science") >= 20000 && r(s, "manuscript") >= 35) {
      await tryResearch("theology");
    } else {
      s = await advanceTick(50);
      logStatus(s);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Done
  // ─────────────────────────────────────────────────────────────────────────
  s = await getState();
  console.log("\n🎉🎉🎉 THEOLOGY RESEARCHED! 🎉🎉🎉");
  console.log("\n=== Final State ===");
  console.log(`  Tick: ${s.tick} | Kittens: ${s.village.kittens}`);
  console.log("  Researched techs:");
  for (const [name, tech] of Object.entries(s.science.techs)) {
    if (tech.researched) process.stdout.write(`    ✅ ${name}\n`);
  }
  console.log("\n✅ PLAY-TEST PASSED\n");
}

// Patch GameState type to include effectCache
declare module "./play-test" {
  interface GameState {
    effectCache: Record<string, number>;
  }
}

main().catch((err) => {
  console.error("Play-test error:", err);
  process.exit(1);
});
