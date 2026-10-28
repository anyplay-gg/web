// SPDX-License-Identifier: AGPL-3.0-only
// Adapted from anyplaynet/cloud (portal-react, same project and licence): the data layer only.
// Realistic data for the in-memory adapter. Names, handles and titles are invented. Title ids use
// the GAME01234 shape on purpose: real platform title ids never appear in code. Times are Unix
// seconds, ids are integers, as on the wire.
import type {
	Account,
	BrowserSession,
	BoardLine,
	BoardPage,
	BoardRead,
	CompatList,
	CompatVersion,
	RunCounts,
	RunVerdict,
	Device,
	Friend,
	FriendRequest,
	GradeCounts,
	Me,
	Passkey,
	Presence,
	Privacy,
	TitleSummary,
	Trophy,
	TrophyGrade,
	TrophyLevel,
	TrophySummary,
} from "../types";

const MIN = 60;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
export const ago = { min: MIN, hour: HOUR, day: DAY };

export function seedMe(now: number): Me {
	return { id: 41, handle: "riley", email: "riley.chen@example.com", created: now - 212 * DAY, appearOffline: false };
}

export function seedPasskeys(now: number): Passkey[] {
	return [
		{ id: "pk-desktop", name: "Desktop PC", created: now - 190 * DAY, lastUsed: now - 2 * HOUR },
		{ id: "pk-phone", name: "Phone", created: now - 143 * DAY, lastUsed: now - 6 * DAY },
	];
}

export function seedDevices(now: number): Device[] {
	return [
		{
			id: 3,
			name: "Riley's desktop",
			platform: "windows",
			created: now - 120 * DAY,
			lastUsed: now - 2 * HOUR,
		},
		{
			id: 7,
			name: "Living room",
			platform: "linux",
			created: now - 61 * DAY,
			lastUsed: now - 1 * DAY - 3 * HOUR,
		},
	];
}

export function seedSessions(now: number): BrowserSession[] {
	return [
		{ id: 11, current: true, created: now - 38 * MIN, lastUsed: now },
		{ id: 12, current: false, created: now - 22 * DAY, lastUsed: now - 5 * DAY },
		{ id: 13, current: false, created: now - 80 * DAY, lastUsed: now - 23 * DAY },
	];
}

export const defaultPrivacy = (): Privacy => ({
	trophies: "friends",
	about: "friends",
	favourites: "friends",
	avatar: "friends",
	playtime: "friends",
	feed: "friends",
});

export interface MockPlayer extends Account {
	about: string;
	favourites: string[];
	playtime: { titleId: string; minutes: number }[];
	joinedDaysAgo: number;
	online: boolean;
	activity: { titleId: string; title: string } | null;
	privacy: Privacy;
	trophies: GradeCounts;
	avatar: string | null;
}

const counts = (platinum: number, gold: number, silver: number, bronze: number): GradeCounts => ({
	platinum,
	gold,
	silver,
	bronze,
});
const everyone = (): Privacy => ({
	trophies: "everyone",
	about: "everyone",
	favourites: "everyone",
	avatar: "everyone",
	playtime: "friends",
	feed: "friends",
});

