// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";
import { connection } from "next/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { JoinFlow } from "@/components/auth/join-flow";

// The address holds a join code. It stays out of search results, and out of the Referer of
// everything this page links to or loads.
export const metadata: Metadata = {
  title: "Invitation",
  description: "An invitation to play together on AnyPlay.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  // Per request, so Next's inline scripts carry the nonce of the script policy (src/proxy.ts).
  await connection();
  const { code } = await params;
  return (
    <AuthShell toasts={false}>
      <JoinFlow code={code} />
    </AuthShell>
  );
}
