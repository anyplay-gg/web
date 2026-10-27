// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import { useOs } from "../landing/download-button";
import { pillGlass, pillLight } from "../landing/pills";
import type { Downloads } from "../landing/release";
import { fileRows, megabytes } from "./files";

/**
 * The one button of the page, for the visitor's own system. The first render answers for Windows
 * (the server cannot know), and a Mac or Linux visitor sees it change once, at once. A phone or a
 * tablet gets no button: the launcher is for computers, and saying so beats a download that cannot run.
 */
export function PrimaryDownload({ downloads }: { downloads: Downloads }) {
  const os = useOs();
  const rows = fileRows(downloads);

  if (os === "other") {
    return (
      <div className="flex flex-col items-start gap-5">
        <p className="max-w-[28rem] text-[17px] leading-[1.6] text-ink-2 text-pretty">
          The launcher runs on a computer. Open this page there, or pick the system you will use below.
        </p>
        <a href="#files" className={pillGlass}>
          See all downloads
        </a>
      </div>
    );
  }

  const row = rows.find((r) => r.os === os && r.main)!;
  const size = megabytes(row.file.size);
  const label = os === "windows" ? "Download for Windows" : os === "mac" ? "Download for macOS" : "Download for Linux";

  return (
    <div className="flex flex-col items-start gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <a href={row.file.href} download className={pillLight}>
          <ArrowDownTrayIcon aria-hidden className="size-[18px]" />
          {label}
        </a>
        <a href="#files" className={pillGlass}>
          Other systems and files
        </a>
      </div>
      <p className="text-[14px] leading-[1.5] text-ink-3">
        {row.name}
        {os === "mac" ? ", Apple silicon" : null}
        {size ? (
          <>
            {" · "}
            <span className="tnum">{size}</span>
          </>
        ) : null}
        {downloads.version ? (
          <>
            {" · version "}
            <span className="tnum">{downloads.version}</span>
          </>
        ) : null}
      </p>
    </div>
  );
}
