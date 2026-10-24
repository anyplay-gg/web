// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";
import { ProfilePage } from "@/components/account/pages";

export const metadata: Metadata = { title: "Profile" };

export default function Page() {
  return <ProfilePage />;
}
