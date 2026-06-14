import { notFound } from "next/navigation";

import { PageHeader, buttonGhost } from "@/components/ui";
import { requireSession } from "@/lib/dal";
import { cn } from "@/lib/format";
import { getPersonById } from "@/lib/queries";

import { archivePerson, updatePerson } from "../../actions";
import { PersonForm } from "../../person-form";

export default async function EditPersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;
  const personId = Number(id);
  if (Number.isNaN(personId)) notFound();

  const person = await getPersonById(personId);
  if (!person) notFound();

  return (
    <>
      <PageHeader
        title="Edit person"
        description={person.name}
        action={
          <form
            action={async () => {
              "use server";
              await archivePerson(personId);
            }}
          >
            <button className={cn(buttonGhost, "text-danger hover:text-danger")}>
              Archive
            </button>
          </form>
        }
      />
      <PersonForm action={updatePerson.bind(null, personId)} person={person} />
    </>
  );
}
