-- Seller-defined baskets (decision 2026-11-07): a basket is a Product of kind BASKET with its contents listed.
-- CreateEnum
CREATE TYPE "ProductKind" AS ENUM ('ITEM', 'BASKET');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "kind" "ProductKind" NOT NULL DEFAULT 'ITEM';

-- CreateTable
CREATE TABLE "BasketItem" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "BasketItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BasketItem_productId_position_key" ON "BasketItem"("productId", "position");

-- AddForeignKey
ALTER TABLE "BasketItem" ADD CONSTRAINT "BasketItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Basket item quantities are positive.
ALTER TABLE "BasketItem" ADD CONSTRAINT "BasketItem_quantity_check" CHECK ("quantity" >= 1);
