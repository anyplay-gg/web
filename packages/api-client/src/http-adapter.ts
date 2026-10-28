// SPDX-License-Identifier: AGPL-3.0-only
// Adapted from anyplaynet/cloud (portal-react, same project and licence): the data layer only.
import { camelize, snakeize } from "./case";
import { ApiError, asErrorCode } from "./errors";
import type { PortalApi } from "./portal-api";
import type {
	LinkedAccount,
	AccountView,
	BoardPage,
	CompatList,
	PushDevice,
	PushState,
	BanStatement,
	FriendLists,
	JoinView,
	Passkey,
	Privacy,
	Profile,
	PublicUser,
	SessionView,
	StepUpMethod,
	TrophyCompare,
	TrophySummary,
} from "./types";
import {
	type CredentialJSON,
	createCredential,
	getAssertion,
	passkeySupport,
	type RequestOptionsJSON,
} from "./webauthn";

export interface HttpApiOptions {
	/** Defaults to the same origin: the cloud serves the portal and the API together. */
	baseUrl?: string;
	fetch?: typeof fetch;
}

interface ErrorBody {
	error?: string;
	message?: string;
	field?: string;
}

const JSON_TYPE = "application/json";

/** GET /me/links answers this per provider, camelized. */
interface LinkView {
	provider: LinkedAccount["provider"];
	available: boolean;
	linked: boolean;
	externalId: string | null;
	displayName: string | null;
	avatarUrl: string | null;
	profileUrl: string | null;
	linkedAt: number | null;
	visibility: LinkedAccount["audience"] | null;
}

