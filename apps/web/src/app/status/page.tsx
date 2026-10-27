// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";
import { connection } from "next/server";
import { StatusPage } from "@/components/status/status-page";
import { loadStatus } from "@/lib/status";

const description = "Whether AnyPlay’s cloud, relay and website are working right now.";

export const metadata: Metadata = {
  title: "Status",
  description,
  alternates: { canonical: "/status" },
  openGraph: { type: "website", siteName: "AnyPlay", title: "Status · AnyPlay", description, url: "/status" },
};

export default async function Page() {
  // Per request: the status is only worth anything when it is current, and Next's inline scripts
  // carry the nonce of the script policy (src/proxy.ts).
  await connection();
  return <StatusPage status={await loadStatus()} />;
}
