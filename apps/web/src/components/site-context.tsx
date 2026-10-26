// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { createContext, type ReactNode, useContext } from "react";
import type { Site } from "@/lib/site";

/** The instance's own values, read on the server by the root layout and handed to client components. */
const SiteContext = createContext<Site>({ url: null, host: null, discord: null });

export function SiteProvider({ site, children }: { site: Site; children: ReactNode }) {
  return <SiteContext.Provider value={site}>{children}</SiteContext.Provider>;
}

export function useSite(): Site {
  return useContext(SiteContext);
}
