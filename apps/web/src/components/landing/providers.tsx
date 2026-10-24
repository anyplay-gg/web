// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { LazyMotion, MotionConfig, domAnimation } from "@anyplay/ui/motion";
import Lenis from "lenis";
import { type ReactNode, createContext, useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * The landing's motion context. Motion follows the visitor's reduced-motion setting everywhere
 * (`reducedMotion="user"`), and smooth scrolling (Lenis, MIT) only runs for visitors who did not ask
 * for less motion and only with a fine pointer: touch scrolling is already physical, and a wheel on a
 * desktop is where the stepped jumps feel cheap.
 */
export function LandingProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (still || !fine) return;
    const lenis = new Lenis({ lerp: 0.12, wheelMultiplier: 1 });
    let raf = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}

const Visible = createContext(true);

/**
 * Mounts its children the first time they come near the viewport and keeps them, telling them through
 * `useVisible` whether they are near it now. Shaders read that to stop their render loop off screen:
 * a canvas that stays costs nothing while still, and one that is torn down and rebuilt on every pass
 * costs a WebGL context each time.
 */
export function WhenVisible({ children, margin = "200px", className }: { children: ReactNode; margin?: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        const now = Boolean(e?.isIntersecting);
        setNear(now);
        if (now) setMounted(true);
      },
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [margin]);
  return (
    <div ref={ref} className={className}>
      <Visible.Provider value={near}>{mounted ? children : null}</Visible.Provider>
    </div>
  );
}

/** Whether the nearest `WhenVisible` is near the viewport; true outside of one. */
export function useVisible(): boolean {
  return useContext(Visible);
}

/** Whether the visitor asked for less motion; false on the server and in the first paint. */
export function useStill(): boolean {
  return useSyncExternalStore(subscribeStill, () => window.matchMedia(REDUCE).matches, () => false);
}

const REDUCE = "(prefers-reduced-motion: reduce)";
function subscribeStill(onChange: () => void) {
  const m = window.matchMedia(REDUCE);
  m.addEventListener("change", onChange);
  return () => m.removeEventListener("change", onChange);
}
