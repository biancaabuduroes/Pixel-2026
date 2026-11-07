"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { cancelCommitment, joinGroup } from "../commitments";
import { savePreferences } from "../onboarding";
import { currentUser } from "../session";
import { topUp } from "../top-up";

// Client input is IDs and quantities only; prices and amounts are calculated on the server.
const id = z.string().min(1).max(64);
const UNAUTHORIZED = { ok: false, reason: "UNAUTHORIZED" } as const;
const INVALID = { ok: false, reason: "INVALID_INPUT" } as const;

export async function joinGroupAction(input: unknown) {
  const parsed = z.object({ groupId: id, quantity: z.number().int().min(1) }).safeParse(input);
  if (!parsed.success) return INVALID;
  const buyer = await currentUser("BUYER");
  if (!buyer) return UNAUTHORIZED;
  return joinGroup({ buyerId: buyer.id, ...parsed.data });
}

export async function cancelCommitmentAction(input: unknown) {
  const parsed = z.object({ commitmentId: id }).safeParse(input);
  if (!parsed.success) return INVALID;
  const buyer = await currentUser("BUYER");
  if (!buyer) return UNAUTHORIZED;
  return cancelCommitment({ buyerId: buyer.id, ...parsed.data }); // ownership checked in the service
}

/** Simulated top-up. `topUpId` is a client-generated UUID so a double click credits once. */
/** Profile edit (B5.1a): display name + preferences only. Email stays read-only. */
export async function updateBuyerProfileAction(input: unknown) {
  const parsed = z
    .object({
      firstName: z.string().trim().min(1).max(50),
      lastName: z.string().trim().max(50),
      phone: z.string().trim().max(20),
    })
    .safeParse(input);
  if (!parsed.success) return INVALID;
  const buyer = await currentUser("BUYER");
  if (!buyer) return UNAUTHORIZED;
  const name = [parsed.data.firstName, parsed.data.lastName].filter(Boolean).join(" ") || parsed.data.firstName;
  await db.user.update({ where: { id: buyer.id }, data: { name } });
  await savePreferences(buyer.id, { firstName: parsed.data.firstName, lastName: parsed.data.lastName, phone: parsed.data.phone });
  return { ok: true as const };
}

export async function topUpAction(input: unknown) {
  // Minimum 10 RON (decision 2026-11-07). The upper bound only protects the integer column.
  const parsed = z.object({ topUpId: z.uuid(), amount: z.number().int().min(1_000).max(10_000_000) }).safeParse(input);
  if (!parsed.success) return INVALID;
  const buyer = await currentUser("BUYER");
  if (!buyer) return UNAUTHORIZED;
  return topUp({ buyerId: buyer.id, ...parsed.data });
}
