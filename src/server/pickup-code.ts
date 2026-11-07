import { createHmac, timingSafeEqual } from "node:crypto";

// The 6-digit pickup code is derived from a server secret and the commitment ID, so the
// buyer can see it any time without it being stored. Only an HMAC of the code is stored.
function secret(): string {
  const value = process.env.PICKUP_CODE_SECRET;
  if (!value) throw new Error("PICKUP_CODE_SECRET is not set");
  return value;
}

export function pickupCodeFor(commitmentId: string): string {
  const digest = createHmac("sha256", secret()).update(`code:${commitmentId}`).digest();
  return String(digest.readUInt32BE(0) % 1_000_000).padStart(6, "0");
}

export function hashPickupCode(commitmentId: string, code: string): string {
  return createHmac("sha256", secret()).update(`hash:${commitmentId}:${code}`).digest("hex");
}

export function isPickupCodeCorrect(commitmentId: string, code: string, storedHash: string): boolean {
  const actual = Buffer.from(hashPickupCode(commitmentId, code));
  const expected = Buffer.from(storedHash);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
