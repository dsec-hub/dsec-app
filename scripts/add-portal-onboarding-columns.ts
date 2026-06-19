/**
 * One-time (idempotent) migration: add the onboarding + verification-photo
 * columns to `portal_account`.
 *
 *   npx tsx scripts/add-portal-onboarding-columns.ts
 *
 *   - photo_url               the member's face photo (Supabase webp URL),
 *                             REQUIRED before they can use the portal — it's how
 *                             committee visually verifies them with their card.
 *   - photo_uploaded_at       when that photo was set.
 *   - onboarding_completed_at when they finished the first-run wizard.
 *
 * App-owned (portal) — added here by hand, NEVER via `alembic --autogenerate`
 * (which can emit destructive DROPs against the live Neon database). Additive +
 * idempotent (ADD COLUMN IF NOT EXISTS) — safe to re-run.
 */
import { config } from "dotenv";

config({ path: ".env.local" });

const DDL = `
ALTER TABLE portal_account ADD COLUMN IF NOT EXISTS photo_url               text;
ALTER TABLE portal_account ADD COLUMN IF NOT EXISTS photo_uploaded_at       timestamptz;
ALTER TABLE portal_account ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;
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
    console.log("Adding portal_account onboarding/photo columns (idempotent)…");
    await pool.query(DDL);

    const { rows } = await pool.query(
      `SELECT count(*)::int AS n FROM portal_account WHERE photo_url IS NOT NULL`,
    );
    console.log(`Done. ${rows[0].n} account(s) have a verification photo so far.`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
