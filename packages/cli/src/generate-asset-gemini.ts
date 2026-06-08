#!/usr/bin/env bun
// Calls the Gemini 2.5 Flash Image API ("Nano Banana") to generate a single
// asset PNG. The rest of the Kittens Game asset pipeline (sips downsample →
// cwebp encode → exports/<category>/<asset>.webp → INDEX.md update) is
// unchanged — this script only replaces the Higgsfield MCP generation step.
//
// Required: GEMINI_API_KEY in .env (free key at https://aistudio.google.com/apikey).
//
// Usage:
//   bun --env-file=../../.env src/generate-asset-gemini.ts \
//     --prompt-file ../../assets/higgsfield/prompts/building-hut.md \
//     --reference ../../assets/exports/buildings/field-m.webp \
//     --out ../../assets/higgsfield/raw/building-hut-v1.png

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, extname } from "node:path";

interface Args {
  prompt?: string;
  promptFile?: string;
  reference?: string;
  out: string;
  aspect: string;
  model: string;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const get = (flag: string): string | undefined => {
    const i = argv.indexOf(flag);
    return i >= 0 && i + 1 < argv.length ? argv[i + 1] : undefined;
  };
  const out = get("--out");
  if (!out) {
    throw new Error("Missing required --out <path-to-write-png>");
  }
  if (!get("--prompt") && !get("--prompt-file")) {
    throw new Error("Provide either --prompt <text> or --prompt-file <md-path>");
  }
  return {
    prompt: get("--prompt"),
    promptFile: get("--prompt-file"),
    reference: get("--reference"),
    out,
    aspect: get("--aspect") ?? "1:1",
    model: get("--model") ?? "gemini-2.5-flash-image",
  };
}

/** Extract the first fenced code block from markdown, else return the whole
 *  file. Matches any fence length ≥ 3 backticks so we round-trip cleanly with
 *  the prompts written by generate-kitten-prompts.ts (which pick fence length
 *  based on content). */
function extractPrompt(md: string): string {
  const fence = md.match(/^(`{3,})([^\n]*)\n([\s\S]*?)\n\1/m);
  if (fence?.[3]) return fence[3].trim();
  return md.trim();
}

function mimeFor(path: string): string {
  const ext = extname(path).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  throw new Error(`Unsupported reference image extension: ${ext}`);
}

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: GeminiPart[] } }>;
  promptFeedback?: { blockReason?: string };
  error?: { message?: string };
}

async function callGemini(
  apiKey: string,
  model: string,
  parts: GeminiPart[],
  attempt = 1,
): Promise<Buffer> {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent` +
    `?key=${encodeURIComponent(apiKey)}`;
  const body = {
    contents: [{ parts }],
    generationConfig: { responseModalities: ["IMAGE"] },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.status === 429 && attempt === 1) {
    console.warn("Rate-limited (429). Waiting 60s and retrying once …");
    await new Promise((r) => setTimeout(r, 60_000));
    return callGemini(apiKey, model, parts, attempt + 1);
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini API HTTP ${res.status}: ${text}`);
  }

  const json = (await res.json()) as GeminiResponse;
  if (json.error?.message) {
    throw new Error(`Gemini API error: ${json.error.message}`);
  }
  if (json.promptFeedback?.blockReason) {
    throw new Error(`Prompt blocked by safety filter: ${json.promptFeedback.blockReason}`);
  }
  const candidate = json.candidates?.[0];
  const imagePart = candidate?.content?.parts?.find((p) => p.inlineData?.data);
  if (!imagePart?.inlineData?.data) {
    throw new Error("No image in response. Likely the model returned only text — refine the prompt.");
  }
  return Buffer.from(imagePart.inlineData.data, "base64");
}

async function main(): Promise<void> {
  const args = parseArgs();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY missing. Add it to /.env and run via `bun --env-file=../../.env …`",
    );
  }

  const rawPrompt = args.prompt
    ? args.prompt
    : extractPrompt(readFileSync(args.promptFile!, "utf-8"));
  const promptWithAspect = `${rawPrompt}\n\nAspect ratio: ${args.aspect}.`;

  const parts: GeminiPart[] = [{ text: promptWithAspect }];

  if (args.reference) {
    const ref = readFileSync(args.reference);
    parts.push({
      inlineData: { mimeType: mimeFor(args.reference), data: ref.toString("base64") },
    });
    console.log(`Using reference: ${args.reference} (${(ref.byteLength / 1024).toFixed(0)} KB)`);
  }

  console.log(`Calling ${args.model} (aspect=${args.aspect}) …`);
  const png = await callGemini(apiKey, args.model, parts);

  mkdirSync(dirname(args.out), { recursive: true });
  writeFileSync(args.out, png);
  console.log(`✓ Wrote ${args.out} (${(png.byteLength / 1024).toFixed(0)} KB)`);
}

main().catch((err) => {
  console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
