/**
 * One-time (idempotent) migration: create the `portal_account` table that backs
 * the member portal's login + DUSA-membership lifecycle.
 *
 *   npx tsx scripts/add-portal-account-table.ts
 *
 * One row per portal login. `email` is the OAuth-verified address we match
 * against the `members` roster (the verification oracle). New signups get a
 * 7-day trial (`trial_expires_at`); `manual_override` lets the committee approve
 * or reject from dsec-hub's Member Support view.
 *
 * App-owned (portal) — created here by hand, NEVER via `alembic --autogenerate`
 * (which can emit destructive DROPs against the live Neon database). Additive +
 * idempotent (CREATE TABLE / INDEX IF NOT EXISTS) — safe to re-run.
 */
import { config } from "dotenv";

config({ path: ".env.local" });

const DDL = `
CREATE TABLE IF NOT EXISTS portal_account (
  id                  serial PRIMARY KEY,
  email               varchar(256) NOT NULL,
  name                varchar(256),
  avatar_url          text,
  provider            varchar(32),
  provider_account_id varchar(256),
  status              varchar(24)  NOT NULL DEFAULT 'trial',
  trial_started_at    timestamptz  NOT NULL DEFAULT now(),
  trial_expires_at    timestamptz  NOT NULL DEFAULT (now() + interval '7 days'),
  verified_at         timestamptz,
  last_matched_at     timestamptz,
  member_id           integer,
  last_check_at       timestamptz,
  manual_override     varchar(16),
  override_by         varchar(256),
  override_note       text,
  created_at          timestamptz  NOT NULL DEFAULT now(),
  updated_at          timestamptz  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ix_portal_account_email     ON portal_account (lower(email));
CREATE INDEX        IF NOT EXISTS ix_portal_account_status    ON portal_account (status);
CREATE INDEX        IF NOT EXISTS ix_portal_account_member_id ON portal_account (member_id);
`;

async function main() {
  const { Pool } = await import("pg");

  const url = new URL(process.env.DATABASE_URL ?? "");
  const needsSsl = url.searchParams.get("sslmode") === "require";
  url.searchParams.delete("sslmode");
  const pool = new Pool({
    connectionString: url.toString(),
    ssl: needsSsl ? { rejectUnauthorized: true } : undefined,
  });

  try {
    console.log("Creating portal_account table + indexes (idempotent)…");
    await pool.query(DDL);

    const { rows } = await pool.query(`SELECT count(*)::int AS n FROM portal_account`);
    console.log(`Done. portal_account exists with ${rows[0].n} account(s).`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
