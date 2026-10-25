// SPDX-License-Identifier: AGPL-3.0-only
"use client";

/** Throws until the test sets window.__e2eHeal, so "Try again" can be shown to recover. */
export function Bomb() {
  if (typeof window === "undefined" || !(window as { __e2eHeal?: boolean }).__e2eHeal) {
    throw new Error("e2e: forced render error");
  }
  return (
    <main id="main">
      <h1>Recovered</h1>
    </main>
  );
}
