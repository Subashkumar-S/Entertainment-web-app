import { defineConfig } from "vitest/config";

// Isolated from vite.config.ts: these are pure-logic unit tests (no React/DOM),
// so they run in the lightweight node environment.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
