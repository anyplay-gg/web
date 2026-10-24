// SPDX-License-Identifier: AGPL-3.0-only
import type { ReactNode } from "react";
import { WORDMARK_PATHS, type WordmarkData } from "./wordmark-paths.generated";
import type { Direction } from "@/components/network-map/styles";

/**
 * The wordmark of each direction: "AnyPlay" drawn from the direction's display face (outlines from
 * the font, see scripts/gen-wordmarks.mjs) plus ONE gesture that says what the product is about:
 *
 * - A, Signal: a route leaves the first y and runs under "Play" to a node. Two words, one link.
 * - B, Route: the stem of the P grows a leg that runs back to the foot of the y, like a line
 *   joining two stations. The join between "Any" and "Play" is a physical connection.
 * - C, Dither: "Any" is set at the widest the face goes and "Play" at the narrowest. Any width,
 *   one word. No geometry added: the gesture is the width axis.
 *
 * Letters are `currentColor`; the gesture takes the brand colour.
 */

interface Gesture {
  node: ReactNode;
  /** Extra room needed below the baseline, in font units. */
  below: number;
  /** Extra room needed to the right. */
  right: number;
}

function gestureA(w: WordmarkData): Gesture {
  const y1 = w.glyphs[2]!;
  const yLast = w.glyphs[6]!;
  const depth = 118;
  const x0 = y1.x + y1.bbox[2] + 58;
  const x1 = yLast.x - 44;
  const stroke = 44;
  return {
    below: 0,
    right: 0,
    node: (
      <g className="wm-gesture" fill="none" stroke="var(--ap-brand)" strokeWidth={stroke} strokeLinecap="round">
        <path d={`M${x0} ${depth} H${x1 - 56}`} />
        <circle cx={x1} cy={depth} r={46} strokeWidth={stroke * 0.8} />
        <circle cx={x0} cy={depth} r={stroke * 0.62} fill="var(--ap-brand)" stroke="none" />
      </g>
    ),
  };
}

function gestureB(w: WordmarkData): Gesture {
  const y1 = w.glyphs[2]!;
  const p = w.glyphs[3]!;
  const stem = 128;
  const px = p.x + p.bbox[0] + stem / 2;
  const footX = y1.x + 108;
  const bottom = y1.bbox[3] + 78;
  const turn = 56;
  return {
    below: 150,
    right: 0,
    node: (
      <g className="wm-gesture" fill="none" stroke="var(--ap-brand)" strokeWidth={stem * 0.36} strokeLinecap="round" strokeLinejoin="round">
        <path d={`M${px} 40 V${bottom - turn} L${px - turn} ${bottom} H${footX + 52}`} />
        <circle cx={footX} cy={bottom} r={50} strokeWidth={stem * 0.3} fill="var(--ap-bg)" />
      </g>
    ),
  };
}

const gestures: Record<Direction, ((w: WordmarkData) => Gesture) | null> = { a: gestureA, b: gestureB, c: null };

export function Wordmark({ direction, className = "", title = "AnyPlay" }: { direction: Direction; className?: string; title?: string }) {
  const w = WORDMARK_PATHS[direction];
  const g = gestures[direction]?.(w);
  const top = Math.min(...w.glyphs.map((x) => x.bbox[1]));
  const bottom = Math.max(...w.glyphs.map((x) => x.bbox[3]), g ? 0 : 0) + (g?.below ?? 0) + 60;
  const left = -40;
  const width = w.width + 80 + (g?.right ?? 0);
  return (
    <svg
      role="img"
      aria-label={title}
      viewBox={`${left} ${top - 40} ${width} ${bottom - top + 40}`}
      className={className}
      fill="currentColor"
      preserveAspectRatio="xMinYMax meet"
      focusable="false"
    >
      {w.glyphs.map((glyph, i) => (
        <path key={i} d={glyph.d} />
      ))}
      {g?.node}
    </svg>
  );
}
