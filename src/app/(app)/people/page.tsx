import Link from "next/link";

import {
  Badge,
  EmptyState,
  PageHeader,
  SectionCard,
  buttonPrimary,
} from "@/components/ui";
import { requireSession } from "@/lib/dal";
import { personStatusVariant } from "@/lib/options";
import { getAllPeople, type PersonRow } from "@/lib/queries";

export default async function PeoplePage() {
  await requireSession();
  const people = await getAllPeople();

  const groups = new Map<string, PersonRow[]>();
  for (const p of people) {
    const key = p.committee ?? "Unassigned";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }

  return (
    <>
      <PageHeader
        title="People"
        description="Committee roster and contacts."
        action={
          <Link href="/people/new" className={buttonPrimary}>
            New person
          </Link>
        }
      />

      {people.length === 0 ? (
        <SectionCard title="People">
          <EmptyState>No people yet — add the committee.</EmptyState>
        </SectionCard>
      ) : (
        <div className="space-y-6">
          {[...groups.entries()].map(([committee, members]) => (
            <SectionCard key={committee} title={`${committee} · ${members.length}`}>
              <ul className="divide-y divide-border">
                {members.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/people/${p.id}/edit`}
                      className="flex items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-elevated/50"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{p.name}</div>
                        <div className="truncate text-xs text-muted">
                          {p.roleTitle ?? p.type ?? "—"}
                          {p.email ? ` · ${p.email}` : ""}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge variant="neutral">{p.type ?? "—"}</Badge>
                        <Badge variant={personStatusVariant(p.status)}>
                          {p.status ?? "—"}
                        </Badge>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </SectionCard>
          ))}
        </div>
      )}
    </>
  );
}
