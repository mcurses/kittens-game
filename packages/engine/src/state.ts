import type { Tick } from "@kittens/shared";

/**
 * Root game state — the single serializable snapshot of a game.
 * This is the entire truth; nothing else is authoritative.
 */
export interface GameState {
  readonly version: number;
  readonly tick: Tick;
}

export function createInitialState(): GameState {
  return {
    version: 1,
    tick: 0 as Tick,
  };
}
