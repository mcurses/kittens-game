#!/usr/bin/env bun
// Read the current game state, compose a Higgsfield prompt per kitten that
// doesn't yet have a unique portrait, and write each prompt to
// `assets/higgsfield/queue/kitten-{id}-{name}.md`. The designer pastes each
// file into Higgsfield UI, downloads the raw PNG, runs the standard pixelation
// pipeline, drops the WEBP at `assets/exports/characters/k{id}.webp`, and
// dispatches `SET_KITTEN_PORTRAIT` to wire it into the kitten record.
//
// Usage:
//   bun run packages/cli/src/generate-kitten-prompts.ts \
//     [--server http://localhost:3100] [--slot default] [--out assets/higgsfield/queue]

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { composeKittenPrompt } from "@kittens/engine/src/kittens/portraitPrompt.js";
import type { Appearance } from "@kittens/engine/src/kittens/appearance.js";

interface KittenLike {
  id: string;
  name: string;
  surname: string;
  job: string | null;
  appearance?: Appearance;
  portraitPath?: string | null;
}

function parseArgs(): { server: string; slot: string; out: string } {
  const args = process.argv.slice(2);
  const get = (flag: string, fallback: string): string => {
    const i = args.indexOf(flag);
    return i >= 0 && i + 1 < args.length ? args[i + 1]! : fallback;
  };
  const here = dirname(fileURLToPath(import.meta.url));
  const defaultOut = resolve(here, "../../../assets/higgsfield/queue");
  return {
    server: get("--server", "http://localhost:3100"),
    slot: get("--slot", "default"),
    out: get("--out", defaultOut),
  };
}

async function fetchKittens(server: string, slot: string): Promise<KittenLike[]> {
  const url = `${server}/api/game/state?slot=${encodeURIComponent(slot)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`State fetch failed: HTTP ${res.status}`);
  const json = await res.json() as { village?: { sim?: unknown[] } };
  const sim = json.village?.sim;
  if (!Array.isArray(sim)) return [];
  return sim as KittenLike[];
}

function sanitizeFilename(s: string): string {
  return s.replace(/[^a-zA-Z0-9-]+/g, "-").toLowerCase();
}

function safeFenceCount(text: string): number {
  // Pick a fence length one longer than the longest backtick run in the text,
  // so the code fence around the prompt always closes cleanly.
  const matches = text.match(/`+/g) ?? [];
  const longest = matches.reduce((m, s) => Math.max(m, s.length), 0);
  return Math.max(3, longest + 1);
}

function buildPromptFile(kitten: KittenLike): string {
  if (!kitten.appearance) {
    throw new Error(
      `kitten ${kitten.id} has no appearance — make sure the engine migration ran (load the save once).`,
    );
  }
  const prompt = composeKittenPrompt({ appearance: kitten.appearance, job: kitten.job });
  const fence = "`".repeat(safeFenceCount(prompt));
  return `# kitten-${kitten.id}-${sanitizeFilename(kitten.name)}

**Subject**: ${kitten.name} ${kitten.surname}
**Job**: ${kitten.job ?? "(unassigned)"}
**Appearance**: ${kitten.appearance.breed} / ${kitten.appearance.body} / ${kitten.appearance.eyes} / ${kitten.appearance.accessory ?? "no accessory"}

## Prompt (paste verbatim into Higgsfield UI, Banana Pro model)

${fence}
${prompt}
${fence}

## After generation

1. Save raw PNG to \`assets/higgsfield/raw/characters/${kitten.id}-v1.png\`
2. Standard pixelation + export:
   \`\`\`bash
   sips -Z 512 assets/higgsfield/raw/characters/${kitten.id}-v1.png --out /tmp/i.png
   sips -Z 256 /tmp/i.png --out /tmp/p256.png
   sips -Z 512 /tmp/p256.png --out /tmp/p512.png
   cwebp -lossless -q 100 /tmp/p512.png -o assets/exports/characters/${kitten.id}.webp
   \`\`\`
3. Wire it in:
   \`\`\`
   POST /api/game/action?slot=default
   { "type": "SET_KITTEN_PORTRAIT", "kittenId": "${kitten.id}", "path": "/assets/characters/${kitten.id}.webp" }
   \`\`\`
`;
}

async function main(): Promise<void> {
  const { server, slot, out } = parseArgs();
  mkdirSync(out, { recursive: true });

  console.log(`Fetching state from ${server} (slot=${slot}) …`);
  const kittens = await fetchKittens(server, slot);
  const pending = kittens.filter((k) => !k.portraitPath);
  if (pending.length === 0) {
    console.log("No kittens without a portrait. Nothing to do.");
    return;
  }

  console.log(`Writing ${pending.length} prompt files to ${out}/`);
  for (const k of pending) {
    const filename = `kitten-${k.id}-${sanitizeFilename(k.name)}.md`;
    const path = resolve(out, filename);
    writeFileSync(path, buildPromptFile(k), "utf-8");
    console.log(`  ✓ ${filename} (${k.appearance?.breed ?? "no-appearance"} / ${k.job ?? "unassigned"})`);
  }

  console.log(`\nDone. ${pending.length} prompts ready for Higgsfield.`);
}

main().catch((err) => {
  console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
