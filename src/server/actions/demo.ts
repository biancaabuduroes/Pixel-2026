"use server";

import { z } from "zod";
import { settleGroup } from "../settlement";
import { currentUser } from "../session";

/** Demo panel (F11, DEMO_MODE only via currentUser): close a group now with the real settlement code. */
export async function closeGroupNowAction(input: unknown) {
  const parsed = z.object({ groupId: z.string().min(1).max(64) }).safeParse(input);
  if (!parsed.success) return { ok: false, reason: "INVALID_INPUT" } as const;
  const admin = await currentUser("ADMIN");
  if (!admin) return { ok: false, reason: "UNAUTHORIZED" } as const;
  return settleGroup({ groupId: parsed.data.groupId, closeNow: true });
}
