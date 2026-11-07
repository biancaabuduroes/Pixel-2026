import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Same "@/..." import alias as tsconfig.json.
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    // Domain tests live next to their code; cross-module tests live in tests/.
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
  },
});
