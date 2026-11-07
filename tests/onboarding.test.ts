import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { DEMO_PASSWORD, nationalNumber, stepNumber, TOTAL_STEPS } from "@/lib/onboarding";
import { PreferencesSchema } from "@/server/onboarding";
import { hashPassword, verifyPassword } from "@/server/password";
import { createSessionToken, readSessionToken } from "@/server/session-token";

describe("demo login passwords", () => {
  it("verifies the right password and rejects others", () => {
    const stored = hashPassword("secret-1");
    expect(stored).toMatch(/^scrypt\$[0-9a-f]{32}\$[0-9a-f]{64}$/);
    expect(verifyPassword("secret-1", stored)).toBe(true);
    expect(verifyPassword("secret-2", stored)).toBe(false);
    expect(verifyPassword("secret-1", null)).toBe(false);
    expect(verifyPassword("secret-1", "plain-text")).toBe(false);
  });

  it("the seeded demo users log in with the documented password", () => {
    const hashes = [...readFileSync("prisma/seed.sql", "utf8").matchAll(/'(scrypt\$[^']+)'/g)].map((m) => m[1]);
    expect(hashes).toHaveLength(2);
    for (const h of hashes) expect(verifyPassword(DEMO_PASSWORD, h)).toBe(true);
  });
});

describe("session cookie", () => {
  beforeAll(() => vi.stubEnv("PICKUP_CODE_SECRET", "test-secret"));

  it("round-trips a signed user id", () => {
    expect(readSessionToken(createSessionToken("demo-buyer"))).toBe("demo-buyer");
  });

  it("rejects an edited or unsigned cookie (no impersonation)", () => {
    const token = createSessionToken("demo-buyer");
    expect(readSessionToken(token.replace("demo-buyer", "demo-seller"))).toBeNull();
    expect(readSessionToken("demo-seller")).toBeNull();
    expect(readSessionToken(undefined)).toBeNull();
  });
});

describe("onboarding preferences", () => {
  it("accepts each step's answers on their own", () => {
    expect(PreferencesSchema.safeParse({ firstName: "Ioana", lastName: "", showInitialOnly: true }).success).toBe(true);
    expect(PreferencesSchema.safeParse({ localPreference: "local", categories: ["alimente", "curatenie"] }).success).toBe(true);
    expect(PreferencesSchema.safeParse({ budgetPeriod: "week", budgetBani: 40_000, notifyNearBudget: true }).success).toBe(true);
    expect(PreferencesSchema.safeParse({ address: "Bd. Independenței 5, Iași", radiusKm: 3 }).success).toBe(true);
  });

  it("rejects invalid values", () => {
    expect(PreferencesSchema.safeParse({ categories: [] }).success).toBe(false);
    expect(PreferencesSchema.safeParse({ categories: ["arme"] }).success).toBe(false);
    expect(PreferencesSchema.safeParse({ budgetBani: 400.5 }).success).toBe(false); // money is integer bani
    expect(PreferencesSchema.safeParse({ radiusKm: 4 }).success).toBe(false);
    expect(PreferencesSchema.safeParse({ firstName: "   " }).success).toBe(false);
  });

  it("drops unknown keys instead of storing them", () => {
    expect(PreferencesSchema.parse({ firstName: "Ioana", role: "ADMIN" })).toEqual({ firstName: "Ioana" });
  });

  it("accepts the usual ways of typing a Romanian phone number", () => {
    for (const typed of ["712345678", "712 345 678", "0712345678", "0712 345 678", "+40712345678", "+40 712 345 678", "40712345678"]) {
      expect(nationalNumber(typed)).toBe("712345678");
    }
    expect(nationalNumber("0712")).toBe("0712"); // still typing: not 9 digits yet
  });

  it("orders the 7 steps for the progress bar", () => {
    expect(TOTAL_STEPS).toBe(7);
    expect(stepNumber("telefon")).toBe(1);
    expect(stepNumber("incarca")).toBe(7);
  });
});
