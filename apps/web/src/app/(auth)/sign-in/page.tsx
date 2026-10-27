// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { connection } from "next/server";
import { AuthFlow } from "@/components/auth/auth-flow";
import { AuthShell } from "@/components/auth/auth-shell";
import { safeNext } from "@/lib/join";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.meta.signIn");
  return {
    title: t("title"),
    description: t("description"),
    robots: { index: false },
  };
}

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  // Per request, so Next's inline scripts carry the nonce of the script policy (src/proxy.ts).
  await connection();
  // Only a join page may be the way back (src/lib/join.ts); anything else is dropped.
  const next = safeNext((await searchParams).next);
  return (
    <AuthShell>
      <AuthFlow intent="sign_in" next={next} />
    </AuthShell>
  );
}
