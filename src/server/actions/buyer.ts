"use server";

import { z } from "zod";
import { cancelCommitment, joinGroup } from "../commitments";
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
export async function topUpAction(input: unknown) {
  // Minimum 10 RON (decision 2026-11-07). The upper bound only protects the integer column.
  const parsed = z.object({ topUpId: z.uuid(), amount: z.number().int().min(1_000).max(10_000_000) }).safeParse(input);
  if (!parsed.success) return INVALID;
  const buyer = await currentUser("BUYER");
  if (!buyer) return UNAUTHORIZED;
  return topUp({ buyerId: buyer.id, ...parsed.data });
}
