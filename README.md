# dsec-app — DSEC Member Portal

The member-facing portal for the Deakin Software Engineering Club, served at
**app.dsec.club**. (The committee/exec dashboard moved to **`dsec-hub`** →
hub.dsec.club.)

- **Stack:** Next.js 16 (App Router) + Tailwind v4 (CSS-first) + TypeScript.
- **Design system:** shared with `dsec-website` — same `globals.css` tokens,
  Silkscreen/Hanken/JetBrains fonts, pixel-art duck illustrations, and the
  chunky cream-offset "DSEC OS" look.
- **Data:** reads the same backend as the website — `dsec-api` (`/website/*`
  public feed), which is backed by the shared **Neon** Postgres and **Supabase**
  Storage. No DB/Supabase creds live here yet; everything goes through the API.

## Status

This is an intentionally minimal v1: a branded landing page with a feature
preview and a live "upcoming events" strip pulled from the API (which proves the
wiring). Member auth and the real feature pages (profile, RSVPs, projects,
membership) come next.

## Develop

```bash
cd dsec-app
npm install
npm run dev          # http://localhost:3001
```

Copy `.env.example` → `.env.local` and fill in `DATABASE_URL` + `DSEC_API_URL`
(or run the whole stack with `../dev.sh`).

## Ports (local)

| Service       | Folder         | URL                    |
| ------------- | -------------- | ---------------------- |
| Public site   | `dsec-website` | http://localhost:3000  |
| Member portal | `dsec-app`     | http://localhost:3001  |
| Committee hub | `dsec-hub`     | http://localhost:3002  |
| API           | `dsec-api`     | http://localhost:8000  |
