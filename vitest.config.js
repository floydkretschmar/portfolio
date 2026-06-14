import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      all: true,
      include: ["src/services/ApiService.ts"],
      provider: "v8",
      reportsDirectory: "coverage/behavior-unit",
      reporter: ["text"],
      thresholds: {
        lines: 90,
      },
    },
    environment: "node",
    include: ["tests/behavior/**/*.test.js"],
  },
});
