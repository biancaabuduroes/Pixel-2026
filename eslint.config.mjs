import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // CLAUDE.md: src/domain is pure business logic (no Prisma, src/server, src/app, framework).
  {
    files: ["src/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["@prisma/*", "prisma", "**/generated/prisma/**"], message: "src/domain must not use Prisma." },
            { group: ["@/server/*", "@/app/*", "**/server/**", "**/app/**"], message: "src/domain must not import from src/server or src/app." },
            { group: ["next", "next/*", "react", "react-dom"], message: "src/domain must stay framework-free." },
          ],
        },
      ],
    },
  },
  // AI output never feeds into pricing, settlement or the wallet (BUSINESS_LOGIC.md §11).
  {
    files: ["src/domain/{pricing,groups,wallet}/**/*.ts", "src/domain/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["@prisma/*", "prisma", "**/generated/prisma/**"], message: "src/domain must not use Prisma." },
            { group: ["@/server/*", "@/app/*", "**/server/**", "**/app/**"], message: "src/domain must not import from src/server or src/app." },
            { group: ["next", "next/*", "react", "react-dom"], message: "src/domain must stay framework-free." },
            { group: ["../ai", "../ai/*", "@/domain/ai", "@/domain/ai/*", "./ai", "./ai/*"], message: "Pricing, groups and wallet must not depend on the AI module." },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
