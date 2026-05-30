import { defineConfig } from "vitest/config";
import { resolve } from "path";

/**
 * Vitest config — covers unit tests for pure helpers under lib/.
 *
 * Node environment is enough; nothing under test touches React DOM. The
 * @/ alias mirrors the tsconfig "@/*" path so test files import the same
 * way app code does.
 *
 * Tests live next to the code they exercise under tests/unit/.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    globals: false,
    reporters: ["default"],
  },
});
