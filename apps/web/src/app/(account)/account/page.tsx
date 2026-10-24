// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";
import { OverviewPage } from "@/components/account/pages";

export const metadata: Metadata = { title: "Overview" };

export default function Page() {
  return <OverviewPage />;
}
