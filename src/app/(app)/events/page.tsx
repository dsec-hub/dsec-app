import Link from "next/link";

import {
  Badge,
  EmptyState,
  PageHeader,
  SectionCard,
  buttonPrimary,
  buttonSecondary,
} from "@/components/ui";
import { requireSession } from "@/lib/dal";
import { formatDate } from "@/lib/format";
import { dusaVariant, eventStatusVariant } from "@/lib/options";
import { getEvents } from "@/lib/queries";

export default async function EventsPage() {
  await requireSession();
  const events = await getEvents();

  return (
    <>
      <PageHeader
        title="Events"
        description="Every event the club is running. Click one to edit."
        action={
          <div className="flex gap-2">
            <Link href="/events/dusa" className={buttonSecondary}>
              DUSA pipeline
            </Link>
            <Link href="/events/new" className={buttonPrimary}>
              New event
            </Link>
          </div>
        }
      />

      <SectionCard title={`${events.length} event${events.length === 1 ? "" : "s"}`}>
        {events.length === 0 ? (
          <EmptyState>No events yet — create the first one.</EmptyState>
        ) : (
          <ul className="divide-y divide-border">
            {events.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/events/${e.id}/edit`}
                  className="flex items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-elevated/50"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{e.name}</div>
                    <div className="mt-0.5 truncate text-xs text-muted">
                      {formatDate(e.startDate)} · {e.leadName ?? "no lead"} ·{" "}
                      {e.committee ?? "—"}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant={dusaVariant(e.dusaSubmissionStatus)}>
                      {e.dusaSubmissionStatus ?? "—"}
                    </Badge>
                    <Badge variant={eventStatusVariant(e.status)}>{e.status ?? "—"}</Badge>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </>
  );
}
