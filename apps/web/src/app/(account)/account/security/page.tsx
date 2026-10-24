// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";
import { SecurityPage } from "@/components/account/pages";

export const metadata: Metadata = { title: "Security" };

export default function Page() {
  return <SecurityPage />;
}
