// SPDX-License-Identifier: AGPL-3.0-only
import type { CSSProperties, ReactNode } from "react";
import { Ph, type PhosphorName } from "./phosphor";

/**
 * The launcher's own surfaces, drawn in HTML for the landing at the launcher's sizes in dp
 * (launcher/docs/DESIGN.md and its gallery renders at 1600 by 900): rows, panels, toasts, key caps,
 * buttons, in Inter with Phosphor icons, with the Sunset theme's Coral accent. Names are invented,
 * games too (covers.tsx); there is no real game, cover or trophy name anywhere.
 */

export const ACCENT = "#ff8066";

/** Inter, the launcher's face, with the launcher's white-on-dark rendering. */
export const launcherFont = "font-[Inter_Variable,Inter,system-ui,sans-serif] antialiased";

export function Glyph({ name, className = "size-[18px]", style }: { name: PhosphorName; className?: string; style?: CSSProperties }) {
  return (
    <span className="inline-grid shrink-0 place-items-center" style={style}>
      <Ph name={name} className={className} />
    </span>
  );
}

/** The profile avatar: a circle in the accent, darker toward the lower right, with the first letter. */
export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full font-bold text-white"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.44), background: `linear-gradient(135deg, ${ACCENT}, rgb(255 128 102 / 0.55))` }}
    >
      {name[0]!.toUpperCase()}
    </span>
  );
}

export function VoiceWave({ bars = 10, className = "" }: { bars?: number; className?: string }) {
  return (
    <span className={`flex h-4 items-center gap-[3px] ${className}`}>
      {Array.from({ length: bars }, (_, i) => (
        <span key={i} className="voice-bar w-[3px] rounded-full" style={{ ["--i" as string]: i, background: ACCENT }} />
      ))}
    </span>
  );
}

/**
 * A panel row: 58 high, radius 12, white 0.07 at rest; the focused row is white with black ink and
 * grows 3 on every side. An info row (the player's own) has no fill. Rows that open a page end in a
 * chevron; destructive rows are red.
 */
export function Row({
  icon,
  title,
  detail,
  trailing,
  chevron = false,
  focused = false,
  info = false,
  destructive = false,
}: {
  icon?: PhosphorName;
  title: ReactNode;
  detail?: ReactNode;
  trailing?: ReactNode;
  chevron?: boolean;
  focused?: boolean;
  info?: boolean;
  destructive?: boolean;
}) {
  const ink = focused ? "text-black" : destructive ? "text-[#ff998c]" : info ? "text-white/90" : "text-white";
  return (
    <div
      className={`flex min-h-[58px] items-center gap-4 rounded-[12px] px-[22px] py-2 transition-[background-color,color,margin,box-shadow] duration-[220ms] ease-[var(--ease-out)] ${ink} ${
        focused ? "-mx-[3px] min-h-[64px] bg-white shadow-[0_0_24px_rgb(255_255_255/0.1)]" : info ? "" : "bg-white/[0.07]"
      }`}
    >
      {icon && <Glyph name={icon} style={destructive && !focused ? { color: "#ff8c80" } : undefined} />}
      <span className="min-w-0 flex-1">
        <span className="block text-[17px] leading-[1.25] font-medium">{title}</span>
        {detail && <span className={`block text-[13px] leading-[1.35] ${focused ? "text-black/55" : "text-white/55"}`}>{detail}</span>}
      </span>
      {trailing}
      {chevron && <Glyph name="caretRight" className={`size-[14px] ${focused ? "" : "opacity-60"}`} />}
    </div>
  );
}

export function Caption({ children }: { children: ReactNode }) {
  return <p className="px-[18px] pt-[22px] pb-[10px] text-[14px] font-semibold text-white/55">{children}</p>;
}

/** The side panel: gray 15 at 0.92 over the blurred home, a one-pixel left edge, 42 to its rows. */
export function Panel({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col bg-[rgb(15_15_15/0.92)] px-[42px] pt-[36px] text-white shadow-[inset_1px_0_0_rgb(255_255_255/0.08)] backdrop-blur-2xl ${className}`}
    >
      <p className="text-[30px] leading-[1.2] font-normal">{title}</p>
      {subtitle && <div className="mt-[6px] text-[16px] text-white/70">{subtitle}</div>}
      <div className="mt-[26px] flex flex-col gap-2">{children}</div>
    </div>
  );
}

/** The toast: a glass pill at the top centre, gray 18 at 0.94, radius 28, padding 22 by 14. */
export function Toast({ icon, children }: { icon: PhosphorName; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-[28px] bg-[rgb(18_18_18/0.94)] px-[22px] py-[14px] text-[16px] font-medium whitespace-nowrap text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.09),0_8px_18px_rgb(0_0_0/0.5)] backdrop-blur-xl">
      <Glyph name={icon} className="size-[18px]" style={{ color: ACCENT }} />
      {children}
    </div>
  );
}

export function Keycap({ children }: { children: ReactNode }) {
  return (
    <span className="inline-grid h-[26px] min-w-[26px] place-items-center rounded-[5px] bg-white/[0.16] px-[8px] text-[12px] font-bold text-white/90">
      {children}
    </span>
  );
}
