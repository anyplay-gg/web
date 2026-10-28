// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import type { TrophyLevel } from "@anyplay/api-client";
import { useTranslations } from "next-intl";

/**
 * The level and how far it is to the next: the number the cloud counted (ADR 0029), drawn and
 * not computed here. The bar is ink on a dim track, never the ember colour, and the same facts are
 * in words under it, so nobody has to read the bar.
 */
export function LevelMeter({ level, className = "" }: { level: TrophyLevel; className?: string }) {
  const t = useTranslations("account.level");
  const top = level.to === null;
  const span = top ? 1 : level.to! - level.from;
  const done = top ? 1 : Math.min(1, Math.max(0, (level.points - level.from) / span));
  const left = top ? 0 : level.to! - level.points;
  const words = top ? t("top") : t("toNext", { count: left, level: level.level + 1 });

  return (
    <div className={`grid gap-2 ${className}`}>
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-[17px] font-semibold tracking-[-0.01em] tabular-nums">{t("level", { level: level.level })}</p>
        <p className="text-[13px] text-ink-3 tabular-nums">{t("points", { count: level.points })}</p>
      </div>
      <div
        role="progressbar"
        aria-label={top ? t("progress") : t("progressTo", { level: level.level + 1 })}
        aria-valuemin={0}
        aria-valuemax={top ? 1 : span}
        aria-valuenow={top ? 1 : level.points - level.from}
        aria-valuetext={words}
        className="h-1.5 overflow-hidden rounded-full bg-white/[0.1]"
      >
        <span
          className="block h-full origin-left rounded-full bg-ink transition-transform duration-[var(--duration-quick)] ease-[var(--ease-out)]"
          style={{ transform: `scaleX(${done})` }}
        />
      </div>
      <p className="text-[13px] text-ink-3 tabular-nums">{words}</p>
    </div>
  );
}
