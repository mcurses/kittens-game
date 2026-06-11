// ActionPanel — manual actions in the resource sidebar footer
import { deriveUiVisibility } from "@kittens/engine";
import type React from "react";
import { useSlot } from "./SlotContext.js";
import { ResourceIcon } from "./ui/index.js";
import { useGameAction } from "./useGameAction.js";

interface ActionPanelState {
  readonly science?: {
    readonly techs?: Record<string, { readonly researched?: boolean }>;
  };
  readonly challenges?: {
    readonly challenges?: Record<string, { readonly active?: boolean }>;
  };
  readonly resources?: {
    readonly catpower?: {
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
  const catpower = state?.resources?.catpower?.value ?? 0;
  const huntCost = Math.max(1, 100 - (state?.effectCache?.huntCatpowerDiscount ?? 0));
  const huntSquads = Math.floor(catpower / huntCost);
  const huntLabel =
    huntSquads > 0 ? `Hunt (${huntSquads} squad${huntSquads === 1 ? "" : "s"})` : "Hunt";
  const visibility = deriveUiVisibility(state as never);

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
        <ResourceIcon name="catnip" size="sm" /> Gather Catnip
      </button>
      {visibility.actions.huntVisible && (
        <div className="hunt-actions">
          <button
            type="button"
            className="btn btn--secondary btn--full"
            data-testid="btn-hunt"
            disabled={isPending || huntSquads < 1}
            onClick={() => mutate({ type: "HUNT" })}
          >
            <ResourceIcon name="catpower" size="sm" /> {huntLabel}
          </button>
          {huntSquads >= 2 && (
            <div className="hunt-shortcuts">
              <button
                type="button"
                className="btn btn--secondary btn--xs"
                data-testid="btn-hunt-half"
                disabled={isPending}
                onClick={() => mutate({ type: "HUNT", amount: Math.floor(huntSquads / 2) })}
              >
                ×½
              </button>
              <button
                type="button"
                className="btn btn--secondary btn--xs"
                data-testid="btn-hunt-fifth"
                disabled={isPending}
                onClick={() =>
                  mutate({ type: "HUNT", amount: Math.max(1, Math.floor(huntSquads / 5)) })
                }
              >
                ×⅕
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
