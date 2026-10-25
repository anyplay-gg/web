// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { useEffect } from "react";
import { ErrorScreen } from "@/components/site/error-screen";
import { captureError } from "@/lib/monitoring";
import "./globals.css";

/** The root layout itself crashed, so this page brings its own html and body and no providers. */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    void captureError(error, { digest: error.digest, boundary: "global" });
  }, [error]);
  return (
    <html lang="en">
      <body>
        <ErrorScreen digest={error.digest} retry={retry} />
      </body>
    </html>
  );
}
