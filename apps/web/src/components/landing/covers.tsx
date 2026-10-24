// SPDX-License-Identifier: AGPL-3.0-only
import { type CSSProperties, useId } from "react";

/**
 * Cover art for the invented games in the landing's launcher: layered landscapes in the manner of a
 * travel poster, each with its own palette and title lettering, drawn as SVG from a seed so the
 * server and the browser draw the same picture. They are ours: no game's real cover may appear on
 * the web (publishers own them, and covers read from a dump are game data that stays on the player's
 * machine). The names are invented, like the launcher gallery's own.
 */

type Layer = {
  color: string;
  /** Where the ridge sits, as a share of the height from the top. */
  base: number;
  /** How far it rises and falls, as a share of the height. */
  amp: number;
  freq: number;
  kind?: "hills" | "peaks" | "trees" | "city" | "waves";
};

type Scene = {
  title: string;
  lettering: CSSProperties;
  place: "top" | "center" | "bottom";
  sky: [string, string];
  sun?: { x: number; y: number; r: number; color: string; glow: string; stripes?: boolean };
  stars?: number;
  castle?: string;
  layers: Layer[];
  seed: number;
};

const anybody = "'Anybody Variable', 'Mona Sans Variable', sans-serif";
const bricolage = "'Bricolage Grotesque Variable', 'Mona Sans Variable', sans-serif";
const mona = "'Mona Sans Variable', sans-serif";

export const GAMES: Scene[] = [
  {
    title: "Ember Drift",
    place: "bottom",
    lettering: { fontFamily: anybody, fontWeight: 900, fontStretch: "135%", fontStyle: "italic", textTransform: "uppercase", color: "#fff1e2", letterSpacing: "-0.02em", fontSize: "15cqw", lineHeight: 0.9 },
    sky: ["#3a0b1e", "#ff8a4c"],
    sun: { x: 0.62, y: 0.5, r: 0.17, color: "#ffd9a0", glow: "#ff9a5c" },
    layers: [
      { color: "#c8483a", base: 0.6, amp: 0.12, freq: 1.3, kind: "peaks" },
      { color: "#8a2436", base: 0.7, amp: 0.1, freq: 1.8, kind: "peaks" },
      { color: "#55142c", base: 0.8, amp: 0.07, freq: 2.2 },
      { color: "#2a0817", base: 0.9, amp: 0.05, freq: 3 },
    ],
    seed: 11,
  },
  {
    title: "Hollow Orchard",
    place: "top",
    lettering: { fontFamily: bricolage, fontWeight: 700, color: "#e9fff5", fontSize: "13cqw", lineHeight: 0.95, letterSpacing: "-0.02em" },
    sky: ["#04161c", "#1f6b67"],
    sun: { x: 0.76, y: 0.5, r: 0.07, color: "#f2fff6", glow: "#7fe8d0" },
    stars: 26,
    layers: [
      { color: "#16504f", base: 0.62, amp: 0.08, freq: 1.2 },
      { color: "#0e3a3b", base: 0.72, amp: 0.06, freq: 1.6, kind: "trees" },
      { color: "#072325", base: 0.84, amp: 0.05, freq: 2.4, kind: "trees" },
    ],
    seed: 23,
  },
  {
    title: "Tidebreak",
    place: "bottom",
    lettering: { fontFamily: mona, fontWeight: 800, fontStretch: "125%", textTransform: "uppercase", color: "#ffffff", letterSpacing: "0.06em", fontSize: "12cqw" },
    sky: ["#0b2a5c", "#7fc4ff"],
    sun: { x: 0.3, y: 0.42, r: 0.12, color: "#fff7d6", glow: "#bfe4ff" },
    layers: [
      { color: "#3f86d8", base: 0.58, amp: 0.025, freq: 5, kind: "waves" },
      { color: "#2a62b8", base: 0.68, amp: 0.035, freq: 4, kind: "waves" },
      { color: "#173f86", base: 0.8, amp: 0.045, freq: 3, kind: "waves" },
      { color: "#0b2356", base: 0.92, amp: 0.04, freq: 2.5, kind: "waves" },
    ],
    seed: 37,
  },
  {
    title: "Neon Meridian",
    place: "top",
    lettering: { fontFamily: anybody, fontWeight: 800, fontStretch: "150%", textTransform: "uppercase", color: "#fff", fontSize: "11cqw", lineHeight: 0.95, textShadow: "0 0 12px #ff4fd8" },
    sky: ["#12052e", "#c0237a"],
    sun: { x: 0.5, y: 0.52, r: 0.22, color: "#ffcf5c", glow: "#ff4f9a", stripes: true },
    stars: 18,
    layers: [
      { color: "#3a0f6b", base: 0.74, amp: 0.1, freq: 1, kind: "city" },
      { color: "#1a0638", base: 0.86, amp: 0.08, freq: 1, kind: "city" },
    ],
    seed: 41,
  },
  {
    title: "Dune Runners",
    place: "top",
    lettering: { fontFamily: anybody, fontWeight: 900, fontStretch: "62%", textTransform: "uppercase", color: "#3a1406", fontSize: "19cqw", lineHeight: 0.85 },
    sky: ["#ffd9a0", "#ff9a4a"],
    sun: { x: 0.72, y: 0.46, r: 0.13, color: "#fff4d6", glow: "#ffd28a" },
    layers: [
      { color: "#e88a3c", base: 0.64, amp: 0.07, freq: 1.4, kind: "peaks" },
      { color: "#c9662a", base: 0.75, amp: 0.06, freq: 1.7, kind: "peaks" },
      { color: "#93421a", base: 0.88, amp: 0.05, freq: 2.1, kind: "peaks" },
    ],
    seed: 53,
  },
  {
    title: "Frostline",
    place: "bottom",
    lettering: { fontFamily: bricolage, fontWeight: 300, textTransform: "uppercase", color: "#0f2a4a", letterSpacing: "0.24em", fontSize: "11cqw" },
    sky: ["#bcdcff", "#f2f8ff"],
    sun: { x: 0.24, y: 0.3, r: 0.07, color: "#ffffff", glow: "#e6f2ff" },
    layers: [
      { color: "#9cc2ec", base: 0.48, amp: 0.16, freq: 1.5, kind: "peaks" },
      { color: "#e8f2ff", base: 0.58, amp: 0.13, freq: 1.9, kind: "peaks" },
      { color: "#6f9ad0", base: 0.7, amp: 0.08, freq: 2.6, kind: "trees" },
    ],
    seed: 67,
  },
  {
    title: "Starfall Keep",
    place: "top",
    lettering: { fontFamily: bricolage, fontWeight: 800, color: "#ffd98a", fontSize: "13cqw", lineHeight: 0.92, letterSpacing: "-0.01em" },
    sky: ["#0d0a2e", "#5a3a9e"],
    sun: { x: 0.25, y: 0.62, r: 0.09, color: "#fff2c8", glow: "#b28cff" },
    stars: 40,
    castle: "#1a1240",
    layers: [
      { color: "#2c2066", base: 0.74, amp: 0.06, freq: 1.2 },
      { color: "#1a1240", base: 0.86, amp: 0.05, freq: 1.8 },
    ],
    seed: 79,
  },
  {
    title: "Kitebound",
    place: "bottom",
    lettering: { fontFamily: bricolage, fontWeight: 700, color: "#ffffff", fontSize: "15cqw", letterSpacing: "-0.03em", textShadow: "0 2px 8px rgb(20 60 20 / 0.35)" },
    sky: ["#7fd0ff", "#e8fbff"],
    sun: { x: 0.78, y: 0.24, r: 0.08, color: "#fffbe0", glow: "#fff0a0" },
    layers: [
      { color: "#9fe07a", base: 0.62, amp: 0.06, freq: 1.1 },
      { color: "#5cbf4a", base: 0.72, amp: 0.06, freq: 1.4 },
      { color: "#2f8a3a", base: 0.86, amp: 0.05, freq: 1.8, kind: "trees" },
    ],
    seed: 83,
  },
];

