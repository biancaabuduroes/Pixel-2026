import { HOUR_MS, type GroupState } from "./types";

export const T0 = new Date("2026-11-07T10:00:00Z");
export const at = (hours: number) => new Date(T0.getTime() + hours * HOUR_MS);

export function openGroup(overrides: Partial<GroupState> = {}): GroupState {
  return { status: "OPEN", durationHours: 24, opensAt: T0, closesAt: at(24), totalQty: 0, ...overrides };
}
