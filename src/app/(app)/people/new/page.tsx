import { PageHeader } from "@/components/ui";
import { requireSession } from "@/lib/dal";

import { createPerson } from "../actions";
import { PersonForm } from "../person-form";

export default async function NewPersonPage() {
  await requireSession();
  return (
    <>
      <PageHeader title="New person" description="Add a committee member or contact." />
      <PersonForm action={createPerson} />
    </>
  );
}
