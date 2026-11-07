import { CURRENCY, type Currency } from "../money";

/** BL §9 ledger accounts. */
export type AccountType =
  | "BUYER_AVAILABLE"
  | "BUYER_RESERVED"
  | "PENDING_PICKUP"
  | "SELLER_EARNINGS"
  | "PLATFORM_REVENUE"
  | "EXTERNAL_FUNDING";

/** Identifies one ledger account. System accounts have no owner. */
export interface AccountRef {
  type: AccountType;
  ownerId: string | null;
  currency: Currency;
}

const user = (type: AccountType) => (ownerId: string): AccountRef => ({ type, ownerId, currency: CURRENCY });

export const buyerAvailable = user("BUYER_AVAILABLE");
export const buyerReserved = user("BUYER_RESERVED");
export const pendingPickup = user("PENDING_PICKUP");
export const sellerEarnings = user("SELLER_EARNINGS");
export const PLATFORM_REVENUE: AccountRef = { type: "PLATFORM_REVENUE", ownerId: null, currency: CURRENCY };
export const EXTERNAL_FUNDING: AccountRef = { type: "EXTERNAL_FUNDING", ownerId: null, currency: CURRENCY };

/** Stable string key, e.g. "BUYER_AVAILABLE:user_1:RON". */
export function accountKey(account: AccountRef): string {
  return `${account.type}:${account.ownerId ?? "system"}:${account.currency}`;
}
