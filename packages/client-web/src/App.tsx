// App — root component, wires QueryClient + WebSocket + UI panels
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { ActionPanel } from "./ActionPanel.js";
import { ResourcePanel } from "./ResourcePanel.js";
import { useGameState } from "./useGameState.js";
import { useWebSocket } from "./useWebSocket.js";

/** Derive the WebSocket URL from window.location */
function getWsUrl(): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws`;
}

function GameView(): React.ReactElement {
  const { data: state } = useGameState();
  useWebSocket(getWsUrl());

  return (
    <main>
      <h1>Kittens Game</h1>
      <ResourcePanel state={state} />
      <ActionPanel />
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
