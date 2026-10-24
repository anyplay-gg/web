import { describe, expect, it } from "vitest";
import { WORDMARK_PATHS } from "./wordmark-paths.generated";

describe("wordmark outlines", () => {
  it("has the seven letters of AnyPlay for every direction", () => {
    for (const d of ["a", "b", "c"] as const) {
      expect(WORDMARK_PATHS[d].glyphs.map((g) => g.char).join("")).toBe("AnyPlay");
      for (const g of WORDMARK_PATHS[d].glyphs) expect(g.d.length).toBeGreaterThan(20);
    }
  });
  it("sets the letters in order", () => {
    for (const d of ["a", "b", "c"] as const) {
      const g = WORDMARK_PATHS[d].glyphs;
      for (let i = 1; i < g.length; i++) expect(g[i]!.x).toBeGreaterThan(g[i - 1]!.x);
    }
  });
});
