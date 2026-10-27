// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";
import { connection } from "next/server";
import { DownloadPage } from "@/components/download/download-page";

const title = "Download the launcher";
const description =
  "The AnyPlay launcher for Windows, Linux and Mac. Free and open source. Install it, sign in, and your friends are one click away.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { type: "website", siteName: "AnyPlay", title: `${title} · AnyPlay`, description, url: "/download" },
};

export default async function Page() {
  // Per request, so Next's inline scripts carry the nonce of the script policy (src/proxy.ts). The
  // release lookup inside stays cached for 15 minutes.
  await connection();
  return <DownloadPage />;
}
