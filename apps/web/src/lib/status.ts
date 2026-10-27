// SPDX-License-Identifier: AGPL-3.0-only
// The public status of the cloud: what GET /v1/status answers, checked, and read for the status page.
// The page reads it on the server, so the browser never needs to reach the cloud's internal address.

export type PartId = "api" | "database" | "signalling" | "relay" | "web";
export type PartState = "up" | "down" | "unknown";
export type Overall = "operational" | "degraded" | "outage" | "unreachable";

export type Status = {
  overall: Overall;
  /** Unix milliseconds of the cloud's last check, or of our attempt when it did not answer. */
  checked: number;
  parts: Record<PartId, PartState>;
};

export const PART_IDS: readonly PartId[] = ["api", "database", "signalling", "relay", "web"];

const STATES: readonly string[] = ["up", "down", "unknown"];
const OVERALL: readonly string[] = ["operational", "degraded", "outage"];

type Parsed = Omit<Status, "overall"> & { overall: Exclude<Overall, "unreachable"> };

/** Accepts the cloud's answer only in its exact shape; anything else counts as no answer. */
export function parseStatus(body: unknown): Parsed | null {
  if (typeof body !== "object" || body === null) return null;
  const { status, checked, components } = body as Record<string, unknown>;
  if (typeof status !== "string" || !OVERALL.includes(status)) return null;
  if (typeof checked !== "number" || !Number.isFinite(checked)) return null;
  if (!Array.isArray(components)) return null;
  const parts: Record<PartId, PartState> = {
    api: "unknown",
    database: "unknown",
    signalling: "unknown",
    relay: "unknown",
    web: "unknown",
  };
  for (const c of components) {
    if (typeof c !== "object" || c === null) return null;
    const { id, status: state } = c as Record<string, unknown>;
    if (typeof id !== "string" || typeof state !== "string" || !STATES.includes(state)) return null;
    if ((PART_IDS as readonly string[]).includes(id)) parts[id as PartId] = state as PartState;
  }
  return { overall: status as Parsed["overall"], checked, parts };
}

/**
 * Asks the cloud. When it does not answer in time, the API is down and nothing else is known; the
 * website part is up either way, because this page is being served by it.
 */
export async function loadStatus(
  env: Record<string, string | undefined> = process.env,
  fetcher: typeof fetch = fetch,
  now: () => number = Date.now,
): Promise<Status> {
  const base = (env.CLOUD_URL?.trim() || "http://cloud:8080").replace(/\/+$/, "");
  let parsed: Parsed | null = null;
  try {
    const response = await fetcher(`${base}/v1/status`, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (response.ok) parsed = parseStatus(await response.json());
  } catch {
    parsed = null;
  }
  if (!parsed) {
    return {
      overall: "unreachable",
      checked: now(),
      parts: { api: "down", database: "unknown", signalling: "unknown", relay: "unknown", web: "up" },
    };
  }
  return { ...parsed, parts: { ...parsed.parts, web: parsed.parts.web === "unknown" ? "up" : parsed.parts.web } };
}
