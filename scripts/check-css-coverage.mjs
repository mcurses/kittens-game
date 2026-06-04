#!/usr/bin/env node
// CSS class-coverage check.
//
// Scans every `className=` attribute (string, JSX expression, template literal)
// in `packages/client-web/src/**/*.tsx` and verifies that each emitted class
// has a matching rule in `packages/client-web/src/styles.css`. Reports orphan
// classes and exits non-zero so CI can gate.
//
// The extractor walks the source once and only inspects the actual className
// value (between `className=` and the matching closing quote/brace), so
// neighboring `data-testid`/`role` strings on the same line don't pollute the
// result.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC_DIR = join(ROOT, "packages/client-web/src");
const CSS_PATH = join(SRC_DIR, "styles.css");

// Whitelist: classes that are intentionally JS-only or come from third-party
// libs / browser shadow parts.
const WHITELIST = new Set([
  "active", // legacy state class (we migrated to data-active, but a stray ref may linger)
  "max",
  "warning",
]);

// Pre-existing orphans: classes referenced in JSX without a CSS rule that
// existed BEFORE this lint was introduced. Each one is a known design-drift
// debt; converting to either (a) a real CSS rule or (b) a known schema class
// is left for follow-up cleanup work. The check still treats *new* orphans
// (not in this list) as CI failures.
const KNOWN_ORPHANS = new Set([
  "inspector-flavor",
  "inspector-prices",
  "inspector-price-detail",
  "inspector-price-name",
  "item-row-done",
  "job-count",
  "job-name",
  "job-row",
  "mission-reached",
  "praise-multiplier",
  "resource-craft-shortcuts",
  "tech-name",
  "craft-name",
  "building-count",
  "building-name",
  "building-prices",
  "census-leader",
  "census-promote",
  "census-unassign",
]);

function listTsxFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...listTsxFiles(p));
    else if (p.endsWith(".tsx") && !p.endsWith(".test.tsx")) out.push(p);
  }
  return out;
}

// Pull all class identifiers from `cssText`'s selector positions.
function collectDefinedClasses(cssText) {
  const out = new Set();
  for (const m of cssText.matchAll(/\.([a-zA-Z_][\w-]*)/g)) out.add(m[1]);
  return out;
}

// Return the index right after the className=… value, plus the substring of
// the value AND whether it came from a JSX `{expr}` form. Handles
// `className="…"`, `className='…'`, `className={…}`.
function readClassNameValue(src, start) {
  const idx = src.indexOf("className=", start);
  if (idx === -1) return null;
  const afterEq = idx + "className=".length;
  const first = src[afterEq];
  if (first === '"' || first === "'") {
    const end = src.indexOf(first, afterEq + 1);
    if (end === -1) return null;
    return { value: src.slice(afterEq + 1, end), isExpression: false, nextStart: end + 1 };
  }
  if (first === "{") {
    let depth = 1;
    let i = afterEq + 1;
    while (i < src.length && depth > 0) {
      const c = src[i];
      if (c === "{") depth++;
      else if (c === "}") depth--;
      else if (c === '"' || c === "'" || c === "`") {
        i = skipString(src, i, c);
        continue;
      }
      i++;
    }
    return { value: src.slice(afterEq + 1, i - 1), isExpression: true, nextStart: i };
  }
  return { value: "", isExpression: false, nextStart: afterEq };
}

function skipString(src, i, quote) {
  let j = i + 1;
  while (j < src.length) {
    const c = src[j];
    if (c === "\\") { j += 2; continue; }
    if (c === quote) return j + 1;
    if (quote === "`" && c === "$" && src[j + 1] === "{") {
      // Template literal expression — walk balanced braces.
      let depth = 1;
      j += 2;
      while (j < src.length && depth > 0) {
        if (src[j] === "{") depth++;
        else if (src[j] === "}") depth--;
        j++;
      }
      continue;
    }
    j++;
  }
  return j;
}

// Pull every string literal out of `expr` and union their tokens.
function classesFromExpression(expr) {
  const out = new Set();
  let i = 0;
  while (i < expr.length) {
    const c = expr[i];
    if (c === '"' || c === "'" || c === "`") {
      const end = skipString(expr, i, c);
      const body = expr.slice(i + 1, end - 1);
      // Strip ${…} from template literals before splitting.
      const cleaned = body.replace(/\$\{[^}]*\}/g, " ");
      for (const tok of cleaned.split(/\s+/)) {
        if (looksLikeClass(tok)) out.add(tok);
      }
      i = end;
    } else {
      i++;
    }
  }
  return out;
}

function looksLikeClass(tok) {
  if (!tok) return false;
  // Real class names start with a lowercase letter, contain only
  // lowercase + digits + dash + underscore, and never end with a stray dash
  // (which is typically a fragment left over from `${interpolation}`).
  if (!/^[a-z][a-z0-9_-]*[a-z0-9]$/.test(tok)) return false;
  if (WHITELIST.has(tok)) return false;
  return true;
}

function scanFile(src, relPath, usedClasses) {
  let pos = 0;
  while (true) {
    const found = readClassNameValue(src, pos);
    if (!found) break;
    // String-literal form: split raw tokens directly. JSX-expression form:
    // bare identifiers are *variables* (resolved at runtime — we can't see
    // their values), so we only look at string literals nested inside the
    // expression. This avoids treating `className={markerClass}` as the
    // literal class `markerClass`.
    const classes = found.isExpression
      ? classesFromExpression(found.value)
      : new Set(found.value.split(/\s+/).filter(looksLikeClass));
    for (const cls of classes) {
      // Determine line by counting newlines up to `pos`.
      const upTo = src.slice(0, found.nextStart);
      const line = upTo.split("\n").length;
      if (!usedClasses.has(cls)) usedClasses.set(cls, []);
      usedClasses.get(cls).push(`${relPath}:${line}`);
    }
    pos = found.nextStart;
  }
}

const cssText = readFileSync(CSS_PATH, "utf8");
const definedClasses = collectDefinedClasses(cssText);

const usedClasses = new Map();
for (const f of listTsxFiles(SRC_DIR)) {
  const src = readFileSync(f, "utf8");
  scanFile(src, f.replace(ROOT + "/", ""), usedClasses);
}

const orphans = [];
const knownOrphans = [];
for (const [cls, locations] of usedClasses) {
  if (definedClasses.has(cls)) continue;
  if (KNOWN_ORPHANS.has(cls)) knownOrphans.push({ cls, locations });
  else orphans.push({ cls, locations });
}

if (orphans.length === 0) {
  const knownNote = knownOrphans.length > 0
    ? ` (${knownOrphans.length} known-orphan baseline — see KNOWN_ORPHANS in this script)`
    : "";
  console.log(`✓ CSS class-coverage clean — ${usedClasses.size} classes, all defined${knownNote}.`);
  process.exit(0);
}

orphans.sort((a, b) => a.cls.localeCompare(b.cls));
console.error(`✗ ${orphans.length} orphan class(es) in JSX without a CSS rule:\n`);
for (const o of orphans) {
  console.error(`  .${o.cls}`);
  for (const loc of o.locations.slice(0, 3)) console.error(`     ${loc}`);
  if (o.locations.length > 3) console.error(`     … and ${o.locations.length - 3} more`);
}
console.error("\nFix options:");
console.error("  • Add a CSS rule for the class in packages/client-web/src/styles.css");
console.error("  • Or replace the className with an already-defined one (see DESIGN_SYSTEM.md)");
console.error("  • Or whitelist in scripts/check-css-coverage.mjs if it's intentionally unstyled");
process.exit(1);
