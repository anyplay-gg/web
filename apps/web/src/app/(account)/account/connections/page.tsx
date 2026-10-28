// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ConnectionsPage } from "@/components/account/pages";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account.shell");
  return { title: t("nav_connections") };
}

export default function Page() {
  return (
    <Suspense>
      <ConnectionsPage />
    </Suspense>
  );
}
