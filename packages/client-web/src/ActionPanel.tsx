// ActionPanel — manual actions in the resource sidebar footer
import React from "react";
import { useSlot } from "./SlotContext.js";
import { useGameAction } from "./useGameAction.js";

interface ActionPanelState {
  readonly resources?: {
    readonly manpower?: {
      readonly value?: number;
    };
  };
  readonly effectCache?: Record<string, number>;
}

export function ActionPanel({
  state,
}: {
  state?: ActionPanelState;
} = {}): React.ReactElement {
  const slot = useSlot();
  const { mutate, isPending, error } = useGameAction(slot);
  const manpower = state?.resources?.manpower?.value ?? 0;
  const huntCost = Math.max(1, 100 - (state?.effectCache?.huntCatpowerDiscount ?? 0));
  const huntSquads = Math.floor(manpower / huntCost);
  const huntLabel = huntSquads > 0 ? `Hunt (${huntSquads} squad${huntSquads === 1 ? "" : "s"})` : "Hunt";

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
      <button
        type="button"
        className="btn btn--secondary btn--full"
        data-testid="btn-hunt"
        disabled={isPending || huntSquads < 1}
        onClick={() => mutate({ type: "HUNT" })}
      >
        {huntLabel}
      </button>
    </div>
  );
}
