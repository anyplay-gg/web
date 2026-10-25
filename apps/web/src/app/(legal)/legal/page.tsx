// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";
import { connection } from "next/server";
import { LegalNotice } from "@/components/legal/notice";

export const metadata: Metadata = {
  title: "Legal notice",
  description: "Who runs AnyPlay, and how to reach them.",
  alternates: { canonical: "/legal" },
};

export default async function Page() {
  // Per request, so Next's inline scripts carry the nonce of the script policy (src/proxy.ts).
  await connection();
  return <LegalNotice />;
}
