// SPDX-License-Identifier: AGPL-3.0-only
// The typed client of the portal API (`/web/api/v1`, spec/portal-api.md in anyplaynet/network).
// Two adapters satisfy `PortalApi`: `createHttpApi` talks to the cloud on the same origin, and
// `createMockApi` (from "./mock/adapter") keeps everything in memory so the app runs and can be
// photographed without a backend. Screens depend on the interface, never on an adapter.
export { ApiError, describeError, defaultMessages, isApiError, isStepUp } from "./errors";
export { createHttpApi } from "./http-adapter";
export type { HttpApiOptions } from "./http-adapter";
export type { PortalApi } from "./portal-api";
export * from "./types";
