import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

// Smoke test: proves Vitest runs and resolves the "@/" alias.
describe("project setup", () => {
  it("resolves @/ imports", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});