export function createHttpApi(options: HttpApiOptions = {}): PortalApi {
	const base = `${options.baseUrl ?? ""}/web/api/v1`;
	const doFetch: typeof fetch = options.fetch ?? ((...a) => fetch(...a));
	let csrf: string | null = null;
	let passkeyCount = 0;

	async function raw(
		method: string,
		path: string,
		body?: unknown,
		extra: { signal?: AbortSignal; contentType?: string; rawBody?: BodyInit } = {},
	) {
		const headers: Record<string, string> = { Accept: JSON_TYPE };
		const write = method !== "GET";
		if (write) {
			// every write is JSON, even an empty one: the cloud refuses anything else
			headers["Content-Type"] = extra.contentType ?? JSON_TYPE;
			if (csrf === null) await session();
			if (csrf) headers["X-CSRF-Token"] = csrf;
		}
		let res: Response;
		try {
			res = await doFetch(`${base}${path}`, {
				method,
				headers,
				credentials: "same-origin",
				body: extra.rawBody ?? (write ? JSON.stringify(body ?? {}) : undefined),
				signal: extra.signal,
			});
		} catch (e) {
			if (e instanceof DOMException && e.name === "AbortError") {
				throw new ApiError("passkey_cancelled", "Request cancelled.");
			}
			throw new ApiError("network", "Can't reach AnyPlay.");
		}
		if (res.ok) return res;

		let parsed: ErrorBody = {};
		try {
			parsed = (await res.json()) as ErrorBody;
		} catch {
			// not JSON (an origin-guard refusal is HTML); the status is all we have
		}
		const code = asErrorCode(parsed.error, res.status);
		const retry = Number(res.headers.get("retry-after"));
		throw new ApiError(code, parsed.message ?? "The request failed.", {
			status: res.status,
			fields: parsed.field && parsed.message ? { [parsed.field]: parsed.message } : {},
			methods: code === "step_up_required" ? stepUpMethods() : [],
			retryAfter: Number.isFinite(retry) && retry > 0 ? retry : null,
		});
	}

	const stepUpMethods = (): StepUpMethod[] =>
		passkeyCount > 0 ? ["passkey", "email_code"] : ["email_code"];

	async function json<T>(
		method: string,
		path: string,
		body?: unknown,
		extra?: { signal?: AbortSignal },
	): Promise<T> {
		const res = await raw(method, path, body, extra);
		if (res.status === 204) return undefined as T;
		return camelize<T>(await res.json());
	}

	async function session(): Promise<SessionView> {
		let res: Response;
		try {
			res = await doFetch(`${base}/session`, {
				headers: { Accept: JSON_TYPE },
				credentials: "same-origin",
			});
		} catch {
			throw new ApiError("network", "Can't reach AnyPlay.");
		}
		if (!res.ok)
			throw new ApiError(asErrorCode(undefined, res.status), "Session check failed.", {
				status: res.status,
			});
		let view: SessionView;
		try {
			view = camelize<SessionView>(await res.json());
		} catch {
			// something answered, but not the API (static files with no cloud behind them)
			throw new ApiError("network", "That is not the AnyPlay API.", { status: res.status });
		}
		csrf = view.csrf;
		return view;
	}

	/** A step answers with the session view; a handoff or sign-in changes the session's token. */
	const step = async (path: string, body?: unknown): Promise<SessionView> => {
		const view = await json<SessionView>("POST", path, body);
		csrf = view.csrf;
		return view;
	};

	const passkeyRound = async (
		verifyPath: string,
		{ conditional, signal }: { conditional: boolean; signal?: AbortSignal },
	) => {
		const { options, id } = await json<{ options: RequestOptionsJSON; id: string }>(
			"POST",
			"/passkey/sign-in/start",
			{},
			{ signal },
		);
		const credential: CredentialJSON = await getAssertion(options, { conditional, signal });
		return { verifyPath, body: { id, credential } };
	};

	return {
		mode: "http",
		session,

		auth: {
			start: (input) => step("/sign-in/email", input),
			resendCode: () => step("/sign-in/code/resend"),
			verifyCode: (code) => step("/sign-in/code", { code }),
			submitDetails: (input) => step("/sign-up/details", snakeize(input)),
			acceptTerms: () => step("/terms", { accept: true }),
			passkeySupport,
			signInWithPasskey: async (opts) => {
				const { verifyPath, body } = await passkeyRound("/passkey/sign-in/finish", opts);
				return step(verifyPath, body);
			},
			signOut: async () => {
				await json("POST", "/sign-out");
				csrf = null;
			},
			ban: () => json<BanStatement>("GET", "/ban"),
			appeal: async (text) => {
				await json("POST", "/ban/appeal", { text });
			},
		},

		join: {
			get: (code) => json<JoinView>("GET", `/join/${encodeURIComponent(code)}`),
		},

		link: {
			peek: (code) => json<{ handle: string }>("GET", `/link/${encodeURIComponent(code)}`),
			open: (code) => step(`/link/${encodeURIComponent(code)}`),
		},

		account: {
			get: async () => {
				const view = await json<AccountView>("GET", "/account");
				passkeyCount = view.passkeys.length;
				return view;
			},
			changeEmail: async (email) => {
				await json("POST", "/account/email", { email });
			},
			confirmEmail: async (code) =>
				(await json<{ email: string }>("POST", "/account/email/confirm", { code })).email,
			profile: () => json<Profile>("GET", "/me/profile"),
			updateProfile: (input) => json<Profile>("PATCH", "/me/profile", input),
			setAvatar: async (file) => {
				const type = file.type === "image/png" ? "image/png" : "image/jpeg";
				const res = await raw("PUT", "/me/avatar", undefined, { contentType: type, rawBody: file });
				return camelize<{ avatar: string }>(await res.json()).avatar;
			},
			removeAvatar: async () => {
				await json("DELETE", "/me/avatar");
			},
			privacy: () => json<Privacy>("GET", "/me/privacy"),
			updatePrivacy: (input) => json<Privacy>("PUT", "/me/privacy", input),
			appearOffline: async () =>
				(await json<{ appearOffline: boolean }>("GET", "/me/appear-offline")).appearOffline,
			setAppearOffline: async (value) =>
				(
					await json<{ appearOffline: boolean }>("PUT", "/me/appear-offline", {
						appear_offline: value,
					})
				).appearOffline,
			publicProfile: async () =>
				(await json<{ publicProfile: boolean }>("GET", "/me/public-profile")).publicProfile,
			setPublicProfile: async (value) =>
				(
					await json<{ publicProfile: boolean }>("PUT", "/me/public-profile", {
						public_profile: value,
					})
				).publicProfile,
			playedWithRemember: async () =>
				(await json<{ rememberPlayedWith: boolean }>("GET", "/me/played-with/remember"))
					.rememberPlayedWith,
			setPlayedWithRemember: async (value) =>
				(
					await json<{ rememberPlayedWith: boolean }>("PUT", "/me/played-with/remember", {
						remember_played_with: value,
					})
				).rememberPlayedWith,
			clearPlayedWith: async () => {
				await json("DELETE", "/me/played-with", {});
			},
		},

		security: {
			addPasskey: async (name) => {
				const { options, id } = await json<{ options: Record<string, unknown>; id: string }>(
					"POST",
					"/account/passkeys/start",
				);
				const credential = await createCredential(options);
				const { passkey } = await json<{ passkey: Passkey }>("POST", "/account/passkeys/finish", {
					id,
					name,
					credential,
				});
				return passkey;
			},
			renamePasskey: async (id, name) => {
				await json("PATCH", `/account/passkeys/${encodeURIComponent(id)}`, { name });
			},
			removePasskey: async (id) => {
				await json("DELETE", `/account/passkeys/${encodeURIComponent(id)}`);
			},
			removeDevice: async (id) => {
				await json("DELETE", `/account/devices/${id}`);
			},
			revokeSession: (id) => json<{ signedOut: boolean }>("DELETE", `/account/sessions/${id}`),
			signOutEverywhere: async () => {
				await json("POST", "/account/sign-out-everywhere");
				csrf = null;
			},
		},

		stepUp: {
			methods: async () => stepUpMethods(),
			withPasskey: async () => {
				const { verifyPath, body } = await passkeyRound("/step-up/passkey/finish", {
					conditional: false,
				});
				await json("POST", verifyPath, body);
			},
			sendEmailCode: async () =>
				(await json<{ emailHint: string }>("POST", "/step-up/email")).emailHint,
			verifyEmailCode: async (code) => {
				await json("POST", "/step-up/code", { code });
			},
		},

		data: {
			exportData: async () => {
				const res = await raw("GET", "/account/export");
				const blob = await res.blob();
				const match = /filename="?([^";]+)"?/.exec(res.headers.get("content-disposition") ?? "");
				return { filename: match?.[1] ?? "anyplay-data.json", blob };
			},
			requestDeletion: async (handle) =>
				(await json<{ deletion: { at: number } }>("POST", "/account/deletion", { handle }))
					.deletion,
			cancelDeletion: async () => {
				await json("DELETE", "/account/deletion");
			},
		},

		friends: {
			lists: () => json<FriendLists>("GET", "/friends"),
			sendRequest: async (handle) =>
				(await json<{ state: "requested" | "friends" }>("POST", "/friends/requests", { handle }))
					.state,
			accept: async (id) => {
				await json("POST", `/friends/requests/${id}/accept`);
			},
			dropRequest: async (id) => {
				await json("DELETE", `/friends/requests/${id}`);
			},
			remove: async (id) => {
				await json("DELETE", `/friends/${id}`);
			},
			block: async (id) => {
				await json("PUT", `/blocks/${id}`);
			},
			unblock: async (id) => {
				await json("DELETE", `/blocks/${id}`);
			},
		},

		trophies: {
			mine: () => json<TrophySummary>("GET", "/me/trophies"),
		},

		links: {
			// The cloud's LinkView (spec/portal-api.md, "Connections"): the name on the other
			// service is `display_name` and who sees it is `visibility`.
			list: () =>
				json<{ links: LinkView[] }>("GET", "/me/links").then((r) =>
					r.links.map((l) => ({
						provider: l.provider,
						available: l.available,
						linked: l.linked,
						externalId: l.externalId,
						name: l.displayName,
						avatarUrl: l.avatarUrl,
						profileUrl: l.profileUrl,
						linkedAt: l.linkedAt,
						audience: l.visibility ?? "friends",
					})),
				),
			start: (provider) =>
				json<{ url: string }>("POST", `/me/links/${provider}/start`, {}).then((r) => r.url),
			unlink: async (provider) => {
				await json("DELETE", `/me/links/${provider}`, {});
			},
			setAudience: async (provider, audience) => {
				await json("PATCH", `/me/links/${provider}`, { visibility: audience });
			},
		},

		users: {
			get: (name) => json<PublicUser>("GET", `/users/${encodeURIComponent(name)}`),
			trophies: (name) => json<TrophySummary>("GET", `/users/${encodeURIComponent(name)}/trophies`),
			compare: (name, titleId) =>
				json<TrophyCompare>(
					"GET",
					`/users/${encodeURIComponent(name)}/compare/${encodeURIComponent(titleId)}`,
				),
		},

		push: {
			get: () => json<PushState>("GET", "/push"),
			subscribe: (input) =>
				json<PushDevice>("PUT", "/push/subscription", {
					endpoint: input.endpoint,
					keys: { p256dh: input.p256dh, auth: input.auth },
					label: input.label,
					kinds: input.kinds,
				}),
			unsubscribe: async (endpoint) => {
				await json("DELETE", "/push/subscription", { endpoint });
			},
		},

		compatibility: {
			// The cloud route does not exist yet (the run reports are being built). Until it does,
			// this answers `not_found` and the page says the list is not ready.
			list: () => json<CompatList>("GET", "/compatibility"),
		},

		boards: {
			page: (titleId, board, read = {}) => {
				const query = new URLSearchParams();
				if (read.view) query.set("view", read.view);
				if (read.start) query.set("start", String(read.start));
				if (read.count) query.set("count", String(read.count));
				const text = query.toString();
				return json<BoardPage>("GET", `/boards/${encodeURIComponent(titleId)}/${encodeURIComponent(board)}${text ? `?${text}` : ""}`);
			},
		},
	};
}
