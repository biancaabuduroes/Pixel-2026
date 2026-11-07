import { describe, expect, it } from "vitest";
import { dayLabel, formatToken, inDuration, initials, orderRef, priceNumber, units } from "./format";

describe("display formatting", () => {
  it("formats prices and bunToken from bani", () => {
    expect(priceNumber(10499)).toBe("104,99");
    expect(formatToken(9499)).toBe("94,99 bunToken");
    expect(formatToken(160000)).toBe("1.600 bunToken");
  });

  it("pluralises units", () => {
    expect(units(1)).toBe("1 unitate");
    expect(units(3)).toBe("3 unități");
  });

  it("labels days relative to now (Bucharest time)", () => {
    const now = new Date("2026-11-07T10:00:00Z"); // Saturday
    expect(dayLabel(new Date("2026-11-07T20:00:00Z"), now)).toBe("azi");
    expect(dayLabel(new Date("2026-11-08T10:00:00Z"), now)).toBe("mâine");
    expect(dayLabel(new Date("2026-11-10T10:00:00Z"), now)).toBe("marți");
    expect(dayLabel(new Date("2026-11-20T10:00:00Z"), now)).toBe("20 noiembrie");
  });

  it("describes remaining time in Romanian", () => {
    expect(inDuration(5 * 60_000)).toBe("în 5 minute");
    expect(inDuration(20 * 60 * 60_000)).toBe("în 20 de ore");
    expect(inDuration(3 * 24 * 60 * 60_000)).toBe("în 3 zile");
    expect(inDuration(60 * 60_000)).toBe("în 1 oră");
  });

  it("builds order refs and initials", () => {
    expect(orderRef("3f2a9c1e-0000-4000-8000-00000048213a")).toBe("CL-48213A");
    expect(initials("Ioana Popescu")).toBe("IP");
  });
});
