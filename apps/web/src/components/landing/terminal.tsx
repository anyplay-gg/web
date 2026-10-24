// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useInView } from "@anyplay/ui/motion";
import { useEffect, useRef, useState } from "react";
import { useStill } from "./providers";

/**
 * The three commands from the cloud's README that start a whole AnyPlay cloud, typed out once when the
 * terminal scrolls into view. The typing is decoration; the full text is there for screen readers from
 * the start, and a visitor who asked for less motion sees it finished.
 */

const LINES: { kind: "cmd" | "out"; text: string }[] = [
  { kind: "cmd", text: "cd cloud/deploy" },
  { kind: "cmd", text: "cp .env.example .env" },
  { kind: "cmd", text: "docker compose up -d" },
  { kind: "out", text: "✔ Container anyplay-cloud-1  Started" },
  { kind: "out", text: "✔ Container anyplay-relay-1  Started" },
  { kind: "out", text: "✔ Container anyplay-caddy-1  Started" },
];

const TOTAL = LINES.reduce((n, l) => n + l.text.length, 0);
/** Where each line starts in the run of typed characters. */
const STARTS = LINES.map((_, i) => LINES.slice(0, i).reduce((n, l) => n + l.text.length, 0));

export function Terminal({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const still = useStill();
  const [typed, setShown] = useState(0);

  useEffect(() => {
    if (still || !inView) return;
    let n = 0;
    let line = 0;
    let used = 0;
    let timer = 0;
    const step = () => {
      const l = LINES[line];
      if (!l) return;
      // Commands type a character at a time; output lands a line at a time, like a real terminal.
      if (l.kind === "cmd") n += 1;
      else n = used + l.text.length;
      setShown(n);
      if (n >= used + l.text.length) {
        used += l.text.length;
        line += 1;
        timer = window.setTimeout(step, l.kind === "cmd" ? 380 : 260);
      } else {
        timer = window.setTimeout(step, 34 + Math.random() * 40);
      }
    };
    timer = window.setTimeout(step, 400);
    return () => clearTimeout(timer);
  }, [inView, still]);

  const shown = still ? TOTAL : typed;
  const done = shown >= TOTAL;
  const rows = LINES.map((l, i) => {
    const start = STARTS[i]!;
    const visible = Math.max(0, Math.min(l.text.length, shown - start));
    const current = !done && shown >= start && shown < start + l.text.length;
    if (visible === 0 && !(current && l.kind === "cmd")) return null;
    return (
      <span key={i} className="block">
        {l.kind === "cmd" ? (
          <>
            <span className="text-[#ff7a3d]">$ </span>
            <span className="text-[#f6f5f1]">{l.text.slice(0, visible)}</span>
          </>
        ) : (
          <span className="text-[#7fe3b0]">{l.text.slice(0, visible)}</span>
        )}
        {current && <Caret />}
      </span>
    );
  });

  return (
    <div
      ref={ref}
      className={`overflow-hidden rounded-[18px] bg-[#0b0a09]/85 shadow-[0_0_0_1px_rgb(255_255_255/0.09),inset_0_1px_0_rgb(255_255_255/0.06),0_30px_70px_-30px_rgb(0_0_0/0.8)] backdrop-blur-md ${className}`}
    >
      <div className="flex h-9 items-center gap-2 border-b border-white/[0.06] px-3.5">
        <span className="size-2.5 rounded-full bg-white/15" />
        <span className="size-2.5 rounded-full bg-white/15" />
        <span className="size-2.5 rounded-full bg-white/15" />
        <span className="ml-2 font-mono text-[11px] text-[#8f8b84]">your-server</span>
      </div>
      <pre className="sr-only">{LINES.map((l) => (l.kind === "cmd" ? `$ ${l.text}` : l.text)).join("\n")}</pre>
      <pre aria-hidden className="min-h-[188px] px-4 py-3.5 font-mono text-[10.5px] leading-[1.75] whitespace-pre-wrap sm:text-[12.5px]">
        {rows}
        {done && (
          <span className="block">
            <span className="text-[#ff7a3d]">$ </span>
            <Caret />
          </span>
        )}
      </pre>
    </div>
  );
}

function Caret() {
  return <span className="caret ml-px inline-block h-[1.1em] w-[7px] translate-y-[3px] bg-[#f6f5f1]" />;
}
