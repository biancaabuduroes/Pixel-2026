import { existsSync } from "node:fs";
import { defineConfig } from "prisma/config";

// Locally, read .env.local (Next.js convention). In the cloud/Vercel the variables are already set.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // Migrations use the direct (non-pooled) connection. Optional here so `prisma generate`
  // (run on every install) works without it; scripts/migrate-production.mjs requires it.
  datasource: { url: process.env.DIRECT_URL },
});
