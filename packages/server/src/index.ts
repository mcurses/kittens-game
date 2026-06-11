// @kittens/server — HTTP + WebSocket server entry point
// Owns the event loop and persistence; delegates game logic to @kittens/engine

import { createApp } from "./app.js";
import { createBunAdapter } from "./db.js";
import { getServerDbPath } from "./runtime.js";
import { SessionRegistry } from "./store.js";
import { attachWebSocket, websocket } from "./ws.js";

const PORT = Number(process.env.PORT ?? 3000);

async function main(): Promise<void> {
  const adapter = await createBunAdapter(getServerDbPath(import.meta.url));
  const registry = new SessionRegistry(adapter);

  // Load all active slots at startup
  registry.loadActiveSlots();

  const app = createApp(registry);
  attachWebSocket(app, registry);

  const server = Bun.serve({
    port: PORT,
    fetch: app.fetch,
    websocket,
  });

  // Graceful shutdown
  function shutdown(): void {
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
