// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { Dithering } from "@paper-design/shaders-react";
import { useSyncExternalStore } from "react";
import { useStill, useVisible } from "./providers";

/** Phones and touch screens: a smaller backdrop is enough there and the GPU is the weak part. */
export const SMALL_SCREEN = "(pointer: coarse), (max-width: 767px)";
export const PIXEL_BUDGET = { small: 350_000, large: 900_000 } as const;

/** The budget for the screen as it is now; the large one where there is no window to ask. */
export function readPixelBudget(): number {
  if (typeof window === "undefined") return PIXEL_BUDGET.large;
  return window.matchMedia(SMALL_SCREEN).matches ? PIXEL_BUDGET.small : PIXEL_BUDGET.large;
}

function subscribeBudget(onChange: () => void) {
  const m = window.matchMedia(SMALL_SCREEN);
  m.addEventListener("change", onChange);
  return () => m.removeEventListener("change", onChange);
}

/**
 * How many render pixels a field may draw. The server and the first client render answer with the
 * desktop value, so hydration matches; a phone then drops to the smaller budget.
 */
export function usePixelBudget(): number {
  return useSyncExternalStore(subscribeBudget, readPixelBudget, () => PIXEL_BUDGET.large);
}

/**
 * The two shader surfaces of the landing, both from Paper Shaders (Apache-2.0, see
 * THIRD_PARTY_NOTICES.md). They are backdrops, never content: the words and cards on top carry
 * everything, so a browser without WebGL or a visitor who asked for less motion loses nothing but
 * the movement. Pixel count is capped so a 4K screen does not pay four times for a background.
 */

/** Ordered dithering in ember on ink: a pixel texture that reads as "game" without a single sprite. */
export function DitherField({ className = "" }: { className?: string }) {
  const visible = useVisible();
  const reduced = useStill();
  const maxPixelCount = usePixelBudget();
  // Off screen or for reduced motion the field holds still; a speed of 0 also ends its render loop.
  const still = !visible || reduced;
  return (
    <Dithering
      className={className}
      colorBack="#0d0c0b"
      colorFront="#ff5a1f"
      shape="warp"
      type="4x4"
      size={2.5}
      speed={still ? 0 : 0.25}
      scale={1.4}
      maxPixelCount={maxPixelCount}
      aria-hidden
    />
  );
}

/** A dithered sun rising out of the bottom edge, lit from above: the close of the page. */
export function SunField({ className = "" }: { className?: string }) {
  const visible = useVisible();
  const reduced = useStill();
  const maxPixelCount = usePixelBudget();
  // Off screen or for reduced motion the field holds still; a speed of 0 also ends its render loop.
  const still = !visible || reduced;
  return (
    <Dithering
      className={className}
      colorBack="#0b0a09"
      colorFront="#ff5a1f"
      shape="sphere"
      type="8x8"
      size={3}
      speed={still ? 0 : 0.18}
      scale={0.62}
      offsetY={-0.55}
      maxPixelCount={maxPixelCount}
      aria-hidden
    />
  );
}
