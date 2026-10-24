import { describe, expect, it } from "vitest";
import { buildScene, describeScene, WORLDS } from "./scene";
import { DIRECTIONS, MAP_STYLES } from "./styles";

describe("network map scene", () => {
  for (const direction of DIRECTIONS) {
    for (const orient of ["landscape", "portrait"] as const) {
      const s = MAP_STYLES[direction];
      const build = () => buildScene({ seed: s.seed, world: s.worlds[orient], style: s.scene[orient], heavySide: s.heavySide[orient] });

      it(`is deterministic (${direction}, ${orient}): the poster and the live canvas must show one map`, () => {
        expect(build()).toEqual(build());
      });

      it(`keeps every node and route inside its world (${direction}, ${orient})`, () => {
        const scene = build();
        const { w, h } = scene.world;
        for (const n of scene.nodes) {
          expect(n.x).toBeGreaterThanOrEqual(0);
          expect(n.x).toBeLessThanOrEqual(w);
          expect(n.y).toBeGreaterThanOrEqual(0);
          expect(n.y).toBeLessThanOrEqual(h);
        }
        for (const e of scene.edges) {
          expect(e.points.length).toBeGreaterThanOrEqual(2);
          expect(e.length).toBeGreaterThan(0);
        }
      });

      it(`has the relays and players its style asks for (${direction}, ${orient})`, () => {
        const d = describeScene(build());
        expect(d.relays).toBe(s.scene[orient].relays);
        expect(d.players).toBe(s.scene[orient].players);
        expect(d.routes).toBeGreaterThan(d.players);
      });

      it(`stays inside the instance budget of one draw call (${direction}, ${orient})`, () => {
        expect(describeScene(build()).segments).toBeLessThan(1500);
      });
    }
  }

  it("routes a transit map only along axes and 45 degree diagonals", () => {
    const s = MAP_STYLES.b;
    const scene = buildScene({ seed: s.seed, world: s.worlds.landscape, style: s.scene.landscape });
    for (const e of scene.edges) {
      for (let i = 1; i < e.points.length; i++) {
        const dx = Math.abs(e.points[i]![0] - e.points[i - 1]![0]);
        const dy = Math.abs(e.points[i]![1] - e.points[i - 1]![1]);
        const ok = dx < 0.01 || dy < 0.01 || Math.abs(dx - dy) < 0.01;
        expect(ok).toBe(true);
      }
    }
  });

  it("keeps the two worlds at the design sizes the poster images assume", () => {
    expect(WORLDS.landscape).toEqual({ w: 1440, h: 900 });
    expect(WORLDS.portrait).toEqual({ w: 390, h: 844 });
  });
});
