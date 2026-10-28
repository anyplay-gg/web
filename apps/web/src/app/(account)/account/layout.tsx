// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { AccountShell } from "@/components/account/shell";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account.meta");
  return {
    title: { default: t("title"), template: t("template") },
    robots: { index: false },
  };
}

export default async function AccountLayout({ children }: { children: ReactNode }) {
  // Per request, so Next's inline scripts carry the nonce of the script policy (src/proxy.ts).
  await connection();
  // The account pages add the auth words too: a sensitive change asks for a code or a passkey.
  const { common, account, auth } = (await getMessages()) as Record<string, Record<string, unknown>>;
  return (
    <NextIntlClientProvider messages={{ common, account, auth }}>
      <AccountShell>{children}</AccountShell>
    </NextIntlClientProvider>
  );
}
