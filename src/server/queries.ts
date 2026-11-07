import { headers } from "next/headers";
import { db } from "@/lib/db";

/** Orders ready for pickup, with what the buyer needs to find the seller. One query. */
export function buyerOrdersAwaitingPickup(buyerId: string) {
  return db.commitment.findMany({
    where: { buyerId, status: "AWAITING_PICKUP" },
    orderBy: { pickupDeadline: "asc" },
    select: {
      id: true,
      quantity: true,
      amountCharged: true,
      pickupDeadline: true,
      product: { select: { name: true, pickupLocation: { select: { name: true, address: true, openingHours: true } } } },
    },
  });
}

/** The seller's orders waiting for pickup (never the code). One query. Optional group filter. */
export function sellerOrdersAwaitingPickup(sellerId: string, groupId?: string) {
  return db.commitment.findMany({
    where: { status: "AWAITING_PICKUP", product: { sellerId }, ...(groupId ? { groupId } : {}) },
    orderBy: { pickupDeadline: "asc" },
    select: { id: true, quantity: true, amountCharged: true, pickupDeadline: true, buyer: { select: { name: true } }, product: { select: { name: true } } },
  });
}

/** This deployment's own origin, so the QR link works on localhost, previews and production. */
export async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
