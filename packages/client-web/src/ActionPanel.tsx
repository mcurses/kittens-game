// ActionPanel — UI controls for dispatching game actions
import React from "react";
import { useGameAction } from "./useGameAction.js";

export function ActionPanel(): React.ReactElement {
  const { mutate, isPending, error } = useGameAction();

  return (
    <div data-testid="action-panel">
      <h2>Actions</h2>
      {error ? (
        <p data-testid="action-error" style={{ color: "red" }}>
          {error.message}
        </p>
      ) : null}
      <button
        type="button"
        data-testid="btn-gather-catnip"
        disabled={isPending}
        onClick={() => mutate({ type: "GATHER_CATNIP" })}
      >
        Gather Catnip
      </button>
    </div>
  );
}
