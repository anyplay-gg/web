// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";
import { connection } from "next/server";
import { AuthFlow } from "@/components/auth/auth-flow";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Create your AnyPlay account: an e-mail address and a handle.",
  robots: { index: false },
};

export default async function Page() {
  // Per request, so Next's inline scripts carry the nonce of the script policy (src/proxy.ts).
  await connection();
  return (
    <AuthShell>
      <AuthFlow intent="create" />
    </AuthShell>
  );
}
