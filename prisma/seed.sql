-- BunDeals demo users (approved 2026-11-07). Idempotent: safe to run more than once.
-- Run once against the demo database after the migrations (a Claude session uses the Supabase
-- Management API; locally: psql "$DIRECT_URL" -f prisma/seed.sql). Never run during the Vercel build.
-- Password for both: bundeals2026 (scrypt, see src/server/password.ts).

INSERT INTO "User" (id, email, name, role, "passwordHash") VALUES
  ('demo-buyer', 'cumparator@bundeals.ro', 'Ioana Popescu', 'BUYER', 'scrypt$48af0a88f51f103d0a6aece9475110f7$d927d578688d3a2910337053eba6ebb3b0f67f735d73e7ba0c05a91072d47662'),
  ('demo-seller', 'vanzator@bundeals.ro', 'Brutăria Ana', 'SELLER', 'scrypt$90c8ad17b7be205838b4f7485d74432a$23952c4f9d91be6b574b0988945c7457bd66d2572f93d45718785e77a55c0625')
ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, "passwordHash" = EXCLUDED."passwordHash";

INSERT INTO "SellerProfile" ("userId", "businessName")
SELECT id, 'Brutăria Ana' FROM "User" WHERE email = 'vanzator@bundeals.ro'
ON CONFLICT ("userId") DO NOTHING;
