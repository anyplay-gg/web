// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";
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

export default function Home() {
  return <Landing />;
}
