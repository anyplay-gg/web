// SPDX-License-Identifier: AGPL-3.0-only
import type { Direction } from "@/components/network-map/styles";
import { MAP_NOTE } from "./copy";

/**
 * The key of the map. It is on a solid surface on purpose: the map is bright behind it, and a
 * measured text pair (ink-3 on surface) is worth more than a hopeful one over moving light.
 */
export function Legend({ direction, className = "" }: { direction: Direction; className?: string }) {
  const relay =
    direction === "b" ? (
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <circle cx="9" cy="9" r="6.4" fill="var(--ap-surface)" stroke="var(--ap-ink)" strokeWidth="2.4" />
        <circle cx="9" cy="9" r="2" fill="var(--ap-brand)" />
      </svg>
    ) : (
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <circle cx="9" cy="9" r="6.4" fill="none" stroke="var(--ap-brand)" strokeWidth="1.8" />
        <circle cx="9" cy="9" r="2.4" fill="var(--ap-brand)" />
      </svg>
    );
  return (
    <div className={`rounded-control border border-line bg-surface px-3 py-2.5 ${className}`}>
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-micro font-medium text-ink-2">
        <li className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <circle cx="9" cy="9" r="3" fill={direction === "b" ? "var(--ap-ink)" : "var(--ap-ink-2)"} />
          </svg>
          Player
        </li>
        <li className="flex items-center gap-2">
          {relay}
          Relay
        </li>
        <li className="flex items-center gap-2">
          <svg width="22" height="18" viewBox="0 0 22 18" aria-hidden="true">
            <path d="M2 9H20" stroke="var(--ap-ink-2)" strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round" />
          </svg>
          Direct link
        </li>
      </ul>
      <p className="mt-1.5 font-mono text-micro text-ink-3 text-pretty">{MAP_NOTE}</p>
    </div>
  );
}
