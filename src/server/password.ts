import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// Demo login passwords, hashed with Node's built-in scrypt (no extra dependency).
// Stored as "scrypt$<salt hex>$<hash hex>".
const KEY_LENGTH = 32;

export function hashPassword(password: string, salt = randomBytes(16).toString("hex")): string {
  return `scrypt$${salt}$${scryptSync(password, salt, KEY_LENGTH).toString("hex")}`;
}

export function verifyPassword(password: string, stored: string | null): boolean {
  const [scheme, salt, hash] = stored?.split("$") ?? [];
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const actual = scryptSync(password, salt, KEY_LENGTH);
  const expected = Buffer.from(hash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
