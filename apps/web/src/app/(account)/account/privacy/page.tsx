// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";
import { PrivacyPage } from "@/components/account/pages";

export const metadata: Metadata = { title: "Privacy" };

export default function Page() {
  return <PrivacyPage />;
}
