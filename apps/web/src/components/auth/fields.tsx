// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { type InputHTMLAttributes, type ReactNode, useEffect, useId, useRef } from "react";

/**
 * The controls of the sign-in pages, on the landing's night palette: one label above each field,
 * the problem under it (named by aria-describedby, so a screen reader reads it with the field),
 * 48 px high so a thumb hits them, and the browser's own focus ring in the ember focus colour.
 */

const control =
  "h-12 w-full rounded-[14px] bg-white/[0.04] px-4 text-[16px] text-ink shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)] transition-[background-color,box-shadow] duration-[var(--duration-quick)] outline-none placeholder:text-ink-3 focus:bg-white/[0.06] focus:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.22),0_0_0_3px_rgb(255_122_61/0.35)] aria-[invalid=true]:shadow-[inset_0_0_0_1px_#ff8c80]";

export const primaryButton =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#f6f5f1] px-6 text-[15px] font-semibold text-[#161513] shadow-[inset_0_-1px_0_rgb(0_0_0/0.12),0_1px_2px_rgb(0_0_0/0.4),0_10px_30px_-10px_rgb(255_90_31/0.45)] transition-[background-color,scale,opacity] duration-[var(--duration-quick)] ease-[var(--ease-out)] select-none active:scale-[0.96] disabled:opacity-60 [@media(hover:hover)]:hover:bg-white";

export const secondaryButton =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white/[0.06] px-6 text-[15px] font-semibold text-ink shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)] transition-[background-color,scale] duration-[var(--duration-quick)] ease-[var(--ease-out)] select-none active:scale-[0.96] [@media(hover:hover)]:hover:bg-white/[0.1]";

export const textButton =
  "inline-flex min-h-9 [@media(pointer:coarse)]:min-h-11 items-center rounded-full px-2 text-[14px] font-medium text-brand-text transition-colors duration-[var(--duration-quick)] disabled:text-ink-3 [@media(hover:hover)]:hover:text-ink";

/**
 * The problem under a field. The alert container is always in the page and only its text comes
 * and goes, because a screen reader announces text added to a live region that already exists far
 * more reliably than one that appears together with its text. Empty, it takes no room (the grid's
 * gap above it is pulled back).
 */
function FieldError({
  id,
  className = "",
  pull = "empty:-mt-2",
  children,
}: {
  id: string;
  className?: string;
  /** Pulls the empty container back by the gap of the grid it sits in (gap-2 in TextField, gap-1.5 in CheckField). */
  pull?: "empty:-mt-2" | "empty:-mt-1.5";
  children?: ReactNode;
}) {
  return (
    <div role="alert" id={id} className={pull}>
      {children && <p className={`text-[14px] leading-[1.45] text-[#ff9a8a] ${className}`}>{children}</p>}
    </div>
  );
}

export function TextField({
  label,
  hint,
  error,
  className = "",
  ...input
}: { label: string; hint?: ReactNode; error?: string | null } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  // The hint makes way for the problem while there is one; both often say the same.
  const showHint = hint && !error;
  const described = (error ? `${id}-error` : showHint ? `${id}-hint` : undefined) as string | undefined;
  return (
    <div className={`grid gap-2 ${className}`}>
      <label htmlFor={id} className="text-[14px] font-medium text-ink-2">
        {label}
      </label>
      <input id={id} aria-invalid={error ? true : undefined} aria-describedby={described} className={control} {...input} />
      <FieldError id={`${id}-error`}>{error}</FieldError>
      {showHint && (
        <p id={`${id}-hint`} className="text-[13px] leading-[1.45] text-ink-3">
          {hint}
        </p>
      )}
    </div>
  );
}

export function CheckField({
  children,
  hint,
  error,
  checked,
  onChange,
  name,
}: {
  children: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  checked: boolean;
  onChange: (checked: boolean) => void;
  name: string;
}) {
  const id = useId();
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-[15px] leading-[1.45] text-ink">
        <input
          id={id}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-0.5 size-5 shrink-0 cursor-pointer accent-[#ff7a3d]"
        />
        <span>
          {children}
          {hint && <span className="mt-0.5 block text-[13px] text-ink-3">{hint}</span>}
        </span>
      </label>
      <FieldError id={`${id}-error`} className="pl-8" pull="empty:-mt-1.5">
        {error}
      </FieldError>
    </div>
  );
}

/**
 * The six digits of an e-mail code. One real input (so paste, autofill from the mail app and screen
 * readers all work as with any field) under six boxes that show what was typed.
 */
export function CodeField({
  value,
  onChange,
  error,
  disabled,
}: {
  value: string;
  onChange: (code: string) => void;
  error?: string | null;
  disabled?: boolean;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  // A wrong code clears the field. Put the caret back, so the next try needs no tap and a phone's
  // keyboard stays up.
  useEffect(() => {
    if (error) input.current?.focus({ preventScroll: true });
  }, [error]);
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-[14px] font-medium text-ink-2">
        Code
      </label>
      <div className="group relative" data-busy={disabled ? "" : undefined}>
        {/* Not `disabled`: a disabled input drops the focus (and the phone's keyboard) while the code is checked. */}
        <input
          ref={input}
          id={id}
          value={value}
          onChange={(e) => {
            if (disabled) return;
            onChange(e.target.value.replace(/\D/g, "").slice(0, 6));
          }}
          inputMode="numeric"
          enterKeyHint="go"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          aria-disabled={disabled || undefined}
          aria-busy={disabled || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="absolute inset-0 z-10 h-full w-full cursor-text opacity-0"
        />
        <div aria-hidden className="grid grid-cols-6 gap-2">
          {Array.from({ length: 6 }, (_, i) => {
            const active = i === Math.min(value.length, 5);
            return (
              <span
                key={i}
                className={`grid h-14 place-items-center rounded-[14px] bg-white/[0.04] font-mono text-[22px] text-ink tabular-nums transition-[box-shadow,background-color,opacity] duration-[var(--duration-quick)] group-data-[busy]:opacity-60 ${
                  error
                    ? "shadow-[inset_0_0_0_1px_#ff8c80]"
                    : active
                      ? "shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)] group-focus-within:bg-white/[0.06] group-focus-within:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.24),0_0_0_3px_rgb(255_122_61/0.35)]"
                      : "shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)]"
                }`}
              >
                {value[i] ?? ""}
              </span>
            );
          })}
        </div>
      </div>
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  );
}

export function FormError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-[14px] bg-[#ff5a3d]/10 px-4 py-3 text-[14px] leading-[1.45] text-[#ffb3a6] shadow-[inset_0_0_0_1px_rgb(255_140_128/0.25)]">
      {children}
    </p>
  );
}
