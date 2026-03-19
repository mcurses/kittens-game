import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.ts"],
      // Exclude: test files, entry points, and Bun-native modules (ws.ts uses hono/bun, index.ts uses Bun.serve)
      exclude: ["src/**/*.test.ts", "src/index.ts", "src/ws.ts"],
    },
  },
  resolve: {
    alias: {
      "@kittens/shared": new URL("../shared/src/index.ts", import.meta.url).pathname,
      "@kittens/engine": new URL("../engine/src/index.ts", import.meta.url).pathname,
      "@kittens/api-spec": new URL("../api-spec/src/index.ts", import.meta.url).pathname,
    },
  },
});
