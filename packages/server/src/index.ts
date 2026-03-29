// @kittens/server — HTTP + WebSocket server entry point
// Owns the event loop and persistence; delegates game logic to @kittens/engine

import { createApp } from "./app.js";
import { createBunAdapter } from "./db.js";
import { SessionRegistry } from "./session.js";
import { attachWebSocket, websocket } from "./ws.js";

const PORT = 3000;

async function main(): Promise<void> {
  const adapter = await createBunAdapter("kittens.db");
  const registry = new SessionRegistry(adapter);

  // Eagerly init the default slot so it's ready on first request
  const defaultStore = registry.getOrCreate("default");
  defaultStore.startAutoTick();

  const app = createApp(registry);
  attachWebSocket(app, registry);

  const server = Bun.serve({
    port: PORT,
    fetch: app.fetch,
    websocket,
  });

  console.log(`Kittens server running on http://localhost:${PORT}`);

  // Graceful shutdown — stop all active stores' auto-tick
  function shutdown(): void {
    for (const slot of registry.listSlots()) {
      registry.getOrCreate(slot).stopAutoTick();
    }
    server.stop();
    process.exit(0);
  }
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err: unknown) => {
  console.error("Server startup error:", err);
  process.exit(1);
});
