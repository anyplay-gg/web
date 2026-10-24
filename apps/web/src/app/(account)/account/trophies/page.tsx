// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";
import { TrophiesPage } from "@/components/account/social";

export const metadata: Metadata = { title: "Trophies" };

export default function Page() {
  return <TrophiesPage />;
}
