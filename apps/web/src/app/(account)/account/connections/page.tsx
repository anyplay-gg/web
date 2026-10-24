// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";
import { Suspense } from "react";
import { ConnectionsPage } from "@/components/account/pages";

export const metadata: Metadata = { title: "Connections" };

export default function Page() {
  return (
    <Suspense>
      <ConnectionsPage />
    </Suspense>
  );
}
