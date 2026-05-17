import {defineConfig} from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["src/test/**/*.test.ts"],
    setupFiles: ["src/test/setup.ts"],
    testTimeout: 20000,
  },
});
