import { fileURLToPath } from "node:url";
import { DEFAULT_SLOT } from "./store.js";

export function getServerDbPath(moduleUrl: string): string {
  return fileURLToPath(new URL("../kittens.db", moduleUrl));
}

export function getStartupSlots(persistedSlots: readonly string[]): string[] {
  return [...new Set([DEFAULT_SLOT, ...persistedSlots])];
}
