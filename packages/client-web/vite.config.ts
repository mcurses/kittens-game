import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, "../..", "");
  const serverPort = env.PORT ?? "3000";

  return {
    plugins: [react()],
    envDir: "../..",
    envPrefix: ["VITE_", "PORT"],
    server: {
      proxy: {
        "/api": {
          target: `http://localhost:${serverPort}`,
          changeOrigin: true,
        },
        "/ws": {
          target: `ws://localhost:${serverPort}`,
          ws: true,
          changeOrigin: true,
        },
      },
    },
    resolve: {
      alias: {
        "@kittens/engine": new URL("../engine/src/index.ts", import.meta.url).pathname,
        "@kittens/shared": new URL("../shared/src/index.ts", import.meta.url)
          .pathname,
        "@kittens/api-spec": new URL("../api-spec/src/index.ts", import.meta.url)
          .pathname,
      },
    },
  };
});
