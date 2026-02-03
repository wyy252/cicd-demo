import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  retries: 0,
  reporter: [["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:5000"
  }
});
