# dsec-app — DSEC Member Portal

The member-facing portal for the Deakin Software Engineering Club, served at
**app.dsec.club**. Members sign in with a one-time code emailed to them, complete
onboarding, and get a dashboard plus a membership card that can be verified at
events.

This is a standalone repository. It was split out of the `dsec` monorepo and no
longer depends on that checkout.

- **Stack:** Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4.
- **Auth:** Auth.js (NextAuth) v5, Credentials provider with an emailed one-time code.
- **Data:** Drizzle ORM against the shared **Neon Postgres** database, plus the
  `dsec-api` backend for the public feed and media.
- **Design system:** shared with `dsec-website` — the same `globals.css` tokens
  and the pixel-art "DSEC OS" look.

## Routes

| Route | Purpose |
|---|---|
| `/` | Router — sends you to the dashboard, onboarding or locked depending on state |
| `/login` | Request and enter the one-time code |
| `/onboarding` | First-run profile + photo capture |
| `/dashboard` | Signed-in member home |
| `/verify/[code]` | Membership-card verification (used at events) |
| `/assistance` | Member assistance request form |
| `/locked` | Shown when an account is not yet active |

## What it depends on

| Dependency | Why | Required? |
|---|---|---|
| **Neon Postgres** | The portal connects directly with `DATABASE_URL`. Same database `dsec-api` owns. | Yes — the app will not build or run without it |
| **dsec-api** | Public `/website/*` feed, membership verification, photo upload via `/media` | Degrades gracefully if unset |
| **Resend** | Delivers the login codes | Yes in production. Without a key the code is printed to the server console, which is fine locally |
| **dsec-games** | Reads this app's session cookie across `*.dsec.club` | Only if the games site is deployed |

## Run it locally

```bash
npm install
cp .env.example .env.local    # then fill in DATABASE_URL and AUTH_SECRET
npm run dev                   # http://localhost:3001
```

`AUTH_SECRET` and `DATABASE_URL` are the two you cannot skip. Generate the
secret with `openssl rand -base64 32`.

### First-run database setup

`dsec-api`'s Alembic migrations own the core schema. These scripts add the
**portal-owned** tables on top. They are idempotent and safe to re-run:

```bash
npx tsx scripts/add-portal-account-table.ts
npx tsx scripts/add-portal-onboarding-columns.ts
npx tsx scripts/add-email-login-code-table.ts
npx tsx scripts/add-assistance-request-table.ts
```

If a script errors that a base table is missing, the core migrations have not
been applied yet — see `dsec-api`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on port 3001 |
| `npm run build` | Production build. Needs `DATABASE_URL` set — see below |
| `npm run start` | Serve a production build on port 3001 |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

> `next build` evaluates `src/db/index.ts` while collecting page data, so
> `DATABASE_URL` must be present at **build** time even though nothing connects.
> Any syntactically valid Postgres URL works for a build-only check.

CI runs typecheck, lint and build on every push to `main` and every PR
(`.github/workflows/ci.yml`).

## Environment

Copy `.env.example` → `.env.local`; it documents every variable with a comment.
The security-relevant ones:

| Var | Needed | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon Postgres; use the **pooled** (`-pooler`) string in production |
| `AUTH_SECRET` | ✅ | Signs sessions and peppers the login codes |
| `AUTH_URL` | ✅ in prod | Public origin (`https://app.dsec.club`). Feeds the post-login redirect allowlist — do not leave it as the localhost default |
| `AUTH_TRUST_HOST` | ✅ on Vercel | Trust the forwarded host header |
| `AUTH_COOKIE_DOMAIN` | games only | `.dsec.club` in production, matching `dsec-games` |
| `RESEND_API_KEY` | ✅ in prod | Sends login codes |
| `DSEC_API_URL` / `DSEC_API_KEY` | optional | Membership card + onboarding photo upload |
| `NEXT_PUBLIC_WEBSITE_URL` / `NEXT_PUBLIC_GAMES_URL` | optional | Outbound links; inlined at build time |

## Local ports

The four front-ends are separate repositories, each cloned on its own. Their dev
servers are pinned so all four can run at once:

| Service | Repository | URL |
|---|---|---|
| Public site | `dsec-website` | http://localhost:3000 |
| Member portal | `dsec-app` | http://localhost:3001 |
| Committee hub | `dsec-hub` | http://localhost:3002 |
| Games | `dsec-games` | http://localhost:3003 |
| API | `dsec-api` | http://localhost:8000 |

## Deployment

Deploys to **Vercel** as its own project from the repository root. See
[`CROSS_REPOSITORY.md`](./CROSS_REPOSITORY.md) for the contract with the sibling
services and [`SECURITY.md`](./SECURITY.md) for the security model.

## License

Copyright © 2026 DSEC. Licensed under **AGPL-3.0-only** — see [`LICENSE`](./LICENSE).
