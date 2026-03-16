/** Ticks per second for the game loop */
export const TICKS_PER_SECOND = 5 as const;

/** Default tick interval in milliseconds */
export const TICK_INTERVAL_MS = 1000 / TICKS_PER_SECOND;

/** Save format version — bump on every breaking schema change */
export const SAVE_FORMAT_VERSION = 1 as const;