const TAU = Math.PI * 2;

/** A small seeded generator (mulberry32), so every render draws the same picture. */
function random(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f1 = (n: number) => Math.round(n * 10) / 10;

function ridge(layer: Layer, seed: number, w: number, h: number) {
  const r = random(seed);
  const ph = [r() * TAU, r() * TAU, r() * TAU];
  const height = (t: number) => {
    const f = layer.freq;
    if (layer.kind === "peaks") return 1 - 1.6 * Math.abs(Math.sin(t * f * Math.PI + ph[0]!)) + 0.25 * Math.sin(t * f * 6 * TAU + ph[2]!);
    if (layer.kind === "waves") return Math.sin(t * f * TAU + ph[0]!) + 0.3 * Math.sin(t * f * 3.1 * TAU + ph[1]!);
    return 0.6 * Math.sin(t * f * TAU + ph[0]!) + 0.3 * Math.sin(t * f * 2.7 * TAU + ph[1]!) + 0.1 * Math.sin(t * f * 7.3 * TAU + ph[2]!);
  };
  const y = (t: number) => h * layer.base - h * layer.amp * height(t);
  const n = 64;
  let d = `M0 ${h}`;
  for (let i = 0; i <= n; i++) d += ` L${f1((i / n) * w)} ${f1(y(i / n))}`;
  d += ` L${w} ${h} Z`;

  if (layer.kind === "trees") {
    const count = Math.round(w / 6);
    for (let i = 0; i < count; i++) {
      const t = (i + r() * 0.8) / count;
      const x = t * w;
      const th = h * (0.05 + r() * 0.07);
      const tw = th * 0.32;
      const base = y(t) + 1;
      d += ` M${f1(x - tw)} ${f1(base)} L${f1(x)} ${f1(base - th)} L${f1(x + tw)} ${f1(base)} Z`;
    }
  }
  if (layer.kind === "city") {
    let x = 0;
    while (x < w) {
      const bw = w * (0.05 + r() * 0.07);
      const bh = h * (layer.amp * 0.6 + r() * layer.amp * 1.6);
      d += ` M${f1(x)} ${h} L${f1(x)} ${f1(h * layer.base - bh)} L${f1(x + bw)} ${f1(h * layer.base - bh)} L${f1(x + bw)} ${h} Z`;
      x += bw + w * 0.008;
    }
  }
  return d;
}

/** A keep on the far ridge: towers with roofs, drawn once in viewBox units around a centre. */
function castle(cx: number, base: number, s: number) {
  const rect = (x: number, y: number, w: number, h: number) => `M${f1(x)} ${f1(y)} h${f1(w)} v${f1(h)} h${f1(-w)} Z`;
  const roof = (x: number, y: number, w: number, h: number) => `M${f1(x)} ${f1(y)} L${f1(x + w / 2)} ${f1(y - h)} L${f1(x + w)} ${f1(y)} Z`;
  return [
    rect(cx - 9 * s, base - 10 * s, 18 * s, 10 * s),
    rect(cx - 12 * s, base - 16 * s, 5 * s, 16 * s),
    roof(cx - 13 * s, base - 16 * s, 7 * s, 7 * s),
    rect(cx + 7 * s, base - 14 * s, 5 * s, 14 * s),
    roof(cx + 6 * s, base - 14 * s, 7 * s, 6 * s),
    rect(cx - 2.5 * s, base - 22 * s, 5 * s, 12 * s),
    roof(cx - 3.5 * s, base - 22 * s, 7 * s, 9 * s),
  ].join(" ");
}

/** The picture alone: square for a tile, wide for the backdrop behind the selected game. */
export function CoverArt({ game, wide = false, className = "", style }: { game: number; wide?: boolean; className?: string; style?: CSSProperties }) {
  const g = GAMES[game % GAMES.length]!;
  const id = useId().replace(/:/g, "");
  const w = wide ? 160 : 100;
  const h = wide ? 90 : 100;
  const r = random(g.seed * 7 + (wide ? 1 : 0));
  return (
    <svg aria-hidden viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid slice" className={className} style={style}>
      <defs>
        <linearGradient id={`sky${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={g.sky[0]} />
          <stop offset="0.75" stopColor={g.sky[1]} />
        </linearGradient>
        {g.sun && (
          <radialGradient id={`glow${id}`}>
            <stop offset="0" stopColor={g.sun.glow} stopOpacity="0.85" />
            <stop offset="1" stopColor={g.sun.glow} stopOpacity="0" />
          </radialGradient>
        )}
      </defs>
      <rect width={w} height={h} fill={`url(#sky${id})`} />
      {Array.from({ length: g.stars ?? 0 }, (_, i) => (
        <circle key={i} cx={f1(r() * w)} cy={f1(r() * h * 0.55)} r={f1(0.15 + r() * 0.35)} fill="#fff" opacity={f1(0.4 + r() * 0.6)} />
      ))}
      {g.sun && (
        <>
          <circle cx={g.sun.x * w} cy={g.sun.y * h} r={g.sun.r * h * 2.6} fill={`url(#glow${id})`} />
          <circle cx={g.sun.x * w} cy={g.sun.y * h} r={g.sun.r * h * (wide ? 0.75 : 1)} fill={g.sun.color} />
          {g.sun.stripes &&
            [0.15, 0.32, 0.47, 0.6, 0.72].map((o, i) => (
              <rect
                key={i}
                x={g.sun!.x * w - g.sun!.r * h}
                y={g.sun!.y * h + o * g.sun!.r * h}
                width={g.sun!.r * h * 2}
                height={0.6 + i * 0.45}
                fill={g.sky[1]}
              />
            ))}
        </>
      )}
      {g.castle && <path d={castle(w * 0.66, h * 0.74 - 3, wide ? 0.9 : 1)} fill={g.layers[0]!.color} />}
      {g.layers.map((l, i) => (
        <path key={i} d={ridge(l, g.seed * 31 + i * 7 + (wide ? 3 : 0), w, h)} fill={l.color} />
      ))}
    </svg>
  );
}

/** A tile: the picture with the game's own lettering on it, like the icon a game ships. */
export function CoverTile({ game, className = "", style }: { game: number; className?: string; style?: CSSProperties }) {
  const g = GAMES[game % GAMES.length]!;
  const place = g.place === "top" ? "items-start pt-[9%]" : g.place === "center" ? "items-center" : "items-end pb-[9%]";
  return (
    <span className={`overflow-hidden [container-type:inline-size] ${className}`} style={style}>
      <CoverArt game={game} className="absolute inset-0 size-full" />
      <span className={`absolute inset-0 flex justify-center px-[8%] text-center ${place}`}>
        <span style={g.lettering}>{g.title}</span>
      </span>
    </span>
  );
}
