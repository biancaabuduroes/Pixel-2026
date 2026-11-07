import { createHmac, timingSafeEqual } from "node:crypto";

// The session cookie holds "<userId>.<signature>", so it can't be edited to impersonate someone.
// Signed with the server secret (PICKUP_CODE_SECRET), using its own label.
function secret(): string {
  const value = process.env.PICKUP_CODE_SECRET;
  if (!value) throw new Error("PICKUP_CODE_SECRET is not set");
  return value;
}

const sign = (userId: string) => createHmac("sha256", secret()).update(`session:${userId}`).digest("base64url");

export function createSessionToken(userId: string): string {
  return `${userId}.${sign(userId)}`;
}

export function readSessionToken(token: string | undefined): string | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const userId = token.slice(0, dot);
  const given = Buffer.from(token.slice(dot + 1));
  const expected = Buffer.from(sign(userId));
  return given.length === expected.length && timingSafeEqual(given, expected) ? userId : null;
}
