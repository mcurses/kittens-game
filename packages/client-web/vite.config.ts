import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
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
});
