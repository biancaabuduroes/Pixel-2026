"use client";

import { useQuery } from "@tanstack/react-query";
import type { GroupOffer } from "@/domain/ai";

export type GroupProgressJson = { status: string; buyers: number; offer: GroupOffer };

/** Modest polling interval for group progress (the only live data in the buyer flow). */
export const PROGRESS_POLL_MS = 10_000;

/** Live progress of one group, seeded with the server-rendered values. */
export function useGroupProgress(groupId: string, initial: GroupProgressJson) {
  const { data } = useQuery({
    queryKey: ["group-progress", groupId],
    queryFn: async (): Promise<GroupProgressJson> => {
      const res = await fetch(`/api/groups/${encodeURIComponent(groupId)}/progress`, { cache: "no-store" });
      if (!res.ok) throw new Error(`progress ${res.status}`);
      return res.json();
    },
    initialData: initial,
    refetchInterval: PROGRESS_POLL_MS,
  });
  return data;
}
