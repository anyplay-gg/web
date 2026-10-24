// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { m, useMotionTemplate, useScroll, useSpring, useTransform } from "@anyplay/ui/motion";
import { type ReactNode, useEffect, useRef } from "react";
import { WhenVisible, useStill } from "./providers";
import { DitherField } from "./shaders";

/**
 * The moving parts of the hero. Each one is decoration on a marketing page that a visitor sees once:
 * a light in the dithered field that follows the pointer, and the launcher window that tilts up flat
 * as the page scrolls. Both stand still for a visitor who asked for less motion, and the light only
 * follows a mouse.
 */

/** The dithered field behind the hero, lit where the pointer is. Before the first move the light sits behind the headline. */
export function HeroField({ className = "" }: { className?: string }) {
  const still = useStill();
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(50, { stiffness: 70, damping: 20, mass: 0.9 });
  const y = useSpring(36, { stiffness: 70, damping: 20, mass: 0.9 });

  useEffect(() => {
    if (still || !window.matchMedia("(pointer: fine)").matches) return;
    const move = (e: PointerEvent) => {
      const r = ref.current?.getBoundingClientRect();
      if (!r || e.clientY > r.bottom) return;
      x.set(((e.clientX - r.left) / r.width) * 100);
      y.set(((e.clientY - r.top) / r.height) * 100);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [still, x, y]);

  const mask = useMotionTemplate`radial-gradient(circle min(36vw, 460px) at ${x}% ${y}%, black, transparent 72%), radial-gradient(130% 70% at 50% 100%, rgb(0 0 0 / 0.5) 10%, transparent 70%)`;

  return (
    <m.div ref={ref} aria-hidden className={className} style={{ maskImage: mask, WebkitMaskImage: mask }}>
      <WhenVisible className="size-full">
        <DitherField className="size-full" />
      </WhenVisible>
    </m.div>
  );
}

/**
 * Holds the launcher window tilted back like a screen on a desk, and brings it up flat as the visitor
 * scrolls toward it. The pivot is the top edge, so the window rises instead of swinging.
 */
export function TiltIn({ children, className = "" }: { children: ReactNode; className?: string }) {
  const still = useStill();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 0.2"] });
  const p = useSpring(scrollYProgress, { stiffness: 140, damping: 26, mass: 0.4 });
  const rotateX = useTransform(p, [0, 1], [26, 0]);
  const scale = useTransform(p, [0, 1], [0.88, 1]);
  const y = useTransform(p, [0, 1], [40, 0]);
  return (
    <div ref={ref} className={`[perspective:1600px] ${className}`}>
      <m.div style={still ? undefined : { rotateX, scale, y, transformOrigin: "50% 0%" }}>{children}</m.div>
    </div>
  );
}