export const players: MockPlayer[] = [
	{
		id: 101,
		handle: "mira",
		about: "Speedruns on weekends, cozy games on weeknights.",
		favourites: ["GAME01234", "GAME04550"],
		playtime: [
			{ titleId: "GAME01234", minutes: 5120 },
			{ titleId: "GAME04550", minutes: 1840 },
		],
		joinedDaysAgo: 330,
		online: true,
		activity: { titleId: "GAME01234", title: "Tidebreaker" },
		privacy: everyone(),
		trophies: counts(3, 21, 44, 96),
		avatar: null,
	},
	{
		id: 102,
		handle: "jonas",
		about: "Racing, mostly. Say hi before you add me.",
		favourites: ["GAME03102"],
		playtime: [],
		joinedDaysAgo: 96,
		online: false,
		activity: null,
		privacy: { ...defaultPrivacy(), about: "everyone", favourites: "everyone" },
		trophies: counts(1, 6, 15, 31),
		avatar: null,
	},
	{
		id: 103,
		handle: "kenji",
		about: "",
		favourites: [],
		playtime: [],
		joinedDaysAgo: 502,
		online: false,
		activity: null,
		privacy: {
			trophies: "nobody",
			about: "nobody",
			favourites: "nobody",
			avatar: "nobody",
			playtime: "nobody",
			feed: "nobody",
		},
		trophies: counts(9, 40, 70, 120),
		avatar: null,
	},
	{
		id: 104,
		handle: "lena",
		about: "Collecting every ending.",
		favourites: ["GAME02417"],
		playtime: [{ titleId: "GAME02417", minutes: 3300 }],
		joinedDaysAgo: 410,
		online: true,
		activity: null,
		privacy: defaultPrivacy(),
		trophies: counts(5, 28, 52, 101),
		avatar: null,
	},
	{
		id: 105,
		handle: "tomas",
		about: "Fighting games and bad puns.",
		favourites: [],
		playtime: [],
		joinedDaysAgo: 60,
		online: true,
		activity: { titleId: "GAME05871", title: "Paper Frontier" },
		privacy: defaultPrivacy(),
		trophies: counts(0, 3, 9, 18),
		avatar: null,
	},
	{
		id: 106,
		handle: "sasha",
		about: "Soulslikes, strategy and tea.",
		favourites: ["GAME04550"],
		playtime: [],
		joinedDaysAgo: 250,
		online: false,
		activity: null,
		privacy: defaultPrivacy(),
		trophies: counts(2, 14, 30, 61),
		avatar: null,
	},
	{
		id: 107,
		handle: "ines",
		about: "Puzzle games.",
		favourites: [],
		playtime: [],
		joinedDaysAgo: 14,
		online: false,
		activity: null,
		privacy: everyone(),
		trophies: counts(0, 1, 4, 9),
		avatar: null,
	},
];

export const toAccount = (p: Account): Account => ({ id: p.id, handle: p.handle });
const presenceOf = (p: MockPlayer): Presence => ({ online: p.online, activity: p.activity });
export const presenceFor = presenceOf;

export function seedFriends(now: number): Friend[] {
	const since = [180, 301, 40, 122];
	return [101, 104, 105, 106].map((id, i) => {
		const p = players.find((x) => x.id === id) as MockPlayer;
		return { account: toAccount(p), since: now - (since[i] ?? 10) * DAY, presence: presenceOf(p) };
	});
}

export function seedIncoming(now: number): FriendRequest[] {
	return [
		{ account: toAccount(players.find((x) => x.id === 102) as MockPlayer), since: now - 2 * DAY },
	];
}

export function seedOutgoing(now: number): FriendRequest[] {
	return [
		{ account: toAccount(players.find((x) => x.id === 107) as MockPlayer), since: now - 5 * HOUR },
	];
}

// Invented titles. The cloud holds a title id and counts, and nothing else about a trophy.
const titles: { titleId: string; counts: GradeCounts; ago: number }[] = [
	{ titleId: "GAME01234", counts: counts(1, 9, 14, 22), ago: 3 * HOUR },
	{ titleId: "GAME02417", counts: counts(0, 4, 11, 19), ago: 2 * DAY },
	{ titleId: "GAME03102", counts: counts(0, 2, 6, 10), ago: 9 * DAY },
	{ titleId: "GAME04550", counts: counts(1, 6, 8, 15), ago: 31 * DAY },
	{ titleId: "GAME05871", counts: counts(0, 0, 2, 5), ago: 47 * DAY },
];

/* ───────── points and levels (ADR 0029) ───────── */

export const GRADE_POINTS: Record<TrophyGrade, number> = { bronze: 10, silver: 25, gold: 60, platinum: 150 };
export const pointsOf = (c: GradeCounts) =>
	c.bronze * GRADE_POINTS.bronze + c.silver * GRADE_POINTS.silver + c.gold * GRADE_POINTS.gold + c.platinum * GRADE_POINTS.platinum;

