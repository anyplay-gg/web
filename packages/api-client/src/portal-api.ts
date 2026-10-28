// SPDX-License-Identifier: AGPL-3.0-only
// Adapted from anyplaynet/cloud (portal-react, same project and licence): the data layer only.
import type {
	LinkedAccount,
	LinkProvider,
	Audience,
	AccountView,
	BoardPage,
	BoardRead,
	CompatList,
	PushState,
	PushDevice,
	PushSubscribeInput,
	PushKind,
	BanStatement,
	DataExport,
	FriendLists,
	JoinView,
	Me,
	Passkey,
	Privacy,
	Profile,
	ProfileUpdate,
	PublicUser,
	SessionView,
	SignInIntent,
	StepUpMethod,
	TrophyCompare,
	TrophySummary,
} from "./types";

/**
 * The one seam between the screens and the cloud.
 *
 * Two adapters satisfy it: `createHttpApi` talks to /web/api/v1 on the same origin, and
 * `createMockApi` keeps everything in memory so the app runs and can be photographed without a
 * backend. Screens import this interface and the hooks in ./queries, never an adapter.
 *
 * Invariants every adapter keeps:
 * - Failures are `ApiError`s; no adapter throws anything else.
 * - A write that needs a recent sign-in rejects with code `step_up_required`. The screen runs
 *   the step-up dialog (`useStepUp().run`) and the dialog calls the same write again.
 * - Passkey ceremonies happen inside the adapter. The screen calls `addPasskey()` and gets a
 *   `Passkey` back, or `passkey_cancelled` when the person closed the browser's sheet.
 * - Every sign-in step answers with the whole `SessionView`; the screen shows `flow.step`.
 */
export interface PortalApi {
	/** "http" talks to a cloud, "mock" is in memory. */
	readonly mode: "http" | "mock";

	/** The browser's session. Starts one when there is none; never rejects for a signed-out visitor. */
	session(): Promise<SessionView>;

	auth: {
		start(input: { email: string; intent: SignInIntent }): Promise<SessionView>;
		resendCode(): Promise<SessionView>;
		verifyCode(code: string): Promise<SessionView>;
		submitDetails(input: {
			handle: string;
			ageConfirmed: boolean;
			termsAccepted: boolean;
		}): Promise<SessionView>;
		acceptTerms(): Promise<SessionView>;
		/** Whether this browser can do passkeys, and whether the autofill form is available. */
		passkeySupport(): Promise<{ available: boolean; conditional: boolean }>;
		/** Resolves when a passkey signs the player in. With `conditional`, waits for autofill. */
		signInWithPasskey(options: {
			conditional: boolean;
			signal?: AbortSignal;
		}): Promise<SessionView>;
		signOut(): Promise<void>;
		/** The statement of the ban this session proved to be its own. */
		ban(): Promise<BanStatement>;
		appeal(text: string): Promise<void>;
	};

	/** The link the launcher's account button opens: `/link?c=<code>`. */
	link: {
		/** Whose account the link opens. Changes nothing; rejects with `not_found` when it ran out. */
		peek(code: string): Promise<{ handle: string }>;
		/**
		 * Uses the link up and signs this browser in as that account. Rejects with `not_found` when it
		 * ran out, or `banned`: the session then shows the statement (`flow.step` is `banned`).
		 */
		open(code: string): Promise<SessionView>;
	};

	/** The page `/join/<code>`, which the link on a player's Discord profile opens. */
	join: {
		/**
		 * Who invites and to what. Needs no session, changes nothing and joins nobody. Rejects with
		 * `not_found` for a code that is unknown, expired, revoked or opens nothing now: one answer for
		 * all of them, so the difference is not visible here either.
		 */
		get(code: string): Promise<JoinView>;
	};

