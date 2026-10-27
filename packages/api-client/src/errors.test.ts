// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from "vitest";
import { ApiError, describeError } from "./errors";

describe("describeError", () => {
	it("shows the cloud's own words for a lockout", () => {
		const text =
			"Too many wrong codes for this e-mail address. No code works for it for the next 60 minutes. Signing in with a passkey still works.";
		expect(describeError(new ApiError("rate_limited", text, { status: 429, retryAfter: 3600 }))).toBe(text);
	});

	it("keeps the short wording for the generic limit", () => {
		const generic = new ApiError("rate_limited", "Too many requests. Wait a moment.", { status: 429, retryAfter: 12 });
		expect(describeError(generic)).toBe("Too many tries. Wait 12 seconds and try again.");
		expect(describeError(new ApiError("rate_limited", "Too many requests. Wait a moment.", { status: 429 }))).toBe(
			"Too many tries. Wait a moment and try again.",
		);
	});
});
