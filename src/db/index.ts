import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

// One pool reused across HMR reloads in dev so we don't exhaust Neon's
// connection budget. Mirrors dsec-hub's db client — same shared Neon database.
const globalForDb = globalThis as unknown as { __pool?: Pool };

function createPool(): Pool {
  // This module is evaluated during `next build` (page-data collection), so a
  // missing DATABASE_URL fails the build, not just the first request. Name the
  // variable — `new URL("")` on its own only reports "Invalid URL".
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and fill it in " +
        "for local work, or set it in the Vercel project for a deploy.",
    );
  }
  const url = new URL(connectionString);
  // Handle TLS via the `ssl` option rather than the connection string so
  // node-postgres doesn't emit its sslmode-compatibility warning. Neon serves a
  // publicly-trusted certificate, so we keep verification on.
  const needsSsl = url.searchParams.get("sslmode") === "require";
  url.searchParams.delete("sslmode");
  const pool = new Pool({
    connectionString: url.toString(),
    max: 5,
    ssl: needsSsl ? { rejectUnauthorized: true } : undefined,
    // Neon auto-suspends idle compute; recycle our own idle clients well before
    // that and keep the socket alive so a request never inherits a dead
    // connection (the cause of intermittent "Failed query" errors).
    idleTimeoutMillis: 30_000,
    keepAlive: true,
  });
  pool.on("error", (err) => {
    console.warn("[db] idle pool client error (discarded):", err.message);
  });
  return pool;
}

const pool = globalForDb.__pool ?? createPool();
if (process.env.NODE_ENV !== "production") globalForDb.__pool = pool;

export const db = drizzle(pool, { schema });
