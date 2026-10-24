// SPDX-License-Identifier: AGPL-3.0-only
// The ONE entry to the motion library. Nothing else imports "motion" or "motion/react": the lint rule
// in tooling/eslint refuses it, so this file is where reduced motion is guaranteed for every
// animation that is not plain CSS.
//
// CSS transitions cover hover, press and colour; this library is for what CSS cannot do well:
// interruptible springs on gestures, shared layout, exit animation of removed elements.
"use client";

export {
  AnimatePresence,
  LazyMotion,
  MotionConfig,
  domAnimation,
  m,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
export type { MotionValue } from "motion/react";

/** Spring presets. Bounce is 0 everywhere except a gesture that carried momentum. */
export const spring = {
  /** Panels, sheets, menus: critically damped, no overshoot. */
  settle: { type: "spring", duration: 0.35, bounce: 0 },
  /** A flick that was released with speed: a little give. */
  flick: { type: "spring", duration: 0.4, bounce: 0.2 },
} as const;
