// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";
import { FriendsPage } from "@/components/account/social";

export const metadata: Metadata = { title: "Friends" };

export default function Page() {
  return <FriendsPage />;
}
