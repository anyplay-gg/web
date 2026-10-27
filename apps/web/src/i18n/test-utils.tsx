// SPDX-License-Identifier: AGPL-3.0-only
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import type { Locale } from "./config";
import { AREAS, loadMessages } from "./messages";

/** Wraps a component under test in the real words of one language (English by default). */
export async function withIntl(ui: ReactNode, locale: Locale = "en"): Promise<ReactNode> {
  const messages = await loadMessages(locale, AREAS);
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}