/** Level L (1 to 100) starts at 6 * (L - 1) * (L + 10) points, as the cloud counts them. */
const startOf = (level: number) => 6 * (level - 1) * (level + 10);
export function levelFor(points: number): TrophyLevel {
	let level = 1;
	while (level < 100 && points >= startOf(level + 1)) level += 1;
	return { points, level, from: startOf(level), to: level === 100 ? null : startOf(level + 1) };
}

/* ───────── the trophies of one title, as numbers ───────── */

const GRADE_ORDER: TrophyGrade[] = ["platinum", "gold", "silver", "bronze"];
const hash = (n: number) => Math.imul(n + 1, 2654435761) >>> 0;

/** The trophies a title has: a little more than the player's own counts, so there is something to chase. */
function layoutOf(titleId: string): { number: number; grade: TrophyGrade }[] {
	const own = titles.find((t) => t.titleId === titleId)?.counts ?? counts(0, 1, 3, 6);
	const size: GradeCounts = { platinum: own.platinum, gold: own.gold + 1, silver: own.silver + 2, bronze: own.bronze + 4 };
	const grades = GRADE_ORDER.flatMap((g) => Array.from({ length: size[g] }, () => g));
	const seed = [...titleId].reduce((a, c) => a + c.charCodeAt(0), 0);
	return grades
		.map((grade, i) => ({ grade, key: hash(i * 7 + seed) }))
		.sort((a, b) => a.key - b.key)
		.map((x, number) => ({ number, grade: x.grade }));
}

/** Trophies counted by grade, with what they are worth. */
export function tally(list: Trophy[]) {
	const c = counts(0, 0, 0, 0);
	for (const t of list) c[t.grade] += 1;
	return { counts: c, points: pointsOf(c) };
}

/** What the signed-in player earned in a title: exactly the counts the trophy page shows. */
export function ownTrophies(titleId: string, now: number): Trophy[] {
	const own = titles.find((t) => t.titleId === titleId);
	if (!own) return [];
	const left = { ...own.counts };
	return layoutOf(titleId)
		.filter((t) => left[t.grade]-- > 0)
		.map((t) => ({ number: t.number, grade: t.grade, earned: now - own.ago - (t.number % 9) * HOUR }));
}

/** The games a seeded player has trophies in, and how much of each they earned (percent). */
export const playerTitles: Record<number, { titleId: string; pct: number }[]> = {
	101: [{ titleId: "GAME01234", pct: 85 }, { titleId: "GAME04550", pct: 40 }],
	102: [{ titleId: "GAME03102", pct: 60 }],
	104: [{ titleId: "GAME02417", pct: 55 }],
	105: [{ titleId: "GAME05871", pct: 25 }],
	106: [{ titleId: "GAME04550", pct: 70 }],
};

export function playerTrophies(playerId: number, titleId: string, now: number): Trophy[] {
	const row = playerTitles[playerId]?.find((t) => t.titleId === titleId);
	if (!row) return [];
	return layoutOf(titleId)
		.filter((t) => hash(t.number * 31 + playerId) % 100 < row.pct)
		.map((t) => ({ number: t.number, grade: t.grade, earned: now - (1 + (t.number % 40)) * DAY }));
}

export function seedTrophies(now: number): TrophySummary {
	const list: TitleSummary[] = titles.map((t) => ({
		titleId: t.titleId,
		counts: t.counts,
		earned: t.counts.platinum + t.counts.gold + t.counts.silver + t.counts.bronze,
		lastEarned: now - t.ago,
	}));
	const total = list.reduce(
		(a, t) => ({
			platinum: a.platinum + t.counts.platinum,
			gold: a.gold + t.counts.gold,
			silver: a.silver + t.counts.silver,
			bronze: a.bronze + t.counts.bronze,
		}),
		counts(0, 0, 0, 0),
	);
	const points = pointsOf(total);
	return { counts: total, points, level: levelFor(points), titles: list };
}

