// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useEffect, useRef, useState } from "react";
import { StatusActions, StatusScreen, StatusText, actionGhost, actionPrimary, actionSecondary } from "./status-screen";

/**
 * What a crash looks like: one heading, what to do, one primary action. The stack never shows; the
 * digest does, as a short reference to quote when reporting it. No providers and no router, so the
 * same screen serves error.tsx and global-error.tsx.
 */
export function ErrorScreen({ digest, retry }: { digest?: string; retry: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  const [copied, setCopied] = useState(false);

  // A new screen replaced the page: put the reader at its heading, where the alert starts.
  useEffect(() => {
    heading.current?.focus();
  }, []);

  async function copy() {
    if (!digest) return;
    try {
      await navigator.clipboard.writeText(digest);
      setCopied(true);
    } catch {
      // The reference stays selectable on screen.
    }
  }

  return (
    <StatusScreen title="Something went wrong" headingRef={heading}>
      <div role="alert">
        <StatusText>This page failed to load. Try again, and if it keeps happening, report it with the reference below.</StatusText>
      </div>
      <StatusActions>
        <button type="button" onClick={() => retry()} className={actionPrimary}>
          Try again
        </button>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- no router here: global-error.tsx renders without one */}
        <a href="/" className={actionSecondary}>
          Go to AnyPlay
        </a>
      </StatusActions>
      {digest && (
        <p className="mt-2 flex flex-wrap items-center gap-x-3 text-[13px] text-ink-3">
          <span>
            Reference <code className="font-mono text-ink-2 select-all">{digest}</code>
          </span>
          <button type="button" onClick={copy} aria-label="Copy reference" className={actionGhost}>
            {copied ? "Copied" : "Copy"}
          </button>
          <span role="status" className="sr-only">
            {copied ? "Reference copied" : ""}
          </span>
        </p>
      )}
    </StatusScreen>
  );
}
