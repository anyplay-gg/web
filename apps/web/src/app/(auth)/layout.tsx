// SPDX-License-Identifier: AGPL-3.0-only
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import type { ReactNode } from "react";

/** Sign-in, sign-up, device link and join: the shared words and the auth words, in the visitor's language. */
export default async function AuthLayout({ children }: { children: ReactNode }) {
  const { common, auth } = (await getMessages()) as Record<string, Record<string, unknown>>;
  return <NextIntlClientProvider messages={{ common, auth }}>{children}</NextIntlClientProvider>;
}
