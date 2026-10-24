// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";
import { connection } from "next/server";
import { Landing } from "@/components/landing/landing";

const title = "AnyPlay · Play your games together";
const description =
  "Until now, you played your AnyPS5 games alone. AnyPlay brings your friends in: play online together, party up and talk, on an open network that anyone can host.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  openGraph: { type: "website", siteName: "AnyPlay", title, description, url: "/" },
  twitter: { card: "summary", title, description },
};

export default async function Home() {
  // Rendered per request: the script policy (src/proxy.ts) gives every response its own nonce, and
  // only a page rendered for that request carries it on Next's inline scripts. The release lookup
  // inside stays cached for 15 minutes all the same.
  await connection();
  return <Landing />;
}
