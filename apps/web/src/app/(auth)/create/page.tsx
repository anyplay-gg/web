// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";
import { connection } from "next/server";
import { AuthFlow } from "@/components/auth/auth-flow";
import { AuthShell } from "@/components/auth/auth-shell";
import { safeNext } from "@/lib/join";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Create your AnyPlay account: an e-mail address and a handle.",
  robots: { index: false },
};

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  // Per request, so Next's inline scripts carry the nonce of the script policy (src/proxy.ts).
  await connection();
  // Only a join page may be the way back (src/lib/join.ts); anything else is dropped.
  const next = safeNext((await searchParams).next);
  return (
    <AuthShell>
      <AuthFlow intent="create" next={next} />
    </AuthShell>
  );
}
