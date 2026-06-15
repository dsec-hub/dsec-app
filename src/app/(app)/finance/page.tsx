import Link from "next/link";

import {
  Badge,
  EmptyState,
  PageHeader,
  SectionCard,
  StatCard,
} from "@/components/ui";
import { requireModule } from "@/lib/dal";
import { formatAUD, formatDate } from "@/lib/format";
import { financeStatusVariant } from "@/lib/options";
import { getAllFinance, getEventOptions, type FinanceWithEvent } from "@/lib/queries";
import { canWrite } from "@/lib/rbac";

import { NewFinanceButton } from "./new-finance-button";

const SETTLED = new Set(["Paid", "Rejected"]);

function Row({ f }: { f: FinanceWithEvent }) {
  return (
    <li>
      <Link
        href={`/finance/${f.id}/edit`}
        className="flex items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-elevated/50"
      >
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{f.item}</div>
          <div className="truncate text-xs text-muted">
            {f.type ?? "—"}
            {f.eventName ? ` · ${f.eventName}` : ""}
            {f.dateRequested ? ` · ${formatDate(f.dateRequested)}` : ""}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-sm tabular-nums">{formatAUD(f.amountAud)}</span>
          <Badge variant={financeStatusVariant(f.status)}>{f.status ?? "—"}</Badge>
        </div>
      </Link>
    </li>
  );
}

export default async function FinancePage() {
  const me = await requireModule("finance");
  const writable = canWrite(me.modules, me.writeModules, "finance");
  const [all, events] = await Promise.all([getAllFinance(), getEventOptions()]);
  const outstanding = all.filter((f) => !SETTLED.has(f.status ?? ""));
  const settled = all.filter((f) => SETTLED.has(f.status ?? ""));
  const outstandingTotal = outstanding.reduce((acc, f) => acc + Number(f.amountAud ?? 0), 0);

  return (
    <>
      <PageHeader
        title="Finance"
        description="Grants, income, reimbursements, and expenses."
        breadcrumbs={[{ label: "Overview", href: "/" }, { label: "Finance" }]}
        action={writable && <NewFinanceButton events={events} />}
      />

      <section className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard
          label="Outstanding"
          value={formatAUD(outstandingTotal)}
          hint={`${outstanding.length} items`}
        />
        <StatCard label="Settled" value={settled.length} hint="paid / rejected" />
        <StatCard label="Total items" value={all.length} />
      </section>

      {all.length === 0 ? (
        <SectionCard title="Finance">
          <EmptyState>No finance items yet — add the first one.</EmptyState>
        </SectionCard>
      ) : (
        <div className="space-y-6">
          <SectionCard title={`Outstanding · ${formatAUD(outstandingTotal)}`}>
            {outstanding.length === 0 ? (
              <EmptyState>Nothing outstanding.</EmptyState>
            ) : (
              <ul className="divide-y divide-border">
                {outstanding.map((f) => (
                  <Row key={f.id} f={f} />
                ))}
              </ul>
            )}
          </SectionCard>
          {settled.length > 0 && (
            <SectionCard title="Settled">
              <ul className="divide-y divide-border">
                {settled.map((f) => (
                  <Row key={f.id} f={f} />
                ))}
              </ul>
            </SectionCard>
          )}
        </div>
      )}
    </>
  );
}
