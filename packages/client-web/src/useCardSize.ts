import React from "react";
import { usePersistentUiState } from "./usePersistentUiState.js";

export type CardSize = "compact" | "large";

const CARD_SIZE_KEY = "ui:cardSize";
const HTML_ATTR = "data-card-size";

function isCardSize(value: unknown): value is CardSize {
  return value === "compact" || value === "large";
}

/**
 * Persistent global toggle for card sizing across the app.
 *
 * Returns a [value, setter] tuple AND syncs the value onto
 * `<html data-card-size="…">` so CSS can hook into it without prop drilling.
 *
 * The DOM sync also runs on every render (not just mount) so a value loaded
 * from localStorage during SSR/hydration still takes effect.
 */
export function useCardSize(): readonly [CardSize, React.Dispatch<React.SetStateAction<CardSize>>] {
  const [value, setValue] = usePersistentUiState<CardSize>(
    CARD_SIZE_KEY,
    "compact",
    isCardSize,
  );

  React.useEffect(() => {
    if (typeof document !== "undefined" && document.documentElement) {
      document.documentElement.setAttribute(HTML_ATTR, value);
    }
  }, [value]);

  return [value, setValue] as const;
}
