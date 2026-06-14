import Link from "next/link";

import {
  Badge,
  EmptyState,
  PageHeader,
  SectionCard,
  buttonPrimary,
} from "@/components/ui";
import { requireSession } from "@/lib/dal";
import { formatAUD } from "@/lib/format";
import { SPONSOR_STAGES, sponsorStageVariant } from "@/lib/options";
import { getSponsors, type SponsorWithContact } from "@/lib/queries";

export default async function SponsorsPage() {
  await requireSession();
  const sponsors = await getSponsors();
  const total = sponsors.reduce((acc, s) => acc + Number(s.valueAud ?? 0), 0);

  const byStage = new Map<string, SponsorWithContact[]>();
  for (const s of sponsors) {
    const key = s.stage ?? "Prospect";
    if (!byStage.has(key)) byStage.set(key, []);
    byStage.get(key)!.push(s);
  }
  const stages = [
    ...new Set<string>([...SPONSOR_STAGES, ...sponsors.map((s) => s.stage ?? "Prospect")]),
  ].filter((st) => byStage.has(st));

  return (
    <>
      <PageHeader
        title="Sponsors"
        description={`Pipeline · ${formatAUD(total)} total value`}
        action={
          <Link href="/sponsors/new" className={buttonPrimary}>
            New sponsor
          </Link>
        }
      />

      {sponsors.length === 0 ? (
        <SectionCard title="Sponsors">
          <EmptyState>No sponsors yet — add the first lead.</EmptyState>
        </SectionCard>
      ) : (
        <div className="space-y-6">
          {stages.map((stage) => {
            const items = byStage.get(stage)!;
            const stageValue = items.reduce((acc, s) => acc + Number(s.valueAud ?? 0), 0);
            return (
              <SectionCard
                key={stage}
                title={`${stage} · ${items.length}`}
                action={
                  <span className="text-xs tabular-nums text-muted">
                    {formatAUD(stageValue)}
                  </span>
                }
              >
                <ul className="divide-y divide-border">
                  {items.map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/sponsors/${s.id}/edit`}
                        className="flex items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-elevated/50"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">
                            {s.organisation}
                          </div>
                          <div className="truncate text-xs text-muted">
                            {s.tier ?? "—"}
                            {s.contactName ? ` · ${s.contactName}` : ""}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <span className="text-sm tabular-nums text-muted">
                            {formatAUD(s.valueAud)}
                          </span>
                          <Badge variant={sponsorStageVariant(s.stage)}>
                            {s.stage ?? "—"}
                          </Badge>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            );
          })}
        </div>
      )}
    </>
  );
}
