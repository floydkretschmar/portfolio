import { defineConfig, mergeConfig } from "vitest/config";

import viteConfig from "./vite.config.js";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      coverage: {
        all: true,
        include: ["src/services/flickr-client.js"],
        provider: "v8",
        reportsDirectory: "coverage/behavior-unit",
        reporter: ["text"],
        thresholds: {
          lines: 90,
        },
      },
      environment: "jsdom",
      environmentOptions: {
        jsdom: {
          url: "http://127.0.0.1:4174/",
        },
      },
      include: ["tests/behavior/**/*.test.js"],
      server: {
        deps: {
          inline: ["vuetify"],
        },
      },
    },
  }),
);
