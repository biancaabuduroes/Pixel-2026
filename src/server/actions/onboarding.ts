"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { DEMO_BUYER_EMAIL } from "@/lib/onboarding";
import { PreferencesSchema, savePreferences } from "../onboarding";
import { verifyPassword } from "../password";
import { currentUser, endSession, markOnboardingDone, startSession } from "../session";

/** B1.2b mock: any 6 digits "verify" the phone and sign in as the demo buyer. No SMS is sent. */
export async function verifyPhoneCodeAction(input: unknown) {
  if (!z.object({ code: z.string().regex(/^\d{6}$/) }).safeParse(input).success) return { ok: false, reason: "INVALID_CODE" } as const;
  if (process.env.DEMO_MODE !== "true") return { ok: false, reason: "UNAVAILABLE" } as const;
  const buyer = await db.user.findUnique({ where: { email: DEMO_BUYER_EMAIL }, select: { id: true } });
  if (!buyer) return { ok: false, reason: "DEMO_USERS_MISSING" } as const;
  await startSession(buyer.id);
  return { ok: true } as const;
}

/** Saves one onboarding step's answers for the signed-in buyer. */
export async function savePreferencesAction(input: unknown) {
  const parsed = PreferencesSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "INVALID_INPUT" } as const;
  const buyer = await currentUser("BUYER");
  if (!buyer) return { ok: false, reason: "UNAUTHORIZED" } as const;
  await savePreferences(buyer.id, parsed.data);
  return { ok: true } as const;
}

/** Finishes (or skips the rest of) onboarding: remembered in a cookie, then home. */
export async function completeOnboardingAction() {
  await markOnboardingDone();
  redirect("/");
}

/** "Am deja cont": demo login with email + password. */
export async function loginAction(input: unknown) {
  const parsed = z.object({ email: z.email().max(120), password: z.string().min(1).max(200) }).safeParse(input);
  if (!parsed.success) return { ok: false, reason: "INVALID_INPUT" } as const;
  if (process.env.DEMO_MODE !== "true") return { ok: false, reason: "UNAVAILABLE" } as const;
  const user = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase() }, select: { id: true, passwordHash: true } });
  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) return { ok: false, reason: "WRONG_CREDENTIALS" } as const;
  await startSession(user.id);
  await markOnboardingDone();
  redirect("/");
}

export async function logoutAction() {
  await endSession();
  redirect("/autentificare");
}
