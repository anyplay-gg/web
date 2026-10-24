// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { AccountShell } from "@/components/account/shell";

export const metadata: Metadata = {
  title: { default: "Your account", template: "%s · Your account · AnyPlay" },
  robots: { index: false },
};

export default async function AccountLayout({ children }: { children: ReactNode }) {
  // Per request, so Next's inline scripts carry the nonce of the script policy (src/proxy.ts).
  await connection();
  return <AccountShell>{children}</AccountShell>;
}
