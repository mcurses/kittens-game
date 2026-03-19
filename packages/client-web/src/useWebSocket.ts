// useWebSocket — connects to the server WS and updates query cache on STATE_DELTA
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { GAME_STATE_QUERY_KEY } from "./useGameState.js";

const RECONNECT_DELAY_MS = 2000;

interface WsStateDeltaEnvelope {
  type: "STATE_DELTA";
  payload: unknown;
  ts: number;
}

interface WsConnectedEnvelope {
  type: "CONNECTED";
  payload: {
    sessionId: string;
    state: unknown;
  };
  ts: number;
}

type WsEnvelope = WsStateDeltaEnvelope | WsConnectedEnvelope;

export function useWebSocket(url: string) {
  const queryClient = useQueryClient();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);

  useEffect(() => {
    unmountedRef.current = false;

    function connect() {
      if (unmountedRef.current) return;

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onmessage = (event: MessageEvent) => {
        let envelope: WsEnvelope;
        try {
          envelope = JSON.parse(event.data as string) as WsEnvelope;
        } catch {
          return;
        }

        if (envelope.type === "CONNECTED") {
          setSessionId(envelope.payload.sessionId);
          queryClient.setQueryData(
            GAME_STATE_QUERY_KEY,
            envelope.payload.state,
          );
        } else if (envelope.type === "STATE_DELTA") {
          queryClient.setQueryData(GAME_STATE_QUERY_KEY, envelope.payload);
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (!unmountedRef.current) {
          reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      unmountedRef.current = true;
      if (reconnectTimerRef.current !== null) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (wsRef.current !== null) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [url, queryClient]);

  return { sessionId };
}
