-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('BUYER', 'SELLER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "GroupStatus" AS ENUM ('OPEN', 'SETTLING', 'SETTLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CommitmentStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'AWAITING_PICKUP', 'COLLECTED', 'EXPIRED_PAID', 'DISPUTED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "LedgerAccountType" AS ENUM ('BUYER_AVAILABLE', 'BUYER_RESERVED', 'PENDING_PICKUP', 'SELLER_EARNINGS', 'PLATFORM_REVENUE', 'EXTERNAL_FUNDING');

-- CreateEnum
CREATE TYPE "LedgerTransactionType" AS ENUM ('TOPUP', 'RESERVE', 'RELEASE', 'SETTLE', 'PAYOUT', 'REFUND');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerProfile" (
    "userId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,

    CONSTRAINT "SellerProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "PickupLocation" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "openingHours" TEXT NOT NULL,

    CONSTRAINT "PickupLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "pickupLocationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT,
    "stockTotal" INTEGER NOT NULL,
    "perBuyerCap" INTEGER NOT NULL,
    "pickupDeadlineDays" INTEGER NOT NULL DEFAULT 7,
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceTier" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "minQty" INTEGER NOT NULL,
    "unitPrice" INTEGER NOT NULL,

    CONSTRAINT "PriceTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductDuration" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "durationHours" INTEGER NOT NULL,

    CONSTRAINT "ProductDuration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "durationHours" INTEGER NOT NULL,
    "opensAt" TIMESTAMP(3) NOT NULL,
    "closesAt" TIMESTAMP(3) NOT NULL,
    "status" "GroupStatus" NOT NULL DEFAULT 'OPEN',
    "totalQty" INTEGER NOT NULL DEFAULT 0,
    "finalUnitPrice" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commitment" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "committedUnitPrice" INTEGER NOT NULL,
    "reservedAmount" INTEGER NOT NULL,
    "finalUnitPrice" INTEGER,
    "amountCharged" INTEGER,
    "status" "CommitmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "pickupCodeHash" TEXT,
    "pickupDeadline" TIMESTAMP(3),
    "failedCodeAttempts" INTEGER NOT NULL DEFAULT 0,
    "codeLockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Commitment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JoinEvent" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "simulated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JoinEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerAccount" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT,
    "type" "LedgerAccountType" NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RON',

    CONSTRAINT "LedgerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerTransaction" (
    "id" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "type" "LedgerTransactionType" NOT NULL,
    "commitmentId" TEXT,
    "groupId" TEXT,
    "topUpId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "PickupLocation_sellerId_idx" ON "PickupLocation"("sellerId");

-- CreateIndex
CREATE INDEX "Product_sellerId_idx" ON "Product"("sellerId");

-- CreateIndex
CREATE UNIQUE INDEX "PriceTier_productId_minQty_key" ON "PriceTier"("productId", "minQty");

-- CreateIndex
CREATE UNIQUE INDEX "ProductDuration_productId_durationHours_key" ON "ProductDuration"("productId", "durationHours");

-- CreateIndex
CREATE INDEX "Group_status_closesAt_idx" ON "Group"("status", "closesAt");

-- CreateIndex
CREATE UNIQUE INDEX "Group_one_open_per_duration" ON "Group"("productId", "durationHours") WHERE ("status" = 'OPEN');

-- CreateIndex
CREATE UNIQUE INDEX "Group_id_productId_key" ON "Group"("id", "productId");

-- CreateIndex
CREATE INDEX "Commitment_groupId_status_idx" ON "Commitment"("groupId", "status");

-- CreateIndex
CREATE INDEX "Commitment_productId_status_idx" ON "Commitment"("productId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Commitment_one_active_per_product" ON "Commitment"("buyerId", "productId") WHERE ("status" = 'ACTIVE');

-- CreateIndex
CREATE INDEX "JoinEvent_groupId_createdAt_idx" ON "JoinEvent"("groupId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerAccount_ownerUserId_type_currency_key" ON "LedgerAccount"("ownerUserId", "type", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerAccount_one_system_account" ON "LedgerAccount"("type", "currency") WHERE ("ownerUserId" IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "LedgerTransaction_operationId_key" ON "LedgerTransaction"("operationId");

-- CreateIndex
CREATE INDEX "LedgerTransaction_commitmentId_idx" ON "LedgerTransaction"("commitmentId");

-- CreateIndex
CREATE INDEX "LedgerEntry_accountId_idx" ON "LedgerEntry"("accountId");

-- CreateIndex
CREATE INDEX "LedgerEntry_transactionId_idx" ON "LedgerEntry"("transactionId");

-- AddForeignKey
ALTER TABLE "SellerProfile" ADD CONSTRAINT "SellerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupLocation" ADD CONSTRAINT "PickupLocation_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_pickupLocationId_fkey" FOREIGN KEY ("pickupLocationId") REFERENCES "PickupLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceTier" ADD CONSTRAINT "PriceTier_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductDuration" ADD CONSTRAINT "ProductDuration_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commitment" ADD CONSTRAINT "Commitment_groupId_productId_fkey" FOREIGN KEY ("groupId", "productId") REFERENCES "Group"("id", "productId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commitment" ADD CONSTRAINT "Commitment_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commitment" ADD CONSTRAINT "Commitment_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JoinEvent" ADD CONSTRAINT "JoinEvent_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerAccount" ADD CONSTRAINT "LedgerAccount_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerTransaction" ADD CONSTRAINT "LedgerTransaction_commitmentId_fkey" FOREIGN KEY ("commitmentId") REFERENCES "Commitment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "LedgerTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- ─── Integrity rules Prisma can't express (DATA_MODEL.md, BUSINESS_LOGIC.md) ───

-- Value checks
ALTER TABLE "Product" ADD CONSTRAINT "Product_stockTotal_check" CHECK ("stockTotal" >= 0),
  ADD CONSTRAINT "Product_perBuyerCap_check" CHECK ("perBuyerCap" >= 1),
  ADD CONSTRAINT "Product_pickupDeadlineDays_check" CHECK ("pickupDeadlineDays" >= 1);
ALTER TABLE "PriceTier" ADD CONSTRAINT "PriceTier_minQty_check" CHECK ("minQty" >= 1),
  ADD CONSTRAINT "PriceTier_unitPrice_check" CHECK ("unitPrice" > 0);
ALTER TABLE "ProductDuration" ADD CONSTRAINT "ProductDuration_durationHours_check" CHECK ("durationHours" >= 1);
ALTER TABLE "Group" ADD CONSTRAINT "Group_window_check" CHECK ("closesAt" > "opensAt"),
  ADD CONSTRAINT "Group_durationHours_check" CHECK ("durationHours" >= 1),
  ADD CONSTRAINT "Group_totalQty_check" CHECK ("totalQty" >= 0),
  ADD CONSTRAINT "Group_finalUnitPrice_check" CHECK ("finalUnitPrice" IS NULL OR "finalUnitPrice" > 0);
ALTER TABLE "JoinEvent" ADD CONSTRAINT "JoinEvent_quantity_check" CHECK ("quantity" >= 1);

-- Commitment money rules: reserved = quantity × committed price; never pay more than committed.
ALTER TABLE "Commitment" ADD CONSTRAINT "Commitment_quantity_check" CHECK ("quantity" >= 1),
  ADD CONSTRAINT "Commitment_committedUnitPrice_check" CHECK ("committedUnitPrice" > 0),
  ADD CONSTRAINT "Commitment_reservedAmount_check" CHECK ("reservedAmount" = "quantity" * "committedUnitPrice"),
  ADD CONSTRAINT "Commitment_finalUnitPrice_check" CHECK ("finalUnitPrice" IS NULL OR ("finalUnitPrice" > 0 AND "finalUnitPrice" <= "committedUnitPrice")),
  ADD CONSTRAINT "Commitment_amountCharged_check" CHECK ("amountCharged" IS NULL OR ("amountCharged" > 0 AND "amountCharged" <= "reservedAmount")),
  ADD CONSTRAINT "Commitment_failedCodeAttempts_check" CHECK ("failedCodeAttempts" >= 0),
  -- After settlement every commitment has its final price, charge, code hash and deadline.
  ADD CONSTRAINT "Commitment_settled_fields_check" CHECK (
    "status" IN ('ACTIVE', 'CANCELLED')
    OR ("finalUnitPrice" IS NOT NULL AND "amountCharged" IS NOT NULL AND "pickupCodeHash" IS NOT NULL AND "pickupDeadline" IS NOT NULL)
  );

-- Ledger accounts: user accounts have an owner, system accounts don't.
ALTER TABLE "LedgerAccount" ADD CONSTRAINT "LedgerAccount_owner_check" CHECK (
  ("type" IN ('PLATFORM_REVENUE', 'EXTERNAL_FUNDING')) = ("ownerUserId" IS NULL)
);
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_amount_check" CHECK ("amount" <> 0);

-- Append-only ledger: rows can be inserted, never updated or deleted.
CREATE FUNCTION ledger_append_only() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'The ledger is append-only: % on % is not allowed', TG_OP, TG_TABLE_NAME;
END $$;
CREATE TRIGGER "LedgerTransaction_append_only" BEFORE UPDATE OR DELETE ON "LedgerTransaction"
  FOR EACH ROW EXECUTE FUNCTION ledger_append_only();
CREATE TRIGGER "LedgerEntry_append_only" BEFORE UPDATE OR DELETE ON "LedgerEntry"
  FOR EACH ROW EXECUTE FUNCTION ledger_append_only();

-- Each ledger transaction has ≥ 2 entries summing to 0, checked when the DB transaction commits.
CREATE FUNCTION ledger_transaction_balanced() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  tx_id TEXT;
  entry_count INTEGER;
  entry_sum BIGINT;
BEGIN
  -- Each branch only reads a column that exists on that table.
  IF TG_TABLE_NAME = 'LedgerEntry' THEN
    tx_id := NEW."transactionId";
  ELSE
    tx_id := NEW."id";
  END IF;
  SELECT COUNT(*), COALESCE(SUM("amount"), 0) INTO entry_count, entry_sum
    FROM "LedgerEntry" WHERE "transactionId" = tx_id;
  IF entry_count < 2 OR entry_sum <> 0 THEN
    RAISE EXCEPTION 'Ledger transaction % is unbalanced: % entries summing to %', tx_id, entry_count, entry_sum;
  END IF;
  RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER "LedgerEntry_balanced" AFTER INSERT ON "LedgerEntry"
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ledger_transaction_balanced();
CREATE CONSTRAINT TRIGGER "LedgerTransaction_balanced" AFTER INSERT ON "LedgerTransaction"
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ledger_transaction_balanced();
