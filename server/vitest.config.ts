import { defineConfig } from "vitest/config";

// Pure normalizer/unit tests — no Express, DB, or network. Runs in node.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
