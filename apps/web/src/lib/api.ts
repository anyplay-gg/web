// SPDX-License-Identifier: AGPL-3.0-only
import type { PortalApi } from "@anyplay/api-client";

let api: Promise<PortalApi> | null = null;

/**
 * The one client the browser talks to the cloud with, made once per page. In development the mock
 * stands in for the cloud, so every screen runs without one (`?mock=empty`, `?mock=handoff`, ...).
 */
export function loadApi(): Promise<PortalApi> {
  api ??=
    process.env.NODE_ENV === "development"
      ? import("@anyplay/api-client/mock").then(({ createMockApi, parseScenario }) =>
          createMockApi({ scenario: parseScenario(window.location.search) }),
        )
      : import("@anyplay/api-client").then(({ createHttpApi }) => createHttpApi());
  return api;
}
