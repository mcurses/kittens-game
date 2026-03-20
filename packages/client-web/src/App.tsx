// App — root component, wires QueryClient + WebSocket + UI panels
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { ActionPanel } from "./ActionPanel.js";
import { CalendarDisplay } from "./CalendarDisplay.js";
import { LogPanel } from "./LogPanel.js";
import { TabContainer } from "./TabContainer.js";
import { useGameState } from "./useGameState.js";
import { useLogMessages } from "./useLogMessages.js";
import { useWebSocket } from "./useWebSocket.js";

interface LocationLike {
  hostname: string;
  port: string;
  protocol: string;
  host: string;
}

/** Derive the WebSocket URL from the current browser location. */
export function getWsUrl(
  location: LocationLike = window.location,
  isDev = import.meta.env.DEV,
): string {
  const isLocalViteDevServer =
    isDev &&
    (location.hostname === "localhost" || location.hostname === "127.0.0.1") &&
    location.port === "5173";

  if (isLocalViteDevServer) {
    return "ws://localhost:3000/ws";
  }

  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${location.host}/ws`;
}

function GameView(): React.ReactElement {
  const { data: state, error, isError, isSuccess } = useGameState();
  const wsUrl = isSuccess ? getWsUrl() : null;
  useWebSocket(wsUrl);
  const { messages } = useLogMessages(wsUrl);

  if (isError) {
    return (
      <main>
        <h1>Kittens Game</h1>
        <p data-testid="game-state-error">
          {error instanceof Error ? error.message : "Failed to load game state."}
        </p>
        <ActionPanel />
      </main>
    );
  }

  return (
    <main>
      <header>
        <h1>Kittens Game</h1>
        <CalendarDisplay state={state} />
      </header>
      <div style={{ display: "flex", gap: "1rem" }}>
        <div style={{ flex: 1 }}>
          <TabContainer state={state} />
          <ActionPanel />
        </div>
        <aside style={{ width: "260px" }}>
          <LogPanel messages={messages} />
        </aside>
      </div>
    </main>
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
      <GameView />
    </QueryClientProvider>
  );
}
