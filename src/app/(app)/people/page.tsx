import Link from "next/link";

import { CommitteeDot } from "@/components/committee-select";
import { Badge, EmptyState, PageHeader, SectionCard } from "@/components/ui";
import { getCommittees } from "@/lib/committee-queries";
import { requireModule } from "@/lib/dal";
import { personStatusVariant } from "@/lib/options";
import { getAllPeople, type PersonRow } from "@/lib/queries";
import { canWrite } from "@/lib/rbac";

import { NewPersonButton } from "./new-person-button";

export default async function PeoplePage() {
  const me = await requireModule("people");
  const writable = canWrite(me.modules, me.writeModules, "people");
  const [people, committees] = await Promise.all([getAllPeople(), getCommittees()]);

  // Committee metadata (colour, lead) + display order, keyed by name.
  const meta = new Map(committees.map((c) => [c.name, c]));
  const order = new Map(committees.map((c, i) => [c.name, i]));

  const groups = new Map<string, PersonRow[]>();
  for (const p of people) {
    const key = p.committee ?? "Unassigned";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }

  // Known committees first (configured order), then any legacy names, with
  // "Unassigned" always last.
  const sortedGroups = [...groups.entries()].sort(([a], [b]) => {
    const ra = a === "Unassigned" ? Infinity : order.get(a) ?? Number.MAX_SAFE_INTEGER;
    const rb = b === "Unassigned" ? Infinity : order.get(b) ?? Number.MAX_SAFE_INTEGER;
    return ra !== rb ? ra - rb : a.localeCompare(b);
  });

  // Active committees → options for the create form.
  const committeeOptions = committees
    .filter((c) => c.isActive)
    .map((c) => ({ id: c.id, name: c.name }));

  return (
    <>
      <PageHeader
        title="People"
        description="Committee roster and contacts."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "People" }]}
        action={writable && <NewPersonButton committees={committeeOptions} />}
      />

      {people.length === 0 ? (
        <SectionCard title="People">
          <EmptyState>No people yet — add the committee.</EmptyState>
        </SectionCard>
      ) : (
        <div className="space-y-6">
          {sortedGroups.map(([committee, members]) => {
            const c = meta.get(committee);
            return (
              <SectionCard
                key={committee}
                title={
                  <span className="flex items-center gap-2">
                    <CommitteeDot color={c?.color} />
                    <span>{committee}</span>
                    <span className="font-normal text-muted">· {members.length}</span>
                    {c?.leadName && (
                      <span className="font-normal text-muted">· Lead: {c.leadName}</span>
                    )}
                  </span>
                }
              >
                <ul className="divide-y divide-border">
                  {members.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/people/${p.id}`}
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
            );
          })}
        </div>
      )}
    </>
  );
}
