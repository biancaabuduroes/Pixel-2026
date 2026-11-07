import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

// CLAUDE.md: src/domain is pure TypeScript — no Prisma, src/server, src/app or framework imports.
// BUSINESS_LOGIC.md §11: AI output never feeds into pricing, settlement or the wallet.

const DOMAIN = join(__dirname, "../src/domain");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

function importsOf(file: string): string[] {
  const source = readFileSync(file, "utf8");
  return [...source.matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g)].map((m) => m[1]);
}

const FORBIDDEN = [/prisma/i, /^@\/(server|app)\b/, /\/(server|app)(\/|$)/, /^next(\/|$)/, /^react(-dom)?(\/|$)/];

describe("domain boundaries", () => {
  const files = sourceFiles(DOMAIN).map((file) => ({ file: relative(DOMAIN, file), imports: importsOf(file) }));

  it("finds the domain modules", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it("src/domain never imports Prisma, src/server, src/app or the UI framework", () => {
    const violations = files.flatMap(({ file, imports }) =>
      imports.filter((spec) => FORBIDDEN.some((re) => re.test(spec))).map((spec) => `${file} → ${spec}`),
    );
    expect(violations).toEqual([]);
  });

  it("pricing, groups and wallet never import the AI module", () => {
    const violations = files
      .filter(({ file }) => /^(pricing|groups|wallet)\//.test(file) || !file.includes("/"))
      .flatMap(({ file, imports }) => imports.filter((spec) => /(^|\/)ai(\/|$)/.test(spec)).map((spec) => `${file} → ${spec}`));
    expect(violations).toEqual([]);
  });
});
