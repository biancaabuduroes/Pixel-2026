import { z } from "zod";
import { db } from "@/lib/db";
import { BUDGET, CATEGORIES, LOCAL_PREFERENCE, RADIUS_KM } from "@/lib/onboarding";

const values = <T extends readonly { value: string }[]>(options: T) => options.map((o) => o.value) as [T[number]["value"], ...T[number]["value"][]];

/**
 * Onboarding answers stored in User.preferences (JSON). Display/recommendation hints only:
 * nothing here feeds prices, settlement or the wallet. Budget is integer bani.
 */
export const PreferencesSchema = z
  .object({
    firstName: z.string().trim().min(1).max(50),
    lastName: z.string().trim().max(50),
    showInitialOnly: z.boolean(),
    localPreference: z.enum(values(LOCAL_PREFERENCE)),
    categories: z.array(z.enum(values(CATEGORIES))).min(1).max(CATEGORIES.length),
    budgetPeriod: z.enum(["week", "month"]),
    budgetBani: z.number().int().min(BUDGET.week.min * 100).max(BUDGET.month.max * 100),
    notifyNearBudget: z.boolean(),
    address: z.string().trim().min(1).max(120),
    radiusKm: z.union(RADIUS_KM.map((r) => z.literal(r)) as [z.ZodLiteral<1>, z.ZodLiteral<3>, z.ZodLiteral<5>, z.ZodLiteral<10>]),
  })
  .partial();

export type Preferences = z.infer<typeof PreferencesSchema>;

/** Merges validated answers into the buyer's preferences in one UPDATE (Postgres jsonb ||). */
export async function savePreferences(userId: string, answers: Preferences): Promise<void> {
  await db.$executeRaw`
    UPDATE "User" SET "preferences" = COALESCE("preferences", '{}'::jsonb) || ${JSON.stringify(answers)}::jsonb
    WHERE id = ${userId} AND role = 'BUYER'`;
}
