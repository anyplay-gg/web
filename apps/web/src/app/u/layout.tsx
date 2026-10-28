// SPDX-License-Identifier: AGPL-3.0-only
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import type { ReactNode } from "react";

/** Public profiles: the shared words and the account words, in the visitor's language. */
export default async function ProfileLayout({ children }: { children: ReactNode }) {
  const { common, account } = (await getMessages()) as Record<string, Record<string, unknown>>;
  return <NextIntlClientProvider messages={{ common, account }}>{children}</NextIntlClientProvider>;
}
