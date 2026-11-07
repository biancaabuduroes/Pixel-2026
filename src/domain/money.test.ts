import { describe, expect, it } from "vitest";
import { formatRon, MoneyError, multiplyBani } from "./money";

describe("money", () => {
  it("multiplies integer quantities and bani", () => {
    expect(multiplyBani(3, 10000)).toBe(30000);
  });

  it("rejects floats", () => {
    expect(() => multiplyBani(3, 99.5)).toThrow(MoneyError);
    expect(() => multiplyBani(1.5, 100)).toThrow(MoneyError);
  });

  it("rejects results outside the safe integer range", () => {
    expect(() => multiplyBani(Number.MAX_SAFE_INTEGER, 2)).toThrow(MoneyError);
  });

  it("formats bani as RON", () => {
    expect(formatRon(28500)).toBe("285 RON");
    expect(formatRon(27075)).toBe("270.75 RON");
    expect(formatRon(1425)).toBe("14.25 RON");
    expect(formatRon(5)).toBe("0.05 RON");
    expect(formatRon(-1500)).toBe("-15 RON");
  });
});
