/**
 * One-time (idempotent) migration: create the `email_login_code` table that
 * backs passwordless email sign-in (a 6-digit code emailed to the member).
 *
 *   npx tsx scripts/add-email-login-code-table.ts
 *
 * We store only an HMAC of the code (peppered with AUTH_SECRET), with an expiry,
 * single-use flag, and an attempt counter. App-owned (portal) — created here by
 * hand, NEVER via `alembic --autogenerate`. Additive + idempotent — safe to re-run.
 */
import { config } from "dotenv";

config({ path: ".env.local" });

const DDL = `
CREATE TABLE IF NOT EXISTS email_login_code (
  id          serial PRIMARY KEY,
  email       varchar(256) NOT NULL,
  code_hash   varchar(128) NOT NULL,
  expires_at  timestamptz  NOT NULL,
  consumed_at timestamptz,
  attempts    integer      NOT NULL DEFAULT 0,
  created_at  timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_email_login_code_email ON email_login_code (email, created_at DESC);
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
    console.log("Creating email_login_code table + index (idempotent)…");
    await pool.query(DDL);
    const { rows } = await pool.query(`SELECT count(*)::int AS n FROM email_login_code`);
    console.log(`Done. email_login_code exists with ${rows[0].n} row(s).`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
