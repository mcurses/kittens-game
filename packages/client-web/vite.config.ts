import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@kittens/shared": new URL("../shared/src/index.ts", import.meta.url)
        .pathname,
      "@kittens/api-spec": new URL("../api-spec/src/index.ts", import.meta.url)
        .pathname,
    },
  },
});
