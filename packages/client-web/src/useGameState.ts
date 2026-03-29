// useGameState — TanStack Query hook for fetching and caching game state
import type { GameStateResponse } from "@kittens/api-spec";
import { useQuery } from "@tanstack/react-query";
import { fetchGameState } from "./api.js";

export const GAME_STATE_QUERY_KEY = ["gameState"] as const;

export function useGameState(slot = "default") {
  return useQuery<GameStateResponse>({
    queryKey: [...GAME_STATE_QUERY_KEY, slot],
    queryFn: () => fetchGameState(slot),
    staleTime: 0,
  });
}
