# Cross-repository contract

`dsec-app` is the member portal at `app.dsec.club`.

- It reads public content through `dsec-api` at `DSEC_API_URL`; use
  `DSEC_API_KEY` only for server-side API operations.
- `dsec-games` reads this application's Auth.js session. Both applications must
  use the same `AUTH_SECRET` and production `AUTH_COOKIE_DOMAIN=.dsec.club`.
- Keep `NEXT_PUBLIC_PORTAL_URL` set to `https://app.dsec.club` **in the
  `dsec-games` project** (this repo does not read that variable) so games login
  redirects return to this portal.
- Set `NEXT_PUBLIC_GAMES_URL=https://games.dsec.club` **in this project too**.
  `src/lib/login-redirect.ts` builds the post-login redirect allowlist from it
  with no fallback, so if it is missing here a player who signs in from the games
  site lands on the portal root instead of bouncing back to their game. It fails
  silently — there is no error path.

Deploy after `dsec-api`; coordinate authentication configuration with
`dsec-games` before changing either service.

## Enabling the shared session on the live portal

`AUTH_COOKIE_DOMAIN` is currently unset in production, so the portal issues a
**host-only** session cookie. Setting it to `.dsec.club` is what makes the shared
session work — but it is a one-way cut-over that needs care, because it does not
replace the existing cookie.

Cookies are keyed on name + domain + path, and the domain-scoped cookie uses the
**same name** (`__Secure-authjs.session-token`) as the host-only one. So enabling
the variable writes a *second* cookie alongside the first for every member who is
already signed in. Browsers send both, and Auth.js reads the **first match**,
which is the older host-only one. The consequences run in this direction:

- `games.dsec.club` works immediately — it only ever sees the new domain cookie.
- `app.dsec.club` is the side that misbehaves: it keeps reading the stale
  host-only token while refreshing a domain cookie it never looks at.
- **Sign-out silently fails on the portal.** The deletion is serialized with
  `domain=.dsec.club`, so it expires only the domain cookie; the host-only one
  survives and the member still appears signed in until it lapses on its own.

Plan the cut-over accordingly: rotate `AUTH_SECRET` at the same time (which
invalidates every existing session and forces a clean re-login), or accept that
already-signed-in members stay in a mixed state until their old cookie expires.
Do this before the first `dsec-games` deploy, not after.
