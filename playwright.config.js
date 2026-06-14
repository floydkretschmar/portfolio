import { defineConfig } from "@playwright/test";

export default defineConfig({
  use: {
    baseURL: "http://127.0.0.1:4174",
  },
  testDir: "tests/e2e",
  webServer: {
    command:
      "npm run build && npm run preview -- --host 127.0.0.1 --port 4174 --strictPort",
    reuseExistingServer: false,
    url: "http://127.0.0.1:4174",
  },
});
