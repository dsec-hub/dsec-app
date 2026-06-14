import { PageHeader } from "@/components/ui";
import { requireSession } from "@/lib/dal";
import { getEventOptions } from "@/lib/queries";

import { createFinance } from "../actions";
import { FinanceForm } from "../finance-form";

export default async function NewFinancePage() {
  await requireSession();
  const events = await getEventOptions();
  return (
    <>
      <PageHeader title="New finance item" description="Record a grant, income, or expense." />
      <FinanceForm action={createFinance} events={events} />
    </>
  );
}
