// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";
import { connection } from "next/server";
import { ProfilePage } from "@/components/account/profile";

type Props = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  return { title: decodeURIComponent(handle), robots: { index: false } };
}

export default async function Page({ params }: Props) {
  // Per request, so Next's inline scripts carry the nonce of the script policy (src/proxy.ts).
  await connection();
  const { handle } = await params;
  return <ProfilePage handle={decodeURIComponent(handle)} />;
}
