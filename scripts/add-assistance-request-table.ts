/**
 * One-time (idempotent) migration: create the `assistance_request` table that
 * backs the member portal's "ask the developers for help" flow — typically a
 * member who signed up with a different email than the one on their DUSA
 * membership, so verification can't find them.
 *
 *   npx tsx scripts/add-assistance-request-table.ts
 *
 * Requests are reviewed in dsec-hub's Member Support admin view, where a dev can
 * approve the account (sets portal_account.manual_override = 'approved') or
 * resolve/dismiss the request. FK to portal_account ON DELETE SET NULL so a
 * deleted login leaves its request history intact (email is denormalised).
 *
 * App-owned (portal) — created here by hand, NEVER via `alembic --autogenerate`.
 * Depends on portal_account, so run add-portal-account-table.ts first. Additive
 * + idempotent — safe to re-run.
 */
import { config } from "dotenv";

config({ path: ".env.local" });

const DDL = `
CREATE TABLE IF NOT EXISTS assistance_request (
  id                serial PRIMARY KEY,
  portal_account_id integer REFERENCES portal_account(id) ON DELETE SET NULL,
  email             varchar(256) NOT NULL,
  contact_email     varchar(256),
  student_id        varchar(32),
  category          varchar(32)  NOT NULL DEFAULT 'verification',
  message           text         NOT NULL,
  status            varchar(16)  NOT NULL DEFAULT 'open',
  resolution_note   text,
  resolved_by       varchar(256),
  resolved_at       timestamptz,
  created_at        timestamptz  NOT NULL DEFAULT now(),
  updated_at        timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_assistance_request_status ON assistance_request (status, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_assistance_request_email  ON assistance_request (email);
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
    console.log("Creating assistance_request table + indexes (idempotent)…");
    await pool.query(DDL);

    const { rows } = await pool.query(`SELECT count(*)::int AS n FROM assistance_request`);
    console.log(`Done. assistance_request exists with ${rows[0].n} request(s).`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
