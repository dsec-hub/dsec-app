import { count, eq } from "drizzle-orm";

import { auth, signOut } from "@/auth";
import { db } from "@/db";
import { events, finance, people, sponsors } from "@/db/schema";

async function activeCount(
  table: typeof events | typeof people | typeof sponsors | typeof finance,
) {
  const [row] = await db
    .select({ value: count() })
    .from(table)
    .where(eq(table.archived, false));
  return row?.value ?? 0;
}

export default async function DashboardHome() {
  const session = await auth();
  const [eventCount, peopleCount, sponsorCount, financeCount] = await Promise.all([
    activeCount(events),
    activeCount(people),
    activeCount(sponsors),
    activeCount(finance),
  ]);

  const stats = [
    { label: "Events", value: eventCount },
    { label: "People", value: peopleCount },
    { label: "Sponsors", value: sponsorCount },
    { label: "Finance items", value: financeCount },
  ];

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">DSEC Dashboard</h1>
          <p className="text-sm text-muted">
            Signed in as {session?.user?.name ?? session?.user?.email}
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/signin" });
          }}
        >
          <button className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-muted transition-colors hover:text-foreground">
            Sign out
          </button>
        </form>
      </header>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-border bg-surface p-5"
          >
            <div className="text-2xl font-semibold tabular-nums">{s.value}</div>
            <div className="mt-1 text-sm text-muted">{s.label}</div>
          </div>
        ))}
      </section>

      <p className="mt-10 text-sm text-muted">
        Live data from Neon. The full sections (needs attention, upcoming events,
        DUSA pipeline, money, roster) land in the next phase.
      </p>
    </div>
  );
}
