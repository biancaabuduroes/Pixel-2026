import { describe, expect, it } from "vitest";
import { assertTransition, canTransition, isPickupExpired, pickupDeadline } from "./commitment";
import { at } from "./fixtures";

describe("commitment lifecycle", () => {
  it("allows the BL §10 transitions", () => {
    expect(canTransition("ACTIVE", "CANCELLED")).toBe(true);
    expect(canTransition("ACTIVE", "AWAITING_PICKUP")).toBe(true);
    expect(canTransition("AWAITING_PICKUP", "COLLECTED")).toBe(true);
    expect(canTransition("AWAITING_PICKUP", "EXPIRED_PAID")).toBe(true);
    expect(canTransition("AWAITING_PICKUP", "DISPUTED")).toBe(true);
    expect(canTransition("DISPUTED", "REFUNDED")).toBe(true);
  });

  it("rejects everything else", () => {
    expect(canTransition("AWAITING_PICKUP", "CANCELLED")).toBe(false);
    expect(canTransition("COLLECTED", "REFUNDED")).toBe(false);
    expect(canTransition("CANCELLED", "ACTIVE")).toBe(false);
    expect(() => assertTransition("COLLECTED", "ACTIVE")).toThrow();
  });
});

describe("pickup deadline", () => {
  it("is closesAt + N calendar days", () => {
    expect(pickupDeadline(at(24), 7)).toEqual(at(24 + 7 * 24));
    expect(() => pickupDeadline(at(24), 0)).toThrow();
  });

  it("expires only after the deadline, and only while awaiting pickup", () => {
    const deadline = at(100);
    expect(isPickupExpired("AWAITING_PICKUP", deadline, at(100))).toBe(false);
    expect(isPickupExpired("AWAITING_PICKUP", deadline, at(100.01))).toBe(true);
    expect(isPickupExpired("COLLECTED", deadline, at(200))).toBe(false);
  });
});
