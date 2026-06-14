import { notFound } from "next/navigation";

import { PageHeader, buttonGhost } from "@/components/ui";
import { requireSession } from "@/lib/dal";
import { cn } from "@/lib/format";
import { getEventOptions, getFinanceById } from "@/lib/queries";

import { archiveFinance, updateFinance } from "../../actions";
import { FinanceForm } from "../../finance-form";

export default async function EditFinancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;
  const financeId = Number(id);
  if (Number.isNaN(financeId)) notFound();

  const [entry, events] = await Promise.all([
    getFinanceById(financeId),
    getEventOptions(),
  ]);
  if (!entry) notFound();

  return (
    <>
      <PageHeader
        title="Edit finance item"
        description={entry.item}
        action={
          <form
            action={async () => {
              "use server";
              await archiveFinance(financeId);
            }}
          >
            <button className={cn(buttonGhost, "text-danger hover:text-danger")}>
              Archive
            </button>
          </form>
        }
      />
      <FinanceForm
        action={updateFinance.bind(null, financeId)}
        events={events}
        entry={entry}
      />
    </>
  );
}
