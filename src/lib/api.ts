/**
 * Thin client for the dsec-api public feed (`/website/*`, no auth) — the same
 * backend the public site and committee hub read. This proves the portal's
 * wiring to the shared API (which itself reads the shared Neon DB). Feature
 * pages will add authenticated loaders later.
 *
 * Every loader returns `null` on any failure (unset DSEC_API_URL, network error,
 * bad status) so the UI can show a friendly fallback instead of crashing.
 */

export type PortalEvent = {
  slug: string;
  title: string;
  date: string | null; // ISO date (YYYY-MM-DD)
  venue: string | null;
  type: string | null;
  upcoming: boolean;
};

function apiBase(): string | null {
  const b = process.env.DSEC_API_URL;
  return b ? b.replace(/\/+$/, "") : null;
}

/** Upcoming events from the shared API feed, soonest first. `null` on failure. */
export async function getUpcomingEvents(limit = 4): Promise<PortalEvent[] | null> {
  const base = apiBase();
  if (!base) return null;
  try {
    // 5-min cache; the feed is public and changes rarely.
    const res = await fetch(`${base}/website/events`, { next: { revalidate: 300 } });
    if (!res.ok) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[dsec-api] GET /website/events → ${res.status}`);
      }
      return null;
    }
    const rows = (await res.json()) as PortalEvent[];
    return rows.filter((e) => e.upcoming).slice(0, limit);
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[dsec-api] GET /website/events failed: ${(err as Error).message}`);
    }
    return null;
  }
}
