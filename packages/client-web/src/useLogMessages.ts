// useLogMessages — subscribes to WS and accumulates LOG_MESSAGE events
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { GAME_STATE_QUERY_KEY } from "./useGameState.js";

const MAX_LOG_MESSAGES = 50;
const RECONNECT_DELAY_MS = 2000;

interface WsLogMessageEnvelope {
  type: "LOG_MESSAGE";
  payload: string;
  ts: number;
}

interface WsStateDeltaEnvelope {
  type: "STATE_DELTA";
  payload: unknown;
  ts: number;
}

interface WsConnectedEnvelope {
  type: "CONNECTED";
  payload: { sessionId: string; state: unknown };
  ts: number;
}

type WsEnvelope =
  | WsLogMessageEnvelope
  | WsStateDeltaEnvelope
  | WsConnectedEnvelope
  | { type: string; payload: unknown; ts: number };

export function useLogMessages(url: string | null) {
  const [messages, setMessages] = useState<readonly string[]>([]);
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);

  useEffect(() => {
    if (url === null) return;

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

        if (envelope.type === "LOG_MESSAGE") {
          const msg = (envelope as WsLogMessageEnvelope).payload;
          setMessages((prev) => {
            const next = [...prev, msg];
            return next.length > MAX_LOG_MESSAGES
              ? next.slice(next.length - MAX_LOG_MESSAGES)
              : next;
          });
        } else if (envelope.type === "CONNECTED") {
          const connected = envelope as WsConnectedEnvelope;
          queryClient.setQueryData(
            GAME_STATE_QUERY_KEY,
            (currentState: unknown) => currentState ?? connected.payload.state,
          );
        } else if (envelope.type === "STATE_DELTA") {
          queryClient.setQueryData(
            GAME_STATE_QUERY_KEY,
            (envelope as WsStateDeltaEnvelope).payload,
          );
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

  return { messages };
}
