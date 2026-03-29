// useWebSocket — connects to the server WS and updates query cache on STATE_DELTA
// Also accumulates LOG_MESSAGE envelopes and returns them as a messages array.
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { GAME_STATE_QUERY_KEY } from "./useGameState.js";

const RECONNECT_DELAY_MS = 2000;
const MAX_LOG_MESSAGES = 50;

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

interface WsLogMessageEnvelope {
  type: "LOG_MESSAGE";
  payload: unknown;
  ts: number;
}

type WsEnvelope =
  | WsStateDeltaEnvelope
  | WsConnectedEnvelope
  | WsLogMessageEnvelope
  | { type: string; payload: unknown; ts: number };

export function useWebSocket(url: string | null, slot = "default") {
  const queryClient = useQueryClient();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<readonly string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);

  useEffect(() => {
    if (url === null) {
      return;
    }

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
          const connected = envelope as WsConnectedEnvelope;
          setSessionId(connected.payload.sessionId);
          queryClient.setQueryData(
            [...GAME_STATE_QUERY_KEY, slot],
            (currentState) => currentState ?? connected.payload.state,
          );
        } else if (envelope.type === "STATE_DELTA") {
          queryClient.setQueryData(
            [...GAME_STATE_QUERY_KEY, slot],
            (envelope as WsStateDeltaEnvelope).payload,
          );
        } else if (envelope.type === "LOG_MESSAGE") {
          const msg = getLogMessage((envelope as WsLogMessageEnvelope).payload);
          if (msg === null) {
            return;
          }
          setMessages((prev) => {
            const next = [...prev, msg];
            return next.length > MAX_LOG_MESSAGES
              ? next.slice(next.length - MAX_LOG_MESSAGES)
              : next;
          });
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
  }, [url, queryClient, slot]);

  return { sessionId, messages };
}

function getLogMessage(payload: unknown): string | null {
  if (typeof payload === "string") {
    return payload;
  }

  if (
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }

  return null;
}
