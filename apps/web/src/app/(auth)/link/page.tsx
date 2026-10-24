// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";
import { connection } from "next/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { LinkFlow } from "@/components/auth/link-flow";

export const metadata: Metadata = {
  title: "Open your account",
  description: "Open your AnyPlay account in this browser, from the launcher.",
  robots: { index: false },
};

export default async function Page({ searchParams }: { searchParams: Promise<{ c?: string | string[] }> }) {
  // Per request, so Next's inline scripts carry the nonce of the script policy (src/proxy.ts).
  await connection();
  const { c } = await searchParams;
  return (
    <AuthShell>
      <LinkFlow code={typeof c === "string" ? c : ""} />
    </AuthShell>
  );
}
