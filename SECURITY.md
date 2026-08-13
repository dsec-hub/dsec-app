# Security policy — dsec-app

## Reporting a vulnerability

Email **admin@dsec.club** with "SECURITY" in the subject. Please do not open a
public issue for anything exploitable.

Useful things to include: the URL or endpoint, what you did, what happened, and
whether you needed an account. We will acknowledge and keep you posted on a fix.
This is a student club, not a company with an on-call rota, so treat response
times as best-effort.

## Scope of this document

This file covers **dsec-app only** — the member portal at `app.dsec.club`. The
public site (`dsec-website`), the committee dashboard (`dsec-hub`), the games
surface (`dsec-games`) and the API (`dsec-api`) each have their own repository
and their own security notes.

## What this app does

The portal authenticates members with a one-time emailed code (Auth.js v5,
Credentials provider) and connects directly to the shared Neon Postgres
database.

| Control | Where | Notes |
|---|---|---|
| Session auth + route gating | `src/auth.ts`, `src/auth.config.ts`, `src/proxy.ts` | Auth.js v5. The proxy matcher excludes `/api`. |
| Login codes are peppered before storage | `src/lib/login-code.ts` | HMAC keyed on `AUTH_SECRET`. **If `AUTH_SECRET` is unset the key degrades to an empty string**, which defeats the property that a database leak cannot reverse the codes. Always set it. |
| Post-login redirect allowlist | `src/lib/login-redirect.ts` | Relative paths and allowlisted sibling origins only, so `?callbackUrl=` is not an open redirect. The allowlist is built from `NEXT_PUBLIC_GAMES_URL` and `AUTH_URL`. |
| Cross-subdomain session | `AUTH_COOKIE_DOMAIN` | Set to `.dsec.club` in production, and to the same value in `dsec-games`, with a matching `AUTH_SECRET`. |

### Known gaps in this repo

- There is **no application-level rate limiting and no login throttle** in this
  repo. There is no Upstash dependency and no `src/lib/rate-limit.ts`. An earlier
  version of this document claimed both existed here; they exist in `dsec-hub`.
  Brute-force protection for this portal is currently edge-only.
- `next-auth` is pinned to a pre-release (`5.0.0-beta.31`) with a caret range, so
  an unpinned install can move the auth layer. See the repo's open security
  advisories before upgrading.

## Environment variables that are security-relevant

`AUTH_SECRET` (required — signs sessions and peppers login codes), `AUTH_URL`
(must be the real production origin; it feeds the redirect allowlist),
`AUTH_TRUST_HOST` (required behind Vercel's proxy), `AUTH_COOKIE_DOMAIN`,
`DATABASE_URL`, and `DSEC_API_KEY` (server-only, never exposed to the browser).

## Edge protection

The `app.dsec.club` DNS record is grey-cloud (DNS-only) in Cloudflare, so
Cloudflare's proxied protections — WAF rules, rate-limiting rules, Bot Fight
Mode — are **not** in the request path. Edge mitigation is whatever the Vercel
project's Firewall settings provide. Given there is no in-app throttle, a custom
Firewall rule on `/api/auth/*` is worth configuring.

> **Migration note.** `api.dsec.club` is moving off Vercel to an OVH VPS, so edge
> protection for the API becomes a VPS concern rather than a Vercel Firewall one.
> That does not change this repo, but do not assume the API is still behind the
> same layer as the portal.
