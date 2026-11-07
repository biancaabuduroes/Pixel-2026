"use server";

import { z } from "zod";
import { db } from "@/lib/db";
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

/**
 * Demo button on the buyer's order card: closes the buyer's group now so the order moves from
 * "În grup" (ACTIVE) to "Gata de ridicare" (AWAITING_PICKUP). Same settlement code as closing
 * time (BL §7), so the whole group settles for every buyer in it. DEMO_MODE only (currentUser).
 */
export async function closeMyGroupNowAction(input: unknown) {
  const parsed = z.object({ commitmentId: z.string().min(1).max(64) }).safeParse(input);
  if (!parsed.success) return { ok: false, reason: "INVALID_INPUT" } as const;
  const buyer = await currentUser("BUYER");
  if (!buyer) return { ok: false, reason: "UNAUTHORIZED" } as const;
  const commitment = await db.commitment.findFirst({
    where: { id: parsed.data.commitmentId, buyerId: buyer.id, status: "ACTIVE" },
    select: { groupId: true },
  });
  if (!commitment) return { ok: false, reason: "NOT_FOUND" } as const;
  return settleGroup({ groupId: commitment.groupId, closeNow: true });
}
