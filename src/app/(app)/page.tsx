import Link from "next/link";

import {
  Badge,
  EmptyState,
  PageHeader,
  SectionCard,
  StatCard,
} from "@/components/ui";
import { daysUntil, formatAUD, formatDate } from "@/lib/format";
import { eventStatusVariant } from "@/lib/options";
import {
  getNeedsAttention,
  getOutstandingFinance,
  getRoster,
  getUpcomingEvents,
  type EventWithLead,
} from "@/lib/queries";

function attentionReason(e: EventWithLead): string {
  if (!e.eventLeadId && (e.status === "Idea" || e.status === "Planning")) {
    return "No lead assigned";
  }
  const d = daysUntil(e.dusaDeadline);
  if (d === null) return "DUSA submission";
  if (d < 0) return `DUSA overdue ${Math.abs(d)}d`;
  return `DUSA due in ${d}d`;
}

export default async function OverviewPage() {
  const [needs, upcoming, finance, roster] = await Promise.all([
    getNeedsAttention(),
    getUpcomingEvents(),
    getOutstandingFinance(),
    getRoster(),
  ]);

  return (
    <>
      <PageHeader
        title="Overview"
        description="Live from Neon — the single source of truth."
      />

      <section className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Upcoming events" value={upcoming.length} />
        <StatCard
          label="Need attention"
          value={needs.length}
          hint={needs.length ? "act soon" : "all clear"}
        />
        <StatCard
          label="Outstanding"
          value={formatAUD(finance.total)}
          hint={`${finance.rows.length} items`}
        />
        <StatCard label="Committee" value={roster.length} hint="people" />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Needs attention"
          action={
            <Link href="/events" className="text-xs text-muted hover:text-foreground">
              All events →
            </Link>
          }
        >
          {needs.length === 0 ? (
            <EmptyState>Nothing needs attention right now. 🎉</EmptyState>
          ) : (
            <ul className="divide-y divide-border">
              {needs.map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/events/${e.id}/edit`}
                    className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-elevated/50"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{e.name}</div>
                      <div className="text-xs text-muted">
                        {e.committee ?? "—"} · {formatDate(e.startDate)}
                      </div>
                    </div>
                    <Badge variant="danger">{attentionReason(e)}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Upcoming events"
          action={
            <Link href="/events" className="text-xs text-muted hover:text-foreground">
              All →
            </Link>
          }
        >
          {upcoming.length === 0 ? (
            <EmptyState>No upcoming events scheduled.</EmptyState>
          ) : (
            <ul className="divide-y divide-border">
              {upcoming.slice(0, 6).map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{e.name}</div>
                    <div className="text-xs text-muted">
                      {formatDate(e.startDate)} · {e.leadName ?? "no lead"}
                    </div>
                  </div>
                  <Badge variant={eventStatusVariant(e.status)}>{e.status ?? "—"}</Badge>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </>
  );
}
