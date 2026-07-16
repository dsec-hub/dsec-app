# Cross-repository contract

`dsec-app` is the member portal at `app.dsec.club`.

- It reads public content through `dsec-api` at `DSEC_API_URL`; use
  `DSEC_API_KEY` only for server-side API operations.
- `dsec-games` reads this application's Auth.js session. Both applications must
  use the same `AUTH_SECRET` and production `AUTH_COOKIE_DOMAIN=.dsec.club`.
- Keep `NEXT_PUBLIC_PORTAL_URL` set to `https://app.dsec.club` so games login
  redirects return to this portal.

Deploy after `dsec-api`; coordinate authentication configuration with
`dsec-games` before changing either service.
