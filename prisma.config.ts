import { existsSync } from "node:fs";
import { defineConfig, env } from "prisma/config";

// Locally, read .env.local (Next.js convention). In the cloud/Vercel the variables are already set.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // Migrations use the direct (non-pooled) connection.
  datasource: { url: env("DIRECT_URL") },
});
