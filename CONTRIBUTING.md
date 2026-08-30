# Contributing to dsec-app

The member portal behind **app.dsec.club**. Next.js 16. Members sign in here, so
this repo handles real personally identifiable information — names, student IDs,
emails. Handle it like it matters, because it does.

## Ground rules

1. **No secrets in the repo.** No `.env`, connection strings, or tokens in a
   commit — ever.
2. **No member PII in logs.** Never log submitted names, student IDs, or emails —
   not in server logs, not in error messages, not in analytics.
3. **The shared schema lives in `dsec-api`.** `src/db/schema.ts` mirrors it —
   keep it in step, and never alter a shared table from here. (Portal-owned
   tables are the exception: those are created through idempotent `scripts/`,
   like the rest of the club's app-owned tables.)
4. **Least data.** Collect and expose only what a screen actually needs. Don't
   widen a query or an API response to include PII a page doesn't use.

## How to contribute

1. Branch from `main`: `git checkout -b feat/<short-name>`.
2. Make the change and run the local gate:
   ```bash
   npm run typecheck && npm run lint && npm run build
   ```
3. Open a PR against `main` and fill in the template.
4. A code owner reviews. `src/db/schema.ts` is **maintainer-only** — see
   [CODEOWNERS](.github/CODEOWNERS).

## Project submissions (upcoming)

Student-project submissions will route through this portal (members are already
signed in — no public form). When that lands: the submitted text is untrusted
input and an injection surface, so it is never auto-published — a human approves
every submission, and any scoring is advisory only. Don't build a path that
publishes a submission without human approval.

**No binary hosting.** A submission may *link* to a student's build (GitHub
Releases, itch.io), but the club never hosts or serves that executable,
installer, APK, or firmware image from any `*.dsec.club` origin — link out, don't
upload. A browser-sandboxed web build (one that runs in the tab) is the only kind
safe to embed.
