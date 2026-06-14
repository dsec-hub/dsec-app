import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

// Reuse one pool across HMR reloads in dev so we don't exhaust Neon connections.
const globalForDb = globalThis as unknown as { __pool?: Pool };

function createPool(): Pool {
  const url = new URL(process.env.DATABASE_URL ?? "");
  // Handle TLS via the `ssl` option rather than the connection string so
  // node-postgres doesn't emit its sslmode-compatibility warning. Neon serves a
  // publicly-trusted certificate, so we keep verification on.
  const needsSsl = url.searchParams.get("sslmode") === "require";
  url.searchParams.delete("sslmode");
  return new Pool({
    connectionString: url.toString(),
    max: 5,
    ssl: needsSsl ? { rejectUnauthorized: true } : undefined,
  });
}

const pool = globalForDb.__pool ?? createPool();
if (process.env.NODE_ENV !== "production") globalForDb.__pool = pool;

export const db = drizzle(pool, { schema });