	account: {
		get(): Promise<AccountView>;
		/** Sends a code to the new address. Needs a recent sign-in. */
		changeEmail(email: string): Promise<void>;
		confirmEmail(code: string): Promise<string>;
		profile(): Promise<Profile>;
		updateProfile(input: ProfileUpdate): Promise<Profile>;
		setAvatar(file: Blob): Promise<string>;
		removeAvatar(): Promise<void>;
		privacy(): Promise<Privacy>;
		updatePrivacy(input: Privacy): Promise<Privacy>;
		/** Whether friends see the player as offline. Not part of `Privacy`; set on its own. */
		appearOffline(): Promise<boolean>;
		setAppearOffline(value: boolean): Promise<boolean>;
		/** Who sees the player's leaderboard scores. Friends for a new account; separate from `Privacy`. */
		scorePrivacy(): Promise<Audience>;
		setScorePrivacy(value: Audience): Promise<Audience>;
		/** Whether the page at /u/<handle> is open to people who are not friends. Off for a new account. */
		publicProfile(): Promise<boolean>;
		setPublicProfile(value: boolean): Promise<boolean>;
		/** Whether the cloud remembers the people the player shares parties and sessions with. On for a new account. */
		playedWithRemember(): Promise<boolean>;
		setPlayedWithRemember(value: boolean): Promise<boolean>;
		/** Empties the private list of people played with. The list itself is read in the launcher. */
		clearPlayedWith(): Promise<void>;
	};

	security: {
		addPasskey(name: string): Promise<Passkey>;
		renamePasskey(id: string, name: string): Promise<void>;
		removePasskey(id: string): Promise<void>;
		removeDevice(id: number): Promise<void>;
		/** Ends a browser session. `signedOut` is true when it was this browser's own. */
		revokeSession(id: number): Promise<{ signedOut: boolean }>;
		/** Ends every device and browser, this one too. */
		signOutEverywhere(): Promise<void>;
	};

	stepUp: {
		methods(): Promise<StepUpMethod[]>;
		withPasskey(): Promise<void>;
		/** Sends a code to the account's own address; answers the hint, "a***@example.com". */
		sendEmailCode(): Promise<string>;
		verifyEmailCode(code: string): Promise<void>;
	};

	data: {
		exportData(): Promise<DataExport>;
		/** Starts the 30-day grace period. `handle` must match the account's handle. */
		requestDeletion(handle: string): Promise<{ at: number }>;
		cancelDeletion(): Promise<void>;
	};

	friends: {
		lists(): Promise<FriendLists>;
		sendRequest(handle: string): Promise<"requested" | "friends">;
		accept(accountId: number): Promise<void>;
		/** Declines an incoming request or withdraws an outgoing one. */
		dropRequest(accountId: number): Promise<void>;
		remove(accountId: number): Promise<void>;
		block(accountId: number): Promise<void>;
		unblock(accountId: number): Promise<void>;
	};

	trophies: {
		mine(): Promise<TrophySummary>;
	};

	links: {
		list(): Promise<LinkedAccount[]>;
		/** Answers the address to send the browser to; the provider sends it back to the cloud. Needs a recent sign-in. */
		start(provider: LinkProvider): Promise<string>;
		unlink(provider: LinkProvider): Promise<void>;
		setAudience(provider: LinkProvider, audience: Audience): Promise<void>;
	};

	users: {
		get(handle: string): Promise<PublicUser>;
		/** The player's trophy counts per game. `not_found` when the viewer may not see them. */
		trophies(handle: string): Promise<TrophySummary>;
		/**
		 * The viewer next to the player in one game; needs a session. `not_found` when the player does
		 * not exist or hides their trophies from the viewer, `bad_request` for the viewer's own name.
		 */
		compare(handle: string, titleId: string): Promise<TrophyCompare>;
	};

	/** Web Push to this browser: friend requests, party invitations and new messages. */
	push: {
		get(): Promise<PushState>;
		/** Adds this browser, or updates it when the cloud knows its endpoint already. */
		subscribe(input: PushSubscribeInput): Promise<PushDevice>;
		unsubscribe(endpoint: string): Promise<void>;
	};

	/** The public list of how games run, from the players' "How did it run?" answers. */
	compatibility: {
		list(): Promise<CompatList>;
	};

	/** Boards of best scores, read-only and public: a visitor sees what players show to everyone. */
	boards: {
		/** `not_found` when there is no such board or the cloud has leaderboards off. */
		page(titleId: string, board: string, read?: BoardRead): Promise<BoardPage>;
	};
}

export type { Me, PushKind };
