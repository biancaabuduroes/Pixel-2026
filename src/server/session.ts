import { cookies } from "next/headers";
import { db } from "@/lib/db";
import type { Role } from "@/generated/prisma/enums";

/** Hackathon auth (F1): the demo user switcher stores the user ID in this cookie. DEMO_MODE only. */
export const DEMO_USER_COOKIE = "demoUserId";

export async function currentUser(role: Role): Promise<{ id: string } | null> {
  if (process.env.DEMO_MODE !== "true") return null; // replaced by Supabase Auth in the full MVP
  const id = (await cookies()).get(DEMO_USER_COOKIE)?.value;
  if (!id) return null;
  return db.user.findFirst({ where: { id, role }, select: { id: true } });
}
