import type { Hono } from "hono";
// WebSocket integration — Bun-only. Not imported in tests.
// Attaches the /ws route to the app using Hono's bun WS helper.
import { upgradeWebSocket, websocket } from "hono/bun";
import type { WSContext } from "hono/ws";
import type { GameStateStore, WsClient } from "./store.js";

export { websocket };

/**
 * Attach the /ws route to an existing Hono app.
 * Called from index.ts after createApp().
 */
export function attachWebSocket(app: Hono, store: GameStateStore): void {
  app.get(
    "/ws",
    upgradeWebSocket((_c) => {
      let wsClient: WsClient | null = null;

      return {
        onOpen(_event: Event, ws: WSContext) {
          const sessionId = crypto.randomUUID();
          wsClient = {
            send: (data: string) => ws.send(data),
          };
          store.addClient(wsClient);

          // Send CONNECTED envelope with session ID and current state
          ws.send(
            JSON.stringify({
              type: "CONNECTED",
              payload: {
                sessionId,
                state: store.getSerialized(),
              },
              ts: Date.now(),
            }),
          );
        },

        onClose(_event: Event) {
          if (wsClient !== null) {
            store.removeClient(wsClient);
            wsClient = null;
          }
        },

        onError(_event: Event) {
          if (wsClient !== null) {
            store.removeClient(wsClient);
            wsClient = null;
          }
        },
      };
    }),
  );
}
