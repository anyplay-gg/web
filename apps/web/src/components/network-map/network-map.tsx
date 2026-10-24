// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createMapEngine, type MapEngine, type Palette, type Rgb } from "./engine";
import { buildScene } from "./scene";
import { MAP_STYLES, type Direction, type MapStyle } from "./styles";

/**
 * The signature object of the site: a living map of players and relays.
 *
 * It is tiered, so the page is complete at every step and never waits for the heavy one:
 *   1. the CSS behind it (the page's own background);
 *   2. a poster image drawn by this same scene and style (public/map/*.webp, made by
 *      scripts/render-stills.mjs), which is what the first paint and the LCP are;
 *   3. a WebGL 2 canvas that replaces the poster only when the page is idle, the map is on screen,
 *      the tab is visible and the visitor has not asked for less: not under prefers-reduced-motion,
 *      not with Save-Data, not without WebGL 2. It is capped in pixels and in frames per second.
 *
 * The picture is an illustration with synthetic data; the page says so beside it.
 */

const portraitQuery = "(max-aspect-ratio: 1/1)";
function subscribePortrait(cb: () => void) {
  const mq = window.matchMedia(portraitQuery);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const portraitNow = () => window.matchMedia(portraitQuery).matches;

function parseColour(raw: string): Rgb {
  const hex = raw.trim().replace("#", "");
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex;
  const n = parseInt(full.slice(0, 6), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function readPalette(el: Element, style: MapStyle): Palette {
  const cs = getComputedStyle(el);
  const get = (name: string) => parseColour(cs.getPropertyValue(name));
  return {
    line: get(style.palette.line),
    player: get(style.palette.player),
    relay: get(style.palette.relay),
    relayCore: get(style.palette.relayCore),
    pulse: get(style.palette.pulse),
  };
}

interface NavigatorWithConnection extends Navigator {
  connection?: { saveData?: boolean };
}

declare global {
  interface Window {
    __anyplayMap?: { stats: MapEngine["stats"]; direction: Direction; segments: number };
    __mapStill?: { ready: boolean; toBlob: (type: string, quality: number) => Promise<string> };
  }
}

export function NetworkMap({ direction, className = "" }: { direction: Direction; className?: string }) {
  const style = MAP_STYLES[direction];
  const portrait = useSyncExternalStore(subscribePortrait, portraitNow, () => false);
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("map");
    const stillMode = mode === "still";
    const measure = mode === "stats";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = (navigator as NavigatorWithConnection).connection?.saveData === true;
    if (!stillMode && (reduced || saveData || mode === "off")) return;

    const orient = portrait ? "portrait" : "landscape";
    const world = style.worlds[orient];
    const scene = buildScene({ seed: style.seed, world, style: style.scene[orient], heavySide: style.heavySide[orient] });
    const q = style.quiet[orient];
    const effective: MapStyle = stillMode ? { ...style, maxPixels: 1e9 } : style;

    let engine: MapEngine | null = null;
    let raf = 0;
    let visible = true;
    let last = 0;
    let started = false;
    let disposed = false;
    let ro: ResizeObserver | undefined;
    let io: IntersectionObserver | undefined;
    const t0 = performance.now();

    const size = () => {
      const r = host.getBoundingClientRect();
      return { w: r.width, h: r.height };
    };

    const loop = (now: number) => {
      raf = 0;
      if (!engine || !visible || document.hidden) return;
      raf = requestAnimationFrame(loop);
      if (now - last < 1000 / style.fpsCap - 1) return;
      last = now;
      engine.frame(style.stillT + (now - t0) / 1000);
      if (!started) {
        started = true;
        setLive(true);
      }
    };
    const kick = () => {
      if (!raf && engine && visible && !document.hidden) raf = requestAnimationFrame(loop);
    };

    const start = () => {
      if (disposed) return;
      engine = createMapEngine(canvas, {
        scene,
        style: effective,
        palette: readPalette(host, style),
        preserve: stillMode,
        measure,
        quiet: { rect: [q.x0, q.y0, q.x1, q.y1], strength: q.strength },
      });
      if (!engine) return;
      const { w, h } = size();
      engine.resize(w, h, stillMode ? style.stillScale : window.devicePixelRatio || 1);
      window.__anyplayMap = { stats: engine.stats, direction, segments: scene.edges.reduce((n, e) => n + e.points.length - 1, 0) };

      if (stillMode) {
        engine.frame(style.stillT);
        window.__mapStill = {
          ready: true,
          toBlob: (type, quality) =>
            new Promise((resolve) =>
              canvas.toBlob(
                (blob) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve(String(reader.result));
                  if (blob) reader.readAsDataURL(blob);
                },
                type,
                quality,
              ),
            ),
        };
        setLive(true);
        return;
      }

      ro = new ResizeObserver(() => {
        const s = size();
        engine?.resize(s.w, s.h, window.devicePixelRatio || 1);
      });
      ro.observe(host);
      io = new IntersectionObserver(([entry]) => {
        visible = entry?.isIntersecting ?? true;
        if (visible) {
          last = 0;
          kick();
        }
      });
      io.observe(host);
      document.addEventListener("visibilitychange", kick);
      kick();
    };

    // The canvas wakes when the browser is idle, never in the way of the first paint.
    let idleId = 0;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (stillMode) start();
    else if ("requestIdleCallback" in window) idleId = window.requestIdleCallback(start, { timeout: 1500 });
    else timeoutId = setTimeout(start, 400);

    return () => {
      disposed = true;
      if (idleId) window.cancelIdleCallback(idleId);
      if (timeoutId) clearTimeout(timeoutId);
      if (raf) cancelAnimationFrame(raf);
      ro?.disconnect();
      io?.disconnect();
      document.removeEventListener("visibilitychange", kick);
      engine?.dispose();
      setLive(false);
    };
  }, [direction, portrait, style]);

  const base = `/map/${direction}`;
  return (
    <div ref={hostRef} className={`network-map ${className}`} data-live={live ? "true" : "false"} aria-hidden="true">
      <picture>
        <source media={portraitQuery} srcSet={`${base}-portrait.webp`} />
        <img src={`${base}-landscape.webp`} alt="" decoding="async" fetchPriority="high" className="network-map__poster" />
      </picture>
      <canvas ref={canvasRef} className="network-map__canvas" />
    </div>
  );
}
