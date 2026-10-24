// SPDX-License-Identifier: AGPL-3.0-only
// Adapted from anyplay-gg/cloud (portal-react, same project and licence): the data layer only.
import type { StepUpMethod } from "./types";

/**
 * Every failure the API layer reports, so screens branch on `code` and never on a status. The
 * cloud's own codes (`spec/portal-api.md`) keep their names; the rest are the client's.
 */
export type ApiErrorCode =
	| "network" // the request never got an answer
	| "bad_request"
	| "code_wrong"
	| "code_expired"
	| "handle_invalid"
	| "handle_taken"
	| "unauthorized" // no live session, or a wrong CSRF token
	| "banned"
	| "forbidden"
	| "step_up_required" // the action needs a recent sign-in
	| "not_found"
	| "unsupported_media_type"
	| "limit"
	| "too_large"
	| "rate_limited"
	| "internal"
	| "passkey_cancelled" // the person closed the browser's passkey sheet
	| "passkey_unsupported"
	| "unknown";

const KNOWN: ReadonlySet<string> = new Set<ApiErrorCode>([
	"bad_request",
	"code_wrong",
	"code_expired",
	"handle_invalid",
	"handle_taken",
	"unauthorized",
	"banned",
	"forbidden",
	"step_up_required",
	"not_found",
	"unsupported_media_type",
	"limit",
	"too_large",
	"rate_limited",
	"internal",
]);

export const asErrorCode = (code: unknown, status: number): ApiErrorCode => {
	if (typeof code === "string" && KNOWN.has(code)) return code as ApiErrorCode;
	if (status >= 500) return "internal";
	if (status === 401) return "unauthorized";
	if (status === 404) return "not_found";
	if (status === 429) return "rate_limited";
	return "unknown";
};

export class ApiError extends Error {
	readonly code: ApiErrorCode;
	readonly status: number;
	/** Messages for the input named by the cloud's `field`, keyed by that name. */
	readonly fields: Record<string, string>;
	/** For `step_up_required`: how the player can prove it is them. Filled in by the client. */
	readonly methods: StepUpMethod[];
	/** For `rate_limited`: seconds to wait, from `Retry-After`. */
	readonly retryAfter: number | null;

	constructor(
		code: ApiErrorCode,
		message: string,
		options: {
			status?: number;
			fields?: Record<string, string>;
			methods?: StepUpMethod[];
			retryAfter?: number | null;
		} = {},
	) {
		super(message);
		this.name = "ApiError";
		this.code = code;
		this.status = options.status ?? 0;
		this.fields = options.fields ?? {};
		this.methods = options.methods ?? [];
		this.retryAfter = options.retryAfter ?? null;
	}
}

export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError;
export const isStepUp = (e: unknown): e is ApiError =>
	isApiError(e) && e.code === "step_up_required";

/**
 * English text for a failure the screen has no better words for. The wording is part of the
 * product copy (sentence case, what happened, what to do), so it lives next to the codes; an
 * app with several languages passes its own table to `describeError`.
 */
export const defaultMessages = {
	generic: "Something went wrong. Try again.",
	network: "Can’t reach AnyPlay. Check your connection and try again.",
	internal: "AnyPlay had a problem on its side. Try again in a minute.",
	unauthorized: "Your session ended. Sign in again.",
	forbidden: "You can’t do that with this account.",
	banned: "This account is banned.",
	not_found: "That doesn’t exist any more.",
	limit: "You’ve reached the limit for this. Remove one first.",
	too_large: "That is too large to send.",
	code_wrong: "That code is wrong. Check it and try again.",
	code_expired: "That code has expired. Request a new one.",
	handle_taken: "That handle is taken. Try another.",
	handle_invalid: "Use 3 to 16 letters, digits, hyphens or underscores. Start with a letter.",
	rate_limited: "Too many tries. Wait a moment and try again.",
	passkey_unsupported: "This browser can’t use passkeys. Use the e-mail code instead.",
} as const;

export function describeError(e: unknown, messages: Record<string, string> = defaultMessages): string {
	const text = (key: string) => messages[key] ?? defaultMessages.generic;
	if (!isApiError(e)) return text("generic");
	if (e.code === "rate_limited" && e.retryAfter) return `Too many tries. Wait ${e.retryAfter} seconds and try again.`;
	if (e.code in defaultMessages) return text(e.code);
	return e.message || text("generic");
}
