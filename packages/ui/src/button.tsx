// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { Button as BaseButton } from "@base-ui/react/button";
import type { ComponentProps } from "react";
import { cn } from "./cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "sm";

/**
 * Class lists per variant. One primary action per view: an ink fill, like the launcher's focused
 * tile. Everything else is a quiet surface. Danger is a quiet surface with the critical colour, so a
 * destructive action never shouts louder than the safe one next to it.
 *
 * Press: scale 0.96 over 100ms, so the control answers on pointer-down. Hover only where a pointer
 * exists, so a tap does not leave a stuck hover. Only the named properties transition.
 * Hit area: 44px tall on touch, 40px with a pointer (36px for the small size, which is only used
 * inside rows where the row itself is the larger target).
 */
export function buttonClass(variant: Variant = "secondary", extra?: string, size: Size = "md"): string {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-control font-semibold whitespace-nowrap select-none",
    size === "md" && "min-h-11 px-4 text-small [@media(pointer:fine)]:min-h-10",
    size === "sm" && "min-h-9 px-3 text-small",
    "transition-[background-color,color,border-color,scale] duration-[var(--duration-quick)] ease-[var(--ease-out)] active:scale-[0.96] active:duration-[var(--duration-press)]",
    "disabled:pointer-events-none disabled:opacity-50 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
    variant === "primary" && "bg-primary text-primary-ink [@media(hover:hover)]:hover:bg-ink-2",
    variant === "secondary" &&
      "border border-line bg-surface-2 text-ink [@media(hover:hover)]:hover:border-line-strong",
    variant === "ghost" && "text-ink-2 [@media(hover:hover)]:hover:bg-surface-2 [@media(hover:hover)]:hover:text-ink",
    variant === "danger" &&
      "border border-line bg-surface-2 text-critical-text [@media(hover:hover)]:hover:border-critical",
    extra,
  );
}

export function Button({
  variant = "secondary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof BaseButton> & { variant?: Variant; size?: Size }) {
  return <BaseButton className={buttonClass(variant, typeof className === "string" ? className : undefined, size)} {...props} />;
}

/** A link that looks like a button: a real anchor, so it opens in a new tab and shows its address. */
export function ButtonLink({
  variant = "secondary",
  size = "md",
  className,
  ...props
}: ComponentProps<"a"> & { variant?: Variant; size?: Size }) {
  return <a className={buttonClass(variant, className, size)} {...props} />;
}
