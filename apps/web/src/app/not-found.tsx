// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";
import { ButtonLink } from "@anyplay/ui/button";
import { StatusActions, StatusScreen, StatusText } from "@/components/site/status-screen";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <StatusScreen title="This page does not exist">
      <StatusText>The address may have a typo, or the page has moved. Start from the home page, or sign in to reach your account.</StatusText>
      <StatusActions>
        <ButtonLink variant="primary" href="/">
          Go to AnyPlay
        </ButtonLink>
        <ButtonLink href="/sign-in">Sign in</ButtonLink>
      </StatusActions>
    </StatusScreen>
  );
}
