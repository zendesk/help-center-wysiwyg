import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          include: ["tests/*.test.js"],
          environment: "node",
        },
      },
      {
        optimizeDeps: { include: ["@zendeskgarden/react-components"] },
        test: {
          name: "browser",
          include: ["tests/*.browser.js"],
          browser: {
            enabled: true,
            provider: "playwright",
            headless: true,
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
