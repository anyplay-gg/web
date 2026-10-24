// SPDX-License-Identifier: AGPL-3.0-only
import { PROOF } from "./copy";

/** What is true and can be checked, in three lines. Led by the claim, not by a decoration. */
export function Proof({ className = "" }: { className?: string }) {
  return (
    <ul className={`grid gap-6 sm:grid-cols-3 sm:gap-8 ${className}`}>
      {PROOF.map((p) => (
        <li key={p.title} className="border-t border-line-strong pt-4">
          <p className="text-small font-semibold text-ink">{p.title}</p>
          <p className="mt-1 max-w-[30ch] text-small text-ink-2 text-pretty">{p.text}</p>
        </li>
      ))}
    </ul>
  );
}
