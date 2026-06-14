import Link from "next/link";

import { Badge, Card, PageHeader } from "@/components/ui";
import { requireSession } from "@/lib/dal";
import { formatDate } from "@/lib/format";
import { DUSA_STATUSES, dusaVariant } from "@/lib/options";
import { getDusaPipeline } from "@/lib/queries";

export default async function DusaPipelinePage() {
  await requireSession();
  const all = await getDusaPipeline();
  const columns = DUSA_STATUSES.map((status) => ({
    status,
    items: all.filter((e) => (e.dusaSubmissionStatus ?? "Not Started") === status),
  }));

  return (
    <>
      <PageHeader
        title="DUSA pipeline"
        description="Events grouped by submission status, soonest deadline first."
        action={
          <Link href="/events" className="text-sm text-muted hover:text-foreground">
            ← All events
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {columns.map((col) => (
          <div key={col.status} className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-medium">{col.status}</span>
              <Badge variant={dusaVariant(col.status)}>{col.items.length}</Badge>
            </div>
            <div className="flex flex-col gap-2">
              {col.items.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted">
                  None
                </p>
              ) : (
                col.items.map((e) => (
                  <Link key={e.id} href={`/events/${e.id}/edit`}>
                    <Card className="p-3 transition-colors hover:bg-elevated">
                      <div className="truncate text-sm font-medium">{e.name}</div>
                      <div className="mt-1 text-xs text-muted">
                        {e.dusaDeadline ? `Due ${formatDate(e.dusaDeadline)}` : "No deadline"}
                      </div>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
