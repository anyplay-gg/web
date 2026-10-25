// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";
import { connection } from "next/server";
import { TermsOfUse } from "@/components/legal/terms";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "The rules for using AnyPlay, how we moderate, and how you can appeal.",
  alternates: { canonical: "/terms" },
};

export default async function Page() {
  // Per request, so Next's inline scripts carry the nonce of the script policy (src/proxy.ts).
  await connection();
  return <TermsOfUse />;
}
