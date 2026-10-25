// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";
import { connection } from "next/server";
import { CompatibilityPage } from "@/components/landing/compatibility";

const title = "Compatibility";
const description = "How games run with AnyPS5, from the players who answered “How did it run?”.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { type: "website", siteName: "AnyPlay", title: `${title} · AnyPlay`, description, url: "/compatibility" },
};

export default async function Page() {
  // Per request, so Next's inline scripts carry the nonce of the script policy (src/proxy.ts).
  await connection();
  return <CompatibilityPage />;
}
