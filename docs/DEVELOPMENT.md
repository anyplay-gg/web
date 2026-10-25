# Development

## How it works

- **No auth in Next.js.** Every page that needs an account is a client component that calls the cloud's JSON API under `/web/api/v1` (network [`spec/portal-api.md`](https://github.com/anyplaynet/network/blob/main/spec/portal-api.md)) with the session cookie and the CSRF header. The cloud decides who may do what; there is no session logic, no server action and no proxy check here.
- **Hardened by default.** A content security policy with a nonce per request (`apps/web/src/proxy.ts`), the image optimizer and `next/og` switched off, standalone output.
- **One client, two adapters.** `packages/api-client` talks to the cloud (`createHttpApi`) or keeps everything in memory (`createMockApi`), so every screen runs without a cloud during development.

```text
apps/web            the Next.js 16 app (React 19, Tailwind 4, Base UI, Motion)
packages/tokens     colours, type and motion tokens, fonts (SIL OFL)
packages/ui         shared parts: button, menu, dialog, motion with the reduced-motion gate
packages/api-client the portal API: types, the HTTP adapter and the mock
tooling/eslint      the shared lint rules
```

## Develop

You need Node 24 and pnpm 12.

```sh
pnpm install
pnpm dev            # http://127.0.0.1:4400, on the mock
```

In development the mock stands in for the cloud. Add `?mock=signedout`, `?mock=handoff`, `?mock=banned`, `?mock=empty`, `?mock=slow` or `?mock=error` to a URL to see those states.

Before a pull request: `pnpm lint`, `pnpm typecheck` and `pnpm test`. CI (`.github/workflows/ci.yml`) runs those plus the build, the Playwright suite and the shared rules on every pull request and on `main`. The browser tests (`pnpm --filter @anyplay/web e2e`, Playwright, on the mock at 375 and 1280 px) start their own dev server on port 4410; `SHOTS=<folder>` also saves screenshots.

## Run it

The `Dockerfile` builds the standalone server. A cloud runs it next to itself on the same host name with [`deploy/compose.web.yaml`](https://github.com/anyplaynet/cloud/blob/main/deploy/compose.web.yaml); the cloud's [deploy guide](https://github.com/anyplaynet/cloud/blob/main/docs/deploy.md#the-website) says how.

## Legal texts

`/privacy` and `/terms` have one source, `apps/web/src/components/legal`. Change the text, `meta.ts` (version, date) and the cloud's `TERMS_VERSION` together.
