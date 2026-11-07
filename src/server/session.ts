import { cookies } from "next/headers";
import { db } from "@/lib/db";
import type { Role } from "@/generated/prisma/enums";
import { createSessionToken, readSessionToken } from "./session-token";

/** Hackathon auth: the 2 demo users log in with a password (or the mocked phone code). DEMO_MODE only. */
export const SESSION_COOKIE = "bd_session";
/** Set once onboarding is finished or skipped (src/proxy.ts sends new visitors to /onboarding). */
export const ONBOARDING_COOKIE = "bd_onboarding_done";

const YEAR = 60 * 60 * 24 * 365;

export async function startSession(userId: string): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, createSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function markOnboardingDone(): Promise<void> {
  (await cookies()).set(ONBOARDING_COOKIE, "1", { sameSite: "lax", path: "/", maxAge: YEAR });
}

async function sessionUserId(): Promise<string | null> {
  if (process.env.DEMO_MODE !== "true") return null; // replaced by Supabase Auth in the full MVP
  return readSessionToken((await cookies()).get(SESSION_COOKIE)?.value);
}

/** The signed-in user if they have this role; one query. */
export async function currentUser(role: Role): Promise<{ id: string } | null> {
  const id = await sessionUserId();
  if (!id) return null;
  return db.user.findFirst({ where: { id, role }, select: { id: true } });
}

/** The signed-in user of any role, with what the home screen shows; one query. */
export async function currentProfile() {
  const id = await sessionUserId();
  if (!id) return null;
  return db.user.findUnique({ where: { id }, select: { id: true, name: true, role: true, preferences: true } });
}
