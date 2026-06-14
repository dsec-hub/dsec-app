import { PageHeader } from "@/components/ui";
import { requireSession } from "@/lib/dal";
import { getPeopleOptions } from "@/lib/queries";

import { createSponsor } from "../actions";
import { SponsorForm } from "../sponsor-form";

export default async function NewSponsorPage() {
  await requireSession();
  const people = await getPeopleOptions();
  return (
    <>
      <PageHeader title="New sponsor" description="Add a sponsorship lead." />
      <SponsorForm action={createSponsor} people={people} />
    </>
  );
}
