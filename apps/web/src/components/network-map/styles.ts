// SPDX-License-Identifier: AGPL-3.0-only
//
// The three looks of the network map (checkpoint 1). One scene generator, one renderer, three
// presets: what changes is routing, line weight, how light is drawn and which colour roles are used.
// Colours are never written here, only the NAMES of the token variables, so the picture follows
// the tokens: change a palette and the map changes with it.

import type { QuietZone, SceneStyle, World } from "./scene";
import { WORLDS } from "./scene";

export type Direction = "a" | "b" | "c";
export const DIRECTIONS: readonly Direction[] = ["a", "b", "c"];

export interface MapStyle {
  render: "glow" | "ink" | "dither";
  seed: number;
  scene: { landscape: SceneStyle; portrait: SceneStyle };
  worlds: { landscape: World; portrait: World };
  /** Where the relays gather, so that the text side stays quiet. */
  heavySide: { landscape: "left" | "right" | "none"; portrait: "left" | "right" | "none" };
  quiet: { landscape: QuietZone; portrait: QuietZone };
  line: { widthPx: number; glowPx: number; alpha: number; glowAlpha: number };
  node: { playerPx: number; relayPx: number; playerHalo: number; relayHalo: number };
  pulse: { tailPx: number; widthPx: number };
  dither?: { cellPx: number };
  /** Budget: device pixels and frames per second, both ceilings. */
  maxPixels: number;
  fpsCap: number;
  /** The time, in seconds, at which the poster is drawn: pulses mid-flight. */
  stillT: number;
  /** Device pixels per CSS pixel of the poster. */
  stillScale: number;
  palette: { line: string; player: string; relay: string; relayCore: string; pulse: string };
}

const quietNone: QuietZone = { x0: 0, y0: 0, x1: 0, y1: 0, strength: 0 };

export const MAP_STYLES: Record<Direction, MapStyle> = {
  // A, Signal: light on a night page. Soft glow, curved routes, pulses like packets.
  a: {
    render: "glow",
    seed: 7,
    scene: {
      landscape: { routing: "curve", players: 46, relays: 7, redundancy: 0.28, direct: 7 },
      portrait: { routing: "curve", players: 28, relays: 5, redundancy: 0.25, direct: 4 },
    },
    worlds: WORLDS,
    heavySide: { landscape: "right", portrait: "none" },
    quiet: {
      landscape: { x0: 0, y0: 120, x1: 900, y1: 900, strength: 0.93 },
      portrait: { x0: 0, y0: 70, x1: 390, y1: 500, strength: 0.85 },
    },
    line: { widthPx: 1.2, glowPx: 7, alpha: 0.5, glowAlpha: 0.2 },
    node: { playerPx: 2.3, relayPx: 7, playerHalo: 0.45, relayHalo: 0.7 },
    pulse: { tailPx: 96, widthPx: 2.4 },
    maxPixels: 1_300_000,
    fpsCap: 40,
    stillT: 6,
    // 0.6: the glow is soft, and a poster at full size cost 325 KB. The live canvas replaces it in about a second.
    stillScale: 0.6,
    palette: { line: "--ap-brand", player: "--ap-ink-2", relay: "--ap-brand", relayCore: "--ap-bg", pulse: "--ap-ink" },
  },
  // B, Route: ink on paper. A transit map: axis and 45 degree routes, relays are interchanges.
  b: {
    render: "ink",
    seed: 11,
    scene: {
      landscape: { routing: "octilinear", players: 26, relays: 6, redundancy: 0.2, direct: 4 },
      portrait: { routing: "octilinear", players: 16, relays: 4, redundancy: 0.2, direct: 2 },
    },
    worlds: { landscape: { w: 860, h: 760 }, portrait: { w: 358, h: 420 } },
    heavySide: { landscape: "none", portrait: "none" },
    quiet: { landscape: quietNone, portrait: quietNone },
    line: { widthPx: 2.6, glowPx: 0, alpha: 1, glowAlpha: 0 },
    node: { playerPx: 3.6, relayPx: 11, playerHalo: 0, relayHalo: 0 },
    pulse: { tailPx: 64, widthPx: 4.4 },
    maxPixels: 1_300_000,
    fpsCap: 40,
    stillT: 6,
    stillScale: 1.5,
    palette: { line: "--ap-line-strong", player: "--ap-ink", relay: "--ap-ink", relayCore: "--ap-surface", pulse: "--ap-brand" },
  },
  // C, Dither: the same light quantised to one colour and a Bayer matrix, like a console screen.
  c: {
    render: "dither",
    seed: 23,
    scene: {
      landscape: { routing: "curve", players: 40, relays: 6, redundancy: 0.3, direct: 6 },
      portrait: { routing: "curve", players: 24, relays: 4, redundancy: 0.25, direct: 3 },
    },
    worlds: WORLDS,
    heavySide: { landscape: "right", portrait: "none" },
    quiet: {
      landscape: { x0: 0, y0: 60, x1: 820, y1: 900, strength: 1 },
      portrait: { x0: 0, y0: 60, x1: 390, y1: 520, strength: 1 },
    },
    line: { widthPx: 1.8, glowPx: 15, alpha: 0.95, glowAlpha: 0.62 },
    node: { playerPx: 2.8, relayPx: 9, playerHalo: 0.9, relayHalo: 1 },
    pulse: { tailPx: 120, widthPx: 3 },
    dither: { cellPx: 3 },
    maxPixels: 1_300_000,
    fpsCap: 30,
    stillT: 6,
    stillScale: 1,
    palette: { line: "--ap-brand", player: "--ap-brand", relay: "--ap-brand", relayCore: "--ap-bg", pulse: "--ap-ink" },
  },
};

export function isDirection(v: string | undefined | null): v is Direction {
  return v === "a" || v === "b" || v === "c";
}
