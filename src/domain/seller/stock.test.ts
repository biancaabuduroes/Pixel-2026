import { describe, expect, it } from "vitest";
import { stockStatus, stockUtilizationPct } from "./stock";

describe("stockStatus", () => {
  it("classifies by remaining ratio", () => {
    expect(stockStatus(100, 200)).toBe("OPTIMAL"); // 50%
    expect(stockStatus(40, 200)).toBe("LOW"); // 20%
    expect(stockStatus(10, 200)).toBe("CRITICAL"); // 5%
  });

  it("treats empty stock as CRITICAL", () => {
    expect(stockStatus(0, 0)).toBe("CRITICAL");
  });
});

describe("stockUtilizationPct", () => {
  it("rounds used / total", () => {
    expect(stockUtilizationPct(50, 200)).toBe(75);
    expect(stockUtilizationPct(200, 200)).toBe(0);
    expect(stockUtilizationPct(0, 200)).toBe(100);
  });
});
