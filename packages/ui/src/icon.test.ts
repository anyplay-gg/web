import { describe, expect, it } from "vitest";
import { strokeFor } from "./icon";

describe("icon stroke", () => {
  it("renders the same weight at every size: 1.5px beside regular text, 2px beside semibold", () => {
    for (const size of [16, 20, 24, 32]) {
      expect((strokeFor(size, "regular") * size) / 24).toBeCloseTo(1.5, 1);
      expect((strokeFor(size, "semibold") * size) / 24).toBeCloseTo(2, 1);
    }
  });
  it("caps the stroke where the shapes cannot carry it", () => {
    expect(strokeFor(10, "semibold")).toBe(3);
  });
});
