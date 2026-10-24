// SPDX-License-Identifier: AGPL-3.0-only
//
// The scene of the network map: players, relays and the connections between them, as plain data.
//
// Pure and deterministic. The same seed and the same style give the same scene on the server, in the
// browser and in the script that pre-renders the still image, so the poster and the live canvas
// show the same map. Nothing here touches the DOM or WebGL; that is what makes it testable.
//
// The data is SYNTHETIC. It illustrates what the network is made of (players that connect through
// relays or directly) and is labelled as an illustration on the page until relays report real
// latency.

export type Routing = "curve" | "octilinear";

export interface SceneStyle {
  routing: Routing;
  players: number;
  relays: number;
  /** Fraction of players that also hold a second link to another relay. */
  redundancy: number;
  /** Player-to-player links that skip the relay. */
  direct: number;
}

/** A rectangle in world fractions where the map is quiet so that text stays readable. */
export interface QuietZone {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  /** 0 = no dimming, 1 = invisible in the middle of the zone. */
  strength: number;
}

export interface World {
  /** Design size in world units. One unit is one CSS pixel at the design viewport. */
  w: number;
  h: number;
}

export type NodeKind = "player" | "relay";
export type LinkKind = "backbone" | "access" | "direct";

export interface SceneNode {
  x: number;
  y: number;
  kind: NodeKind;
  phase: number;
}

export interface SceneEdge {
  kind: LinkKind;
  /** The polyline of the route, at least two points. */
  points: [number, number][];
  /** Total length of the polyline. */
  length: number;
  phase: number;
  /** Pulses per second along the route, as a fraction of the route per second. */
  speed: number;
}

export interface Scene {
  world: World;
  nodes: SceneNode[];
  edges: SceneEdge[];
}

export const WORLDS = {
  landscape: { w: 1440, h: 900 },
  portrait: { w: 390, h: 844 },
} as const satisfies Record<string, World>;

/** mulberry32: a tiny seeded generator, enough for a layout. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * Best-candidate sampling: of several random points, keep the one farthest from those already
 * placed. Gives an even, organic spread without the clumps of plain random and the grid of a lattice.
 */
function spread(
  count: number,
  rand: () => number,
  bounds: { x0: number; y0: number; x1: number; y1: number },
  existing: { x: number; y: number }[],
  weight: (x: number, y: number) => number,
): { x: number; y: number }[] {
  const placed: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    let best: { x: number; y: number } | null = null;
    let bestScore = -1;
    for (let k = 0; k < 14; k++) {
      const p = {
        x: bounds.x0 + rand() * (bounds.x1 - bounds.x0),
        y: bounds.y0 + rand() * (bounds.y1 - bounds.y0),
      };
      let nearest = Infinity;
      for (const q of existing) nearest = Math.min(nearest, dist(p, q));
      for (const q of placed) nearest = Math.min(nearest, dist(p, q));
      const score = nearest * weight(p.x, p.y);
      if (score > bestScore) {
        bestScore = score;
        best = p;
      }
    }
    if (best) placed.push(best);
  }
  return placed;
}

/** A route between two points as a polyline. */
function route(a: { x: number; y: number }, b: { x: number; y: number }, routing: Routing, rand: () => number): [number, number][] {
  if (routing === "octilinear") {
    // The transit-map rule: a route runs along an axis or a 45 degree diagonal, nothing else.
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const diag = Math.min(Math.abs(dx), Math.abs(dy));
    const sx = Math.sign(dx) || 1;
    const sy = Math.sign(dy) || 1;
    const diagFirst = rand() < 0.5;
    const straight: [number, number] = Math.abs(dx) > Math.abs(dy) ? [sx * (Math.abs(dx) - diag), 0] : [0, sy * (Math.abs(dy) - diag)];
    const diagStep: [number, number] = [sx * diag, sy * diag];
    const first = diagFirst ? diagStep : straight;
    const mid: [number, number] = [a.x + first[0], a.y + first[1]];
    const pts: [number, number][] = [[a.x, a.y]];
    if (diag > 1 && Math.hypot(straight[0], straight[1]) > 1) pts.push(mid);
    pts.push([b.x, b.y]);
    return pts;
  }
  // A shallow arc: a quadratic curve bowed to one side, sampled into short segments.
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const len = dist(a, b);
  const bow = (rand() - 0.5) * 0.34 * len;
  const nx = -(b.y - a.y) / (len || 1);
  const ny = (b.x - a.x) / (len || 1);
  const cx = mx + nx * bow;
  const cy = my + ny * bow;
  const steps = Math.max(5, Math.min(14, Math.round(len / 40)));
  const pts: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    pts.push([u * u * a.x + 2 * u * t * cx + t * t * b.x, u * u * a.y + 2 * u * t * cy + t * t * b.y]);
  }
  return pts;
}

