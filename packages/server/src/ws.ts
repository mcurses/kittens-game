import type { Hono } from "hono";
// WebSocket integration — Bun-only. Not imported in tests.
// Attaches the /ws route to the app using Hono's bun WS helper.
import { upgradeWebSocket, websocket } from "hono/bun";
import type { WSContext } from "hono/ws";
import { DEFAULT_SLOT } from "./store.js";
import type { WsClient } from "./store.js";
import { SessionRegistry, isValidSlot } from "./session.js";
import { GameActionRequestSchema } from "@kittens/api-spec";

export { websocket };

/**
 * Attach the /ws route to an existing Hono app.
 * Called from index.ts after createApp().
 * Reads ?slot=<name> query param to route the client to the correct store.
 */
export function attachWebSocket(app: Hono, registry: SessionRegistry): void {
  app.get(
    "/ws",
    upgradeWebSocket((c) => {
      const rawSlot = c.req.query("slot") ?? DEFAULT_SLOT;
      const slot = isValidSlot(rawSlot) ? rawSlot : DEFAULT_SLOT;
      let wsClient: WsClient | null = null;

      return {
        onOpen(_event: Event, ws: WSContext) {
          const sessionId = crypto.randomUUID();
          const store = registry.getOrCreate(slot);
          wsClient = {
            send: (data: string) => ws.send(data),
          };
          store.addClient(wsClient);

          // Send CONNECTED envelope with session ID, slot, and current state
          ws.send(
            JSON.stringify({
              type: "CONNECTED",
              payload: {
                sessionId,
                slot,
                state: store.getSerialized(),
              },
              ts: Date.now(),
            }),
          );
        },

        onMessage(event: MessageEvent, _ws: WSContext) {
          if (wsClient === null) return;
          const store = registry.getOrCreate(slot);

          let msg: unknown;
          try {
            msg = JSON.parse(event.data as string);
          } catch {
            wsClient.send(JSON.stringify({ type: "ACTION_ERROR", payload: { error: "Invalid JSON" } }));
            return;
          }

          if (
            typeof msg !== "object" ||
            msg === null ||
            (msg as Record<string, unknown>).type !== "ACTION"
          ) {
            return;
          }

          const payload = (msg as Record<string, unknown>).payload;
          const parsed = GameActionRequestSchema.safeParse(payload);
          if (!parsed.success) {
            wsClient.send(
              JSON.stringify({
                type: "ACTION_ERROR",
                payload: { error: parsed.error.issues[0]?.message ?? "Invalid action" },
              }),
            );
            return;
          }

          const result = store.applyGameAction(parsed.data);
          wsClient.send(
            JSON.stringify({
              type: "ACTION_RESULT",
              payload: { ok: result.ok, state: result.state },
            }),
          );
        },

        onClose(_event: Event) {
          if (wsClient !== null) {
            const store = registry.getOrCreate(slot);
            store.removeClient(wsClient);
            wsClient = null;
          }
        },

        onError(_event: Event) {
          if (wsClient !== null) {
            const store = registry.getOrCreate(slot);
            store.removeClient(wsClient);
            wsClient = null;
          }
        },
      };
    }),
  );
}
