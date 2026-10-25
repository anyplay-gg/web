// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useEffect } from "react";
import { ErrorScreen } from "@/components/site/error-screen";
import { captureError } from "@/lib/monitoring";

/** A route crashed while rendering: report it once, show the way out. The layout stays. */
export default function RouteError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    void captureError(error, { digest: error.digest, boundary: "route" });
  }, [error]);
  return <ErrorScreen digest={error.digest} retry={retry} />;
}
