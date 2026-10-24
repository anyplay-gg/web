// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useEffect } from "react";
import { initMonitoring } from "@/lib/monitoring";

/** Mounts once in the root layout; renders nothing, and does nothing without a DSN. */
export function Monitoring() {
  useEffect(() => {
    void initMonitoring();
  }, []);
  return null;
}
