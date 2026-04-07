// App — root component, wires QueryClient + WebSocket + UI panels
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { ActionPanel } from "./ActionPanel.js";
import { CalendarDisplay } from "./CalendarDisplay.js";
import { ImportSavePanel } from "./ImportSavePanel.js";
import { InspectorPanel } from "./InspectorPanel.js";
import { InspectorProvider } from "./InspectorContext.js";
import { LogPanel } from "./LogPanel.js";
import { ResourcePanel } from "./ResourcePanel.js";
import { SessionsPanel } from "./SessionsPanel.js";
import { SlotProvider } from "./SlotContext.js";
import { TabContainer } from "./TabContainer.js";
import { VillagePanel } from "./VillagePanel.js";
import { useGameState } from "./useGameState.js";
import { useWebSocket } from "./useWebSocket.js";

interface LocationLike {
  hostname: string;
  port: string;
  protocol: string;
  host: string;
}

const SLOT_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;
type AppRoute = "game" | "sessions";

/**
 * Extract the slot name from a URL search string.
 * Falls back to "default" if absent or invalid.
 */
export function getSlot(search: string): string {
  const params = new URLSearchParams(search);
  const slot = params.get("slot") ?? "default";
  return SLOT_PATTERN.test(slot) ? slot : "default";
}

/** Map the current pathname to a top-level client view. */
export function getRoute(pathname: string): AppRoute {
  return pathname === "/sessions" ? "sessions" : "game";
}

/** Derive the WebSocket URL from the current browser location. */
export function getWsUrl(
  location: LocationLike = window.location,
  isDev = import.meta.env.DEV,
  slot = "default",
): string {
  const slotSuffix = slot !== "default" ? `?slot=${slot}` : "";

  const isLocalViteDevServer =
    isDev &&
    (location.hostname === "localhost" || location.hostname === "127.0.0.1") &&
    location.port === "5173";

  if (isLocalViteDevServer) {
    return `ws://localhost:3000/ws${slotSuffix}`;
  }

  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${location.host}/ws${slotSuffix}`;
}

function GameView(): React.ReactElement {
  const slot = getSlot(window.location.search);
  const { data: state, error, isError, isSuccess } = useGameState(slot);
  const [showImport, setShowImport] = React.useState(false);
  const wsUrl = isSuccess ? getWsUrl(window.location, import.meta.env.DEV, slot) : null;
  const { messages } = useWebSocket(wsUrl, slot);

  if (isError) {
    return (
      <InspectorProvider>
        <SlotProvider slot={slot}>
          <div className="app">
            <div className="error-view">
              <h1 className="error-view-title">Could not connect</h1>
              <p className="error-view-msg" data-testid="game-state-error">
                {error instanceof Error ? error.message : "Failed to load game state."}
              </p>
              <ActionPanel state={state} />
            </div>
          </div>
        </SlotProvider>
      </InspectorProvider>
    );
  }

  return (
    <InspectorProvider>
      <SlotProvider slot={slot}>
        <div className="app">
          <header className="app-header">
            <span className="app-title">Kittens Game</span>
            <div className="header-sep" aria-hidden="true" />
            <CalendarDisplay state={state} />
            <div className="header-spacer" />
            <VillagePanel state={state} />
          </header>

          <div className="app-body">
            {/* Left — Resources */}
            <aside data-testid="resource-sidebar" className="resource-sidebar">
              <ResourcePanel state={state} />
              <ActionPanel state={state} />
              <button
                type="button"
                className="import-legacy-toggle"
                data-testid="import-legacy-toggle"
                onClick={() => setShowImport((v) => !v)}
              >
                {showImport ? "Hide Import" : "Import Legacy Save"}
              </button>
              {showImport && (
                <ImportSavePanel onClose={() => setShowImport(false)} />
              )}
            </aside>

            {/* Center — Main content */}
            <section className="content-area">
              <TabContainer state={state} />
            </section>

            {/* Right — Inspector (top) + Log (bottom) */}
            <aside className="log-sidebar">
              <InspectorPanel />
              <LogPanel messages={messages} />
            </aside>
          </div>
        </div>
      </SlotProvider>
    </InspectorProvider>
  );
}

function SessionsView(): React.ReactElement {
  const slot = getSlot(window.location.search);

  return (
    <SlotProvider slot={slot}>
      <SessionsPanel />
    </SlotProvider>
  );
}

export function App({
  queryClient,
}: {
  queryClient?: QueryClient;
}): React.ReactElement {
  const client = React.useMemo(
    () =>
      queryClient ??
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 0, retry: 1 },
        },
      }),
    [queryClient],
  );

  return (
    <QueryClientProvider client={client}>
      {getRoute(window.location.pathname) === "sessions" ? <SessionsView /> : <GameView />}
    </QueryClientProvider>
  );
}
