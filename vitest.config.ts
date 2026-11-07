import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    env: {
      SESSION_SECRET: "unit-test-secret-0123456789abcdefghijklmnopqrstuv",
      NODE_ENV: "test",
    },
  },
});