export const ownPlaytime = [
	{ titleId: "GAME01234", minutes: 7260 },
	{ titleId: "GAME02417", minutes: 2430 },
	{ titleId: "GAME04550", minutes: 960 },
];

type Row = [titleId: string, title: string | undefined, noStart: number, menus: number, inGame: number, playable: number];

const ROWS: Row[] = [
	["GAME01234", "Tidebreaker", 0, 1, 3, 21],
	["GAME04550", "Paper Frontier", 1, 2, 9, 14],
	["GAME03102", "Lap Nine", 0, 0, 2, 31],
	["GAME07781", undefined, 4, 3, 1, 0],
	["GAME02210", "Ember Court", 2, 6, 4, 1],
	["GAME05919", undefined, 0, 0, 0, 3],
	["GAME08840", "Hollow Mile", 7, 2, 0, 0],
	["GAME06403", "Salt and Signal", 0, 2, 11, 5],
	["GAME09127", undefined, 1, 4, 3, 0],
	["GAME01998", "Kite Season", 0, 0, 1, 8],
];

const verdictOf = (c: RunCounts): RunVerdict => {
	// the most reported one; on a tie the lower, so the list promises no more than players found
	const order: [RunVerdict, number][] = [
		["no_start", c.noStart],
		["menus", c.menus],
		["in_game", c.inGame],
		["playable", c.playable],
	];
	return order.reduce((best, x) => (x[1] > best[1] ? x : best))[0];
};

/** The public compatibility list: only titles with at least three reports, as the cloud lists them. */
export function seedCompatibility(): CompatList {
	return {
		titles: ROWS.map(([titleId, title, noStart, menus, inGame, playable]) => {
			const counts = { noStart, menus, inGame, playable };
			const reports = noStart + menus + inGame + playable;
			const verdict = verdictOf(counts);
			const versions: CompatVersion[] =
				reports >= 12
					? [
							{ version: "1.02", reports: Math.ceil(reports * 0.7), verdict },
							{ version: "1.00", reports: Math.floor(reports * 0.3), verdict: verdictOf({ ...counts, playable: 0 }) },
						]
					: [{ version: "1.00", reports, verdict }];
			return { titleId, ...(title ? { title } : {}), verdict, reports, counts, versions };
		}),
	};
}

const BOARD_NAMES = ["Lumen", "Ember", "Tidal", "Quill", "Nova", "Sable", "Fern", "Orbit", "Pixel", "Mosaic", "Cinder", "Harbor"];

/** The demo board of the mock: Board 7 of a demo title, higher is better, ties included. */
export const DEMO_BOARD = { titleId: "GAME00001", board: "7" } as const;

/** A range of the demo board as the mock viewer sees it. */
export function seedBoard(read: BoardRead = {}, signedIn = false, empty = false): BoardPage {
	const view = read.view ?? "top";
	const all: BoardLine[] = empty
		? []
		: Array.from({ length: 60 }, (_, i) => ({
				handle: i < BOARD_NAMES.length ? BOARD_NAMES[i]! : `Player${i + 1}`,
				score: 120_000 - Math.floor(i / 2) * 1_750,
				achieved: 1_790_000_000 - i * 5_400,
			}))
				.filter((_, i) => view !== "friends" || i % 7 === 0)
				.map((line, i, rows) => ({ ...line, rank: rows.findIndex((r) => r.score === line.score) + 1 }));
	const mine = signedIn ? all.find((l) => l.handle === "Quill") : undefined;
	const count = read.count ?? 25;
	const pos = mine ? all.indexOf(mine) : 0;
	const start = view === "around" ? Math.max(0, pos - Math.floor(count / 2)) : (read.start ?? 0);
	return {
		titleId: DEMO_BOARD.titleId,
		board: DEMO_BOARD.board,
		order: "high",
		status: "open",
		view,
		total: all.length,
		start,
		entries: all.slice(start, start + count),
		...(mine ? { me: mine } : {}),
	};
}
