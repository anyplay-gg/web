// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";
import { DataPage } from "@/components/account/pages";

export const metadata: Metadata = { title: "Your data" };

export default function Page() {
  return <DataPage />;
}
