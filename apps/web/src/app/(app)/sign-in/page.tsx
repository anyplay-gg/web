// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";
import { ButtonLink } from "@anyplay/ui/button";

export const metadata: Metadata = { title: "Sign in" };

/** A placeholder until the app build: sign-in, sign-up and the account pages arrive with it. */
export default function SignInPage() {
  return (
    <main className="mx-auto grid min-h-full w-full max-w-md content-center gap-6 px-[var(--gutter)] py-16">
      <h1 className="font-display text-title font-semibold text-ink">Sign in</h1>
      <p className="text-body text-ink-2 text-pretty">
        AnyPlay is not open yet. Accounts arrive with the launch, and this page becomes the place to sign in.
      </p>
      <div>
        <ButtonLink href="/" variant="secondary">
          Back to the start
        </ButtonLink>
      </div>
    </main>
  );
}
