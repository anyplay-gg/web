// SPDX-License-Identifier: AGPL-3.0-only
// Adapted from anyplaynet/cloud (portal-react, same project and licence): the data layer only.
import { describe, expect, it } from "vitest";
import { isStepUp } from "../errors";
import { MOCK_JOIN_CODES, createMockApi, parseScenario } from "./adapter";

const make = (o = {}) => createMockApi({ latency: 0, ...o });

describe("mock adapter", () => {
	it("answers a join page for a game and for a party, to a visitor with no session", async () => {
		const api = make({ scenario: "signedout" });
		expect(await api.join.get(MOCK_JOIN_CODES.session)).toMatchObject({ kind: "session", title: "Into the Ember", members: 2, maxMembers: 4 });
		expect(await api.join.get(MOCK_JOIN_CODES.party)).toMatchObject({ kind: "party", title: null });
	});

	it("answers not_found for every other join code, and fails in the error scenario", async () => {
		expect((await make().join.get(MOCK_JOIN_CODES.expired).catch((e) => e)).code).toBe("not_found");
		expect((await make().join.get("zzzzzzzzzz").catch((e) => e)).code).toBe("not_found");
		expect((await make({ scenario: "error" }).join.get(MOCK_JOIN_CODES.session).catch((e) => e)).code).toBe("internal");
	});

	it("starts signed in, and signed out for the signedout scenario", async () => {
		const a = await make().session();
		expect(a.signedIn).toBe(true);
		expect(a.flow.step).toBe("done");
		const b = await make({ scenario: "signedout" }).session();
		expect(b.signedIn).toBe(false);
		expect(b.flow.step).toBe("email");
	});

	it("asks for a step-up on a sensitive write until the person confirms", async () => {
		const api = make();
		const err = await api.security.removePasskey("pk-phone").catch((e) => e);
		expect(isStepUp(err)).toBe(true);
		expect(err.methods).toEqual(["passkey", "email_code"]);
		await api.stepUp.sendEmailCode();
		await api.stepUp.verifyEmailCode("123456");
		await api.security.removePasskey("pk-phone");
		expect((await api.account.get()).passkeys.map((k) => k.id)).not.toContain("pk-phone");
	});

	it("rejects a wrong code with the cloud's code_wrong", async () => {
		const api = make();
		await api.stepUp.sendEmailCode();
		const err = await api.stepUp.verifyEmailCode("000000").catch((e) => e);
		expect(err.code).toBe("code_wrong");
	});

	it("walks sign-in as the cloud's flow: email, code, details, done", async () => {
		const api = make({ scenario: "signedout" });
		expect((await api.auth.start({ email: "new@example.com", intent: "create" })).flow.step).toBe(
			"code",
		);
		const details = await api.auth.verifyCode("123456");
		expect(details.flow.step).toBe("details");
		expect(details.flow.terms?.version).toBeTruthy();
		const taken = await api.auth
			.submitDetails({ handle: "mira", ageConfirmed: true, termsAccepted: true })
			.catch((e) => e);
		expect(taken.code).toBe("handle_taken");
		expect(taken.fields.handle).toMatch(/taken/);
		const done = await api.auth.submitDetails({
			handle: "newbie",
			ageConfirmed: true,
			termsAccepted: true,
		});
		expect(done.flow.step).toBe("done");
		expect(done.account?.handle).toBe("newbie");
	});

	it("opens an account link once for a look and signs in on the press", async () => {
		const api = make({ scenario: "signedout" });
		expect(await api.link.peek("abc")).toEqual({ handle: expect.any(String) });
		expect((await api.session()).signedIn).toBe(false);
		const opened = await api.link.open("abc");
		expect(opened.signedIn).toBe(true);
		expect(opened.flow.step).toBe("done");
		const expired = await api.link.peek("expired").catch((e) => e);
		expect(expired.code).toBe("not_found");
		const banned = await api.link.open("banned").catch((e) => e);
		expect(banned.code).toBe("banned");
		expect((await api.session()).flow.step).toBe("banned");
	});

	it("hands a launcher sign-in off with a redirect", async () => {
		const api = make({ scenario: "handoff" });
		expect((await api.session()).authorize).not.toBeNull();
		await api.auth.start({ email: "riley.chen@example.com", intent: "sign_in" });
		const v = await api.auth.verifyCode("123456");
		expect(v.flow.step).toBe("handoff");
		expect(v.flow.redirect).toBeTruthy();
	});

	it("shows a stranger less than a friend, and nothing a player keeps to themselves", async () => {
		const api = make();
		const mira = await api.users.get("mira");
		expect(mira.viewer?.relation).toBe("friend");
		expect(mira.trophies).not.toBeNull();
		const jonas = await api.users.get("jonas");
		expect(jonas.viewer?.relation).toBe("none");
		expect(jonas.trophies).toBeNull();
		expect(jonas.about).not.toBeNull();
		const kenji = await api.users.get("kenji");
		expect(kenji.about).toBeNull();
		expect(kenji.trophies).toBeNull();
		await expect(api.users.get("nobody-here")).rejects.toMatchObject({ code: "not_found" });
	});

	it("shows a visitor who is not signed in a null viewer", async () => {
		const u = await make({ scenario: "signedout" }).users.get("mira");
		expect(u.viewer).toBeNull();
	});

	it("never hands out trophy names, only title ids and counts", async () => {
		const t = await make().trophies.mine();
		for (const title of t.titles) {
			expect(Object.keys(title).sort()).toEqual(["counts", "earned", "lastEarned", "titleId"]);
		}
	});

	it("starts the 30-day grace period only for the right handle", async () => {
		const api = make({ fresh: true });
		await expect(api.data.requestDeletion("someone")).rejects.toMatchObject({
			code: "bad_request",
		});
		const { at } = await api.data.requestDeletion("Riley");
		expect(Math.round((at - Date.now() / 1000) / 86_400)).toBe(30);
		expect((await api.account.get()).deletion).not.toBeNull();
		await api.data.cancelDeletion();
		expect((await api.account.get()).deletion).toBeNull();
	});

	it("changes the e-mail through a code, behind the step-up", async () => {
		const api = make({ fresh: true });
		await api.account.changeEmail("new.address@example.com");
		expect((await api.account.get()).pendingEmail).toBe("new.address@example.com");
		expect(await api.account.confirmEmail("123456")).toBe("new.address@example.com");
		expect((await api.session()).account?.email).toBe("new.address@example.com");
	});

	it("fails reads in the error scenario", async () => {
		await expect(make({ scenario: "error" }).friends.lists()).rejects.toMatchObject({
			code: "internal",
		});
	});

	it("keeps push subscriptions per endpoint, and updates one instead of adding it twice", async () => {
		const api = make();
		const sub = { endpoint: "https://push.example.test/a", p256dh: "k", auth: "a" };
		expect((await api.push.get()).enabled).toBe(true);
		const first = await api.push.subscribe({ ...sub, label: "Chrome on Android" });
		expect(first.kinds).toEqual(["friend_request", "party_invite", "message"]);
		const again = await api.push.subscribe({ ...sub, kinds: ["message"] });
		expect(again.id).toBe(first.id);
		expect(again.kinds).toEqual(["message"]);
		expect((await api.push.get()).subscriptions).toHaveLength(1);
		await api.push.unsubscribe(sub.endpoint);
		await api.push.unsubscribe(sub.endpoint);
		expect((await api.push.get()).subscriptions).toHaveLength(0);
	});

	it("limits a player to ten push devices", async () => {
		const api = make();
		for (let i = 0; i < 10; i++) await api.push.subscribe({ endpoint: `https://push.example.test/${i}`, p256dh: "k", auth: "a" });
		await expect(api.push.subscribe({ endpoint: "https://push.example.test/11", p256dh: "k", auth: "a" })).rejects.toMatchObject({ code: "limit" });
	});

	it("lists compatibility to a signed-out visitor, only with a verdict and three reports", async () => {
		const list = await make({ scenario: "signedout" }).compatibility.list();
		expect(list.titles.length).toBeGreaterThan(0);
		for (const t of list.titles) {
			expect(t.reports).toBeGreaterThanOrEqual(3);
			expect(t.reports).toBe(t.counts.noStart + t.counts.menus + t.counts.inGame + t.counts.playable);
		}
		expect((await make({ scenario: "empty" }).compatibility.list()).titles).toEqual([]);
	});

	it("shows a board to a visitor, ties sharing a rank, and keeps the personal views for a session", async () => {
		const visitor = make({ scenario: "signedout" });
		const page = await visitor.boards.page("GAME00001", "7");
		expect(page.view).toBe("top");
		expect(page.entries.length).toBeGreaterThan(0);
		expect(page.me).toBeUndefined();
		expect(page.entries[0]!.rank).toBe(1);
		expect(page.entries[1]!.rank).toBe(1);
		expect(page.entries[2]!.rank).toBe(3);
		await expect(visitor.boards.page("GAME00001", "7", { view: "friends" })).rejects.toMatchObject({ code: "unauthorized" });
		await expect(visitor.boards.page("GAME00001", "nope")).rejects.toMatchObject({ code: "not_found" });
		const member = await make().boards.page("GAME00001", "7", { view: "around", count: 5 });
		expect(member.me?.handle).toBe("Quill");
		expect(member.entries.some((e) => e.handle === "Quill")).toBe(true);
		expect((await make({ scenario: "empty" }).boards.page("GAME00001", "7")).entries).toEqual([]);
	});

	it("keeps the public profile off until the player turns it on", async () => {
		const api = make();
		expect(await api.account.publicProfile()).toBe(false);
		expect(await api.account.setPublicProfile(true)).toBe(true);
		expect(await api.account.publicProfile()).toBe(true);
		await expect(make({ scenario: "nosave" }).account.setPublicProfile(true)).rejects.toMatchObject({ code: "internal" });
	});

	it("keeps the played-with switch on by default, settable, and failing in the nosave scenario", async () => {
		const api = make();
		expect(await api.account.playedWithRemember()).toBe(true);
		expect(await api.account.setPlayedWithRemember(false)).toBe(false);
		expect(await api.account.playedWithRemember()).toBe(false);
		await expect(api.account.clearPlayedWith()).resolves.toBeUndefined();
		await expect(make({ scenario: "nosave" }).account.setPlayedWithRemember(false)).rejects.toMatchObject({ code: "internal" });
		await expect(make({ scenario: "nosave" }).account.clearPlayedWith()).rejects.toMatchObject({ code: "internal" });
	});

	it("holds who sees the scores on its own, friends first, and fails to save in the nosave scenario", async () => {
		const api = make();
		expect(await api.account.scorePrivacy()).toBe("friends");
		const before = await api.account.privacy();
		expect(await api.account.setScorePrivacy("nobody")).toBe("nobody");
		expect(await api.account.scorePrivacy()).toBe("nobody");
		expect(await api.account.privacy()).toEqual(before);
		await expect(make({ scenario: "nosave" }).account.setScorePrivacy("everyone")).rejects.toMatchObject({ code: "internal" });
	});

	it("keeps appear offline apart from privacy, and fails to save in the nosave scenario", async () => {
		const api = make();
		expect(await api.account.appearOffline()).toBe(false);
		const before = await api.account.privacy();
		expect(await api.account.setAppearOffline(true)).toBe(true);
		expect(await api.account.appearOffline()).toBe(true);
		expect((await api.account.get()).account.appearOffline).toBe(true);
		expect(await api.account.privacy()).toEqual(before);
		await expect(make({ scenario: "nosave" }).account.setAppearOffline(true)).rejects.toMatchObject({ code: "internal" });
	});

	it("counts points and levels as ADR 0029 does", async () => {
		const own = await make().trophies.mine();
		expect(own.points).toBe(own.counts.bronze * 10 + own.counts.silver * 25 + own.counts.gold * 60 + own.counts.platinum * 150);
		expect(own.level).toMatchObject({ points: own.points, level: 19, from: 3132, to: 3420 });
		expect((await make({ scenario: "empty" }).trophies.mine()).level).toEqual({ points: 0, level: 1, from: 0, to: 72 });
		expect((await make().users.get("mira")).level).not.toBeNull();
		expect((await make().users.get("kenji")).level).toBeNull();
		expect((await make().users.get("riley")).level?.points).toBe(own.points);
	});

	it("compares one game: numbers, grades and times, and the cloud's refusals", async () => {
		const api = make();
		const r = await api.users.compare("mira", "GAME01234");
		expect(r.titleId).toBe("GAME01234");
		expect(r.you.account.handle).toBe("riley");
		// the viewer's own side is exactly what the trophy page counts
		const mine = (await api.trophies.mine()).titles.find((t) => t.titleId === "GAME01234")!;
		expect(r.you.title.counts).toEqual(mine.counts);
		expect(r.them.title.points).toBeGreaterThan(0);
		expect(Object.keys(r.them.trophies[0]!).sort()).toEqual(["earned", "grade", "number"]);
		expect((await api.users.compare("mira", "GAME09999")).them.trophies).toEqual([]);
		expect((await api.users.compare("kenji", "GAME01234").catch((e) => e)).code).toBe("not_found");
		expect((await api.users.compare("jonas", "GAME03102").catch((e) => e)).code).toBe("not_found");
		expect((await api.users.compare("riley", "GAME01234").catch((e) => e)).code).toBe("bad_request");
		expect((await make({ scenario: "signedout" }).users.compare("mira", "GAME01234").catch((e) => e)).code).toBe("unauthorized");
		expect((await make({ scenario: "error" }).users.compare("mira", "GAME01234").catch((e) => e)).code).toBe("internal");
	});

	it("lists the games another player has trophies in, only when they show them", async () => {
		const api = make();
		expect((await api.users.trophies("mira")).titles.map((t) => t.titleId)).toEqual(["GAME01234", "GAME04550"]);
		expect((await api.users.trophies("ines")).titles).toEqual([]);
		expect((await api.users.trophies("kenji").catch((e) => e)).code).toBe("not_found");
	});

	it("parses the scenario from a URL", () => {
		expect(parseScenario("?mock=empty")).toBe("empty");
		expect(parseScenario("?mock=banned")).toBe("banned");
		expect(parseScenario("?mock=whatever")).toBe("default");
		expect(parseScenario("")).toBe("default");
	});
});
