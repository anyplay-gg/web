// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";
import { StatusActions, StatusScreen, StatusText, actionPrimary, actionSecondary } from "@/components/site/status-screen";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

// Plain anchors and the button classes written out in status-screen.tsx: this file ships with the
// root layout, so it must not pull the UI package's button (and tailwind-merge) into every page.
export default function NotFound() {
  return (
    <StatusScreen title="This page does not exist">
      <StatusText>The address may have a typo, or the page has moved. Start from the home page, or sign in to reach your account.</StatusText>
      <StatusActions>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a full load is the safe way out of a missing page */}
        <a href="/" className={actionPrimary}>
          Go to AnyPlay
        </a>
        <a href="/sign-in" className={actionSecondary}>
          Sign in
        </a>
      </StatusActions>
    </StatusScreen>
  );
}
