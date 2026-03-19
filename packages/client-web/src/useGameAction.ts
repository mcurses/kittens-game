// useGameAction — TanStack Query mutation hook for dispatching game actions
import type { ActionResult } from "@kittens/api-spec";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postGameAction } from "./api.js";
import { GAME_STATE_QUERY_KEY } from "./useGameState.js";

export function useGameAction() {
  const queryClient = useQueryClient();

  return useMutation<ActionResult, Error, { type: string; [key: string]: unknown }>({
    mutationFn: postGameAction,
    onSuccess: (result) => {
      if (result.ok) {
        queryClient.setQueryData(GAME_STATE_QUERY_KEY, result.state);
      }
    },
  });
}
