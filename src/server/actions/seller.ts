"use server";

import { z } from "zod";
import { confirmPickup } from "../pickup";
import { currentUser } from "../session";

export async function confirmPickupAction(input: unknown) {
  const parsed = z.object({ commitmentId: z.string().min(1).max(64), code: z.string().regex(/^\d{6}$/) }).safeParse(input);
  if (!parsed.success) return { ok: false, reason: "INVALID_INPUT" } as const;
  const seller = await currentUser("SELLER");
  if (!seller) return { ok: false, reason: "UNAUTHORIZED" } as const;
  return confirmPickup({ sellerId: seller.id, ...parsed.data }); // ownership checked in the service
}
