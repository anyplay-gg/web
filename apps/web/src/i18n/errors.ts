// SPDX-License-Identifier: AGPL-3.0-only
"use client";

import { isApiError } from "@anyplay/api-client";
import { useTranslations } from "next-intl";
import { useCallback } from "react";

const KNOWN = new Set([
  "network",
  "internal",
  "unauthorized",
  "forbidden",
  "banned",
  "not_found",
  "limit",
  "too_large",
  "code_wrong",
  "code_expired",
  "handle_taken",
  "handle_invalid",
  "rate_limited",
  "passkey_unsupported",
]);

/** True when the failure has words of ours in every language, so they win over text the cloud wrote (English). */
export const isTranslated = (e: unknown): boolean => isApiError(e) && KNOWN.has(e.code);

/**
 * The words for a failure, in the visitor's language: the translated twin of the API client's
 * `describeError`. A lockout the cloud words itself (how long, and that a passkey still works) is
 * shown as the cloud wrote it, which is English; every other failure is ours.
 */
export function useDescribeError(): (e: unknown) => string {
  const t = useTranslations("common.errors");
  return useCallback(
    (e: unknown) => {
      if (!isApiError(e)) return t("generic");
      if (e.code === "rate_limited" && e.message && !e.message.startsWith("Too many requests")) return e.message;
      if (e.code === "rate_limited" && e.retryAfter) return t("rate_limited_wait", { seconds: e.retryAfter });
      if (KNOWN.has(e.code)) return t(e.code as "network");
      return e.message || t("generic");
    },
    [t],
  );
}
