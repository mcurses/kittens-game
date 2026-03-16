import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/index.ts"],
    },
  },
  resolve: {
    alias: {
      "@kittens/shared": new URL("../shared/src/index.ts", import.meta.url).pathname,
      "@kittens/engine": new URL("../engine/src/index.ts", import.meta.url).pathname,
    },
  },
});
