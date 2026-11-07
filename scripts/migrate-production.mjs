// Runs `prisma migrate deploy` before the build, on Vercel production deployments only.
// `migrate deploy` only applies migrations not yet recorded in the database: it never
// resets, drops data or creates new migrations. Credentials are never printed.
import { spawnSync } from "node:child_process";

if (process.env.VERCEL_ENV !== "production") {
  console.log(`[migrate] Skipped: VERCEL_ENV is "${process.env.VERCEL_ENV ?? "unset"}", not "production".`);
  process.exit(0);
}

function fail(message) {
  console.error(`[migrate] ${message}`);
  process.exit(1);
}

const { DIRECT_URL, NEXT_PUBLIC_SUPABASE_URL } = process.env;
if (!DIRECT_URL) fail("DIRECT_URL is not set.");
if (!NEXT_PUBLIC_SUPABASE_URL) fail("NEXT_PUBLIC_SUPABASE_URL is not set.");

// Guard against migrating the wrong Supabase project: the database URL must belong to
// the same project as NEXT_PUBLIC_SUPABASE_URL (https://<ref>.supabase.co).
let projectRef, dbRef;
try {
  projectRef = new URL(NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];
  const db = new URL(DIRECT_URL);
  // Pooler URLs use user "postgres.<ref>"; direct URLs use host "db.<ref>.supabase.co".
  dbRef = decodeURIComponent(db.username).match(/^postgres\.(.+)$/)?.[1] ?? db.hostname.match(/^db\.([^.]+)\.supabase\.co$/)?.[1];
} catch {
  fail("DIRECT_URL or NEXT_PUBLIC_SUPABASE_URL is not a valid URL.");
}
if (!dbRef || dbRef !== projectRef) fail("DIRECT_URL does not point to the Supabase project in NEXT_PUBLIC_SUPABASE_URL. Not migrating.");

console.log(`[migrate] Applying pending migrations to Supabase project ${projectRef}…`);
const result = spawnSync("npx", ["prisma", "migrate", "deploy"], { stdio: "inherit" });
process.exit(result.status ?? 1);
