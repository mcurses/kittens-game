// @kittens/server — HTTP + WebSocket server entry point
// Owns the event loop and persistence; delegates game logic to @kittens/engine

import { createApp } from "./app.js";
import { createBunAdapter } from "./db.js";
import { GameStateStore } from "./store.js";
import { attachWebSocket, websocket } from "./ws.js";

const PORT = 3000;

async function main(): Promise<void> {
  const adapter = await createBunAdapter("kittens.db");
  const store = new GameStateStore(adapter);
  store.init();
  store.startAutoTick();

  const app = createApp(store);
  attachWebSocket(app, store);

  const server = Bun.serve({
    port: PORT,
    fetch: app.fetch,
    websocket,
  });

  console.log(`Kittens server running on http://localhost:${PORT}`);

  // Graceful shutdown
  process.on("SIGINT", () => {
    store.stopAutoTick();
    server.stop();
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    store.stopAutoTick();
    server.stop();
    process.exit(0);
  });
}

main().catch((err: unknown) => {
  console.error("Server startup error:", err);
  process.exit(1);
});
