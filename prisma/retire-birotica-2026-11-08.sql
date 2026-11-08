-- One-off data change (approved 2026-11-08): Birotică keeps only the blue pens, the agenda and staples.
-- The 15 other birotica products are RETIRED, not deleted: the ledger is append-only, so their
-- reserved money is released with normal RELEASE transactions, their orders and open groups are
-- cancelled and the products set INACTIVE (hidden everywhere). Idempotent: a re-run finds nothing ACTIVE.
BEGIN;

CREATE TEMP TABLE retired (id text PRIMARY KEY) ON COMMIT DROP;
INSERT INTO retired VALUES
  ('seed-banda'), ('seed-biblioraft'), ('seed-caiet-dictando'), ('seed-caiet-mate'), ('seed-capsator'),
  ('seed-creion-hb'), ('seed-dosar'), ('seed-marker-evid'), ('seed-foarfeca'), ('seed-folii'),
  ('seed-hartie-a4'), ('seed-hartie-a4-rec'), ('seed-hartie-a5'), ('seed-marker-perm'), ('seed-notes'),
  -- Added 2026-11-08 (no photo): black and red pens.
  ('seed-pix-negru'), ('seed-pix-rosu');

CREATE TEMP TABLE releases ON COMMIT DROP AS
SELECT c.id AS commitment_id, c."groupId" AS group_id, c."buyerId" AS buyer_id, c."reservedAmount" AS amount,
       gen_random_uuid()::text AS tx_id
FROM "Commitment" c JOIN retired r ON r.id = c."productId"
WHERE c.status = 'ACTIVE';

-- Same shape as src/domain/wallet releaseTransaction: reserved → available, sums to 0.
INSERT INTO "LedgerTransaction" (id, "operationId", type, "commitmentId", "groupId", "createdAt")
SELECT tx_id, 'release:' || commitment_id, 'RELEASE', commitment_id, group_id, now() AT TIME ZONE 'UTC' FROM releases;

INSERT INTO "LedgerEntry" (id, "transactionId", "accountId", amount)
SELECT gen_random_uuid()::text, r.tx_id, a.id, -r.amount
FROM releases r JOIN "LedgerAccount" a ON a."ownerUserId" = r.buyer_id AND a.type = 'BUYER_RESERVED' AND a.currency = 'RON'
UNION ALL
SELECT gen_random_uuid()::text, r.tx_id, a.id, r.amount
FROM releases r JOIN "LedgerAccount" a ON a."ownerUserId" = r.buyer_id AND a.type = 'BUYER_AVAILABLE' AND a.currency = 'RON';

UPDATE "Commitment" SET status = 'CANCELLED', "updatedAt" = now() AT TIME ZONE 'UTC'
WHERE id IN (SELECT commitment_id FROM releases);

UPDATE "Group" SET status = 'CANCELLED', "totalQty" = 0
WHERE status = 'OPEN' AND "productId" IN (SELECT id FROM retired);

UPDATE "Product" SET status = 'INACTIVE' WHERE id IN (SELECT id FROM retired);

COMMIT;
