// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";
import { connection } from "next/server";
import { PrivacyNotice } from "@/components/legal/privacy";

export const metadata: Metadata = {
  title: "Privacy notice",
  description: "What AnyPlay keeps about you, why, for how long, and what you can do about it.",
  alternates: { canonical: "/privacy" },
};

export default async function Page() {
  // Per request, so Next's inline scripts carry the nonce of the script policy (src/proxy.ts).
  await connection();
  return <PrivacyNotice />;
}
