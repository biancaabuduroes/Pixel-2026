-- Buyer home category chips (decision 2026-11-07, OPEN_QUESTIONS.md). Nullable: existing rows stay valid.
ALTER TABLE "Product" ADD COLUMN "category" TEXT;
