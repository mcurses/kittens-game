import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: false,
    environment: "happy-dom",
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/main.tsx"],
    },
  },
  resolve: {
    alias: {
      "@kittens/shared": new URL("../shared/src/index.ts", import.meta.url)
        .pathname,
      "@kittens/api-spec": new URL("../api-spec/src/index.ts", import.meta.url)
        .pathname,
    },
  },
});