const polylineLength = (pts: [number, number][]) => {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1]);
  return l;
};

export function buildScene(options: { seed: number; world: World; style: SceneStyle; heavySide?: "left" | "right" | "none" }): Scene {
  const { world, style } = options;
  const rand = rng(options.seed);
  const margin = 28;
  const bounds = { x0: margin, y0: margin, x1: world.w - margin, y1: world.h - margin };
  const heavy = options.heavySide ?? "none";
  // Relays favour the side that is not under the text, so the hubs are visible and the quiet side
  // keeps only faint players.
  const sideWeight = (x: number) => {
    const t = x / world.w;
    if (heavy === "right") return 0.12 + 0.88 * t * t;
    if (heavy === "left") return 0.12 + 0.88 * (1 - t) * (1 - t);
    return 1;
  };

  const relayPts = spread(style.relays, rand, bounds, [], (x) => sideWeight(x));
  const playerPts = spread(style.players, rand, bounds, relayPts, (x) => 0.3 + 0.7 * sideWeight(x));
  const nodes: SceneNode[] = [
    ...relayPts.map((p) => ({ ...p, kind: "relay" as const, phase: rand() })),
    ...playerPts.map((p) => ({ ...p, kind: "player" as const, phase: rand() })),
  ];
  const relays = nodes.filter((n) => n.kind === "relay");
  const players = nodes.filter((n) => n.kind === "player");

  const edges: SceneEdge[] = [];
  const seen = new Set<string>();
  const add = (a: SceneNode, b: SceneNode, kind: LinkKind) => {
    const key = [nodes.indexOf(a), nodes.indexOf(b)].sort((m, n) => m - n).join("-");
    if (seen.has(key) || a === b) return;
    seen.add(key);
    const points = route(a, b, style.routing, rand);
    const length = polylineLength(points);
    edges.push({
      kind,
      points,
      length,
      phase: rand(),
      speed: (kind === "backbone" ? 0.11 : kind === "access" ? 0.16 : 0.2) * (0.75 + rand() * 0.5),
    });
  };

  const nearest = (from: SceneNode, among: SceneNode[], skip = 0) =>
    [...among].filter((n) => n !== from).sort((m, n) => dist(from, m) - dist(from, n))[skip];

  // The backbone: every relay reaches its two nearest relays.
  for (const r of relays) {
    for (let k = 0; k < 2; k++) {
      const n = nearest(r, relays, k);
      if (n) add(r, n, "backbone");
    }
  }
  // Access: every player reaches its nearest relay; some hold a second link.
  for (const p of players) {
    const first = nearest(p, relays, 0);
    if (first) add(p, first, "access");
    if (rand() < style.redundancy) {
      const second = nearest(p, relays, 1);
      if (second) add(p, second, "access");
    }
  }
  // Direct: two nearby players on different relays connect without one.
  let made = 0;
  const shuffled = [...players].sort(() => rand() - 0.5);
  for (const p of shuffled) {
    if (made >= style.direct) break;
    const q = nearest(p, players, 0);
    if (q && dist(p, q) < world.w * 0.16) {
      add(p, q, "direct");
      made++;
    }
  }
  return { world, nodes, edges };
}

/** Counts a test and the stats overlay can read. */
export function describeScene(scene: Scene) {
  const segments = scene.edges.reduce((n, e) => n + e.points.length - 1, 0);
  return {
    relays: scene.nodes.filter((n) => n.kind === "relay").length,
    players: scene.nodes.filter((n) => n.kind === "player").length,
    routes: scene.edges.length,
    segments,
  };
}
