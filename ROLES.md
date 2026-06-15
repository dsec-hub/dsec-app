# Roles, Admin & Invites

Role-based access control for the dsec-app dashboard. Admins manage users, roles,
and invites from **/admin**; everyone else sees only the modules their role grants.

## Concepts

- **Modules** — gateable areas: `events`, `people`, `sponsors`, `finance`, `admin`.
  The **Overview** (`/`) is always available to any active user.
- **Role** — a named set of modules (stored in `app_role`). A role that includes
  the `admin` module is a **superuser**: full access to every module plus the
  admin panel.
- **User** (`app_user`) — has one role (`app_user.role_id`).
- **Invite** (`app_invite`) — an emailed, single-use, 7-day link that lets someone
  set a password and join with a pre-assigned role.

Built-in roles seeded by setup: **Admin** (system, full access), **Exec** (all
operational modules), **Events Lead**, **Sponsorship**, **Treasurer**, **Viewer**
(overview only). Admins can create/edit/delete custom roles in **/admin/roles**.

## Enforcement (defense in depth)

1. **Proxy** (`proxy.ts` → `auth.config.ts`) — coarse route gate from the JWT
   module snapshot.
2. **DAL** (`lib/dal.ts`) — `requireModule(key)` / `requireAdmin()` re-read the DB
   on every page and Server Action, so role changes take effect immediately.
3. **Nav** — the sidebar only shows modules the user can access.

## One-time setup

The RBAC tables are **app-owned** (created here, not by the dsec-api Alembic
migrations). Run the idempotent setup once against the database:

```bash
npx tsx scripts/setup-roles.ts
```

This creates `app_role` + `app_invite`, adds `app_user.role_id`, seeds the
built-in roles, and assigns every existing user the **Admin** role so current
execs keep full access. Safe to re-run.

Bootstrap or promote an admin login directly:

```bash
npx tsx scripts/create-user.ts you@example.com 'a-strong-password' 'Your Name'
# create-user assigns the Admin role automatically.
```

## Email (invites)

Invites send via the Resend HTTP API. Set in `.env.local`:

```
RESEND_API_KEY=re_...                       # optional
EMAIL_FROM=DSEC Dashboard <invites@your-domain>   # a Resend-verified sender
APP_URL=https://your-app.example.com        # used to build invite links
```

If `RESEND_API_KEY` is **not** set, invites still work: the admin UI shows a
**copyable invite link** to share manually (and the link is logged server-side).
`APP_URL` falls back to the request's host when unset.
