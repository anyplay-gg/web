// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import { useOs } from "../landing/download-button";
import type { Downloads } from "../landing/release";
import { fileRows, megabytes } from "./files";

const button =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/[0.06] px-5 text-[14px] font-semibold whitespace-nowrap text-ink shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)] select-none transition-[background-color,scale] duration-[var(--duration-quick)] ease-[var(--ease-out)] active:scale-[0.96] active:duration-[var(--duration-press)] max-sm:w-full [@media(hover:hover)]:hover:bg-white/[0.1]";

/**
 * Every file of the release as one ledger: what it is, how big, one button. The visitor's own
 * system goes first and is marked in words. Each row is a plain link to the file on GitHub.
 */
export function FileList({ downloads }: { downloads: Downloads }) {
  const os = useOs();
  const rows = fileRows(downloads);
  // The visitor's system first; the order inside a system and between the others stays as written.
  const ordered = os === "other" ? rows : [...rows.filter((r) => r.os === os), ...rows.filter((r) => r.os !== os)];

  return (
    <ul className="divide-y divide-line overflow-hidden rounded-[24px] bg-surface shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]">
      {ordered.map((r) => {
        const size = megabytes(r.file.size);
        return (
          <li key={r.id} className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6 sm:px-6 sm:py-5">
            <div className="grid grid-cols-[40px_minmax(0,1fr)] gap-4">
              <span className="grid size-10 place-items-center rounded-[12px] bg-white/[0.06] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
                <r.logo aria-hidden className="size-[18px]" />
              </span>
              <div className="min-w-0">
                <h3 className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[16px] leading-[1.3] font-semibold">
                  {r.name}
                  {r.os === os && r.main ? (
                    <span className="rounded-full bg-brand-wash px-2 py-0.5 text-[12px] leading-[1.3] font-semibold text-brand-text">Your system</span>
                  ) : null}
                </h3>
                <p className="mt-1 text-[14px] leading-[1.5] text-ink-2 text-pretty">{r.detail}</p>
                {r.note ? <p className="mt-2 max-w-[34rem] text-[14px] leading-[1.55] text-ink-3 text-pretty">{r.note}</p> : null}
              </div>
            </div>
            <div className="flex items-center gap-4 sm:justify-end">
              {size ? <span className="tnum font-mono text-[13px] text-ink-3 max-sm:hidden">{size}</span> : null}
              <a href={r.file.href} download className={button}>
                <ArrowDownTrayIcon aria-hidden className="size-4" />
                <span>
                  Download<span className="sr-only"> {r.name}{size ? `, ${size}` : ""}</span>
                </span>
                {size ? <span aria-hidden className="tnum font-mono text-[12px] font-normal text-ink-3 sm:hidden">{size}</span> : null}
              </a>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
