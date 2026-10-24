// SPDX-License-Identifier: AGPL-3.0-only
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";

/**
 * One icon family (Hugeicons Free, Stroke Rounded, MIT), one stroke weight per context.
 *
 * Why the stroke is computed: an icon's `strokeWidth` is a number on its 24px grid, and `size`
 * scales the whole SVG, so a fixed `strokeWidth={2}` renders as 2 * size / 24 pixels: 1.33px at 16px
 * and 2.33px at 28px, a different weight in every place the icon appears. The rendered stroke is
 * fixed instead: 1.5px next to regular text and 2px next to semibold text, which keeps the icon at
 * the weight of the words around it. The method (a wrapper that does the arithmetic and one test
 * that holds it) is athaus' (marke.tsx); the numbers are AnyPlay's own.
 *
 * Icons are decorative: the label is next to them or in the button's aria-label, never in the icon.
 */
const GRID = 24;
const RENDERED_STROKE = { regular: 1.5, semibold: 2 } as const;

export type IconWeight = keyof typeof RENDERED_STROKE;

/** The strokeWidth (on the 24px grid) that renders as the target pixel weight at `size`. */
export function strokeFor(size: number, weight: IconWeight = "regular"): number {
  // Capped at 3: below ~12px the arithmetic would ask for a stroke wider than the shapes can carry.
  return Math.min(3, Math.round(((RENDERED_STROKE[weight] * GRID) / size) * 100) / 100);
}

export function Icon({
  icon,
  size = 20,
  weight = "regular",
  className,
}: {
  icon: IconSvgElement;
  size?: number;
  weight?: IconWeight;
  className?: string;
}) {
  return <HugeiconsIcon icon={icon} size={size} strokeWidth={strokeFor(size, weight)} className={className} aria-hidden />;
}
