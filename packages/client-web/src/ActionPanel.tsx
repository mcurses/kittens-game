// ActionPanel — Gather Catnip primary action, now lives in the resource sidebar footer
import React from "react";
import { useGameAction } from "./useGameAction.js";

export function ActionPanel(): React.ReactElement {
  const { mutate, isPending, error } = useGameAction();

  return (
    <div className="sidebar-actions" data-testid="action-panel">
      {error ? (
        <p className="action-error" data-testid="action-error">
          {error.message}
        </p>
      ) : null}
      <button
        type="button"
        className="btn btn--primary btn--full"
        data-testid="btn-gather-catnip"
        disabled={isPending}
        onClick={() => mutate({ type: "GATHER_CATNIP" })}
      >
        Gather Catnip
      </button>
    </div>
  );
}
