// SPDX-License-Identifier: AGPL-3.0-only
import type { Metadata } from "next";
import { NotificationsPage } from "@/components/account/notifications";

export const metadata: Metadata = { title: "Notifications" };

export default function Page() {
  return <NotificationsPage />;
}
