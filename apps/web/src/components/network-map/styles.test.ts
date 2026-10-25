import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { DIRECTIONS, MAP_STYLES } from "./styles";

const css = readFileSync(fileURLToPath(new URL("../../../../../packages/tokens/directions.css", import.meta.url)), "utf8");

describe("map styles", () => {
  it("only name colour variables that every direction defines", () => {
    for (const d of DIRECTIONS) {
      // directions.css holds one palette per direction the spec lists (today only A, which is also
      // :root); a direction without its own block inherits :root, so that is the block it resolves to.
      const own = css.indexOf(`[data-direction="${d}"] {`);
      const start = own !== -1 ? own : css.indexOf(":root,");
      expect(start, `a palette block for direction ${d}`).toBeGreaterThan(-1);
      const block = css.slice(start, css.indexOf("}", start));
      for (const name of Object.values(MAP_STYLES[d].palette)) {
        expect(block, `${name} in direction ${d}`).toContain(`${name}:`);
      }
    }
  });

  it("respects the budget the page promises: at most 1.3 million pixels and 40 frames per second", () => {
    for (const d of DIRECTIONS) {
      expect(MAP_STYLES[d].maxPixels).toBeLessThanOrEqual(1_300_000);
      expect(MAP_STYLES[d].fpsCap).toBeLessThanOrEqual(40);
    }
  });
});
