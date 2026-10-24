import { describe, expect, it } from "vitest";
import { HERO, MAP_NOTE, PROOF } from "./copy";

const all = [MAP_NOTE, ...PROOF.flatMap((p) => [p.title, p.text]), ...Object.values(HERO).flatMap((h) => Object.values(h))];

describe("landing copy", () => {
  it("has no exclamation marks", () => {
    for (const s of all) expect(s).not.toContain("!");
  });
  it("names no platform and no game: the clean line", () => {
    // "AnyPS5" is the product's own name and is allowed; a bare platform or maker name is not.
    const banned = /playstation|sony|xbox|nintendo|trophy name/i;
    for (const s of all) expect(s.replace(/AnyPS5/g, "")).not.toMatch(banned);
  });
  it("starts every button with a verb", () => {
    for (const h of Object.values(HERO)) {
      for (const b of [h.primary, h.secondary]) expect(b).toMatch(/^(Download|Read|View|Sign|Create|Open|Get)\b/);
    }
  });
});
