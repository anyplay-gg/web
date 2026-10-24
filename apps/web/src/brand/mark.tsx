// SPDX-License-Identifier: AGPL-3.0-only
import type { Direction } from "@/components/network-map/styles";

/**
 * The small mark of each direction, drawn on the 24px grid with a 2px stroke and round ends, the
 * same grid and weight as the icons next to it. All three say the same thing as the product: two or
 * three places that are joined. No controller, no console, no symbol that belongs to a platform.
 */
export function Mark({ direction, size = 28, className = "" }: { direction: Direction; size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {direction === "a" && (
        <>
          <circle cx="6" cy="17" r="3.2" />
          <circle cx="18" cy="7" r="2.2" fill="currentColor" stroke="none" />
          <path d="M8.6 14.8C11.4 12.8 13 11.6 16.2 8.6" />
        </>
      )}
      {direction === "b" && (
        <>
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="5.5" r="2.5" fill="currentColor" stroke="none" />
          <path d="M8 18.5H13.5L18.5 13.5V8.2" />
        </>
      )}
      {direction === "c" && (
        <>
          <path d="M12 4.5L4.8 18.5M12 4.5L19.2 18.5M5.6 19H18.4" />
          <circle cx="12" cy="4.5" r="2.2" fill="currentColor" />
          <circle cx="4.8" cy="18.5" r="2.2" fill="var(--ap-bg)" />
          <circle cx="19.2" cy="18.5" r="2.2" fill="var(--ap-bg)" />
        </>
      )}
    </svg>
  );
}
