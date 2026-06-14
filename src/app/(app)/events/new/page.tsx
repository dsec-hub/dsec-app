import { PageHeader } from "@/components/ui";
import { requireSession } from "@/lib/dal";
import { getPeopleOptions } from "@/lib/queries";

import { createEvent } from "../actions";
import { EventForm } from "../event-form";

export default async function NewEventPage() {
  await requireSession();
  const people = await getPeopleOptions();

  return (
    <>
      <PageHeader title="New event" description="Add an event to the calendar." />
      <EventForm action={createEvent} people={people} />
    </>
  );
}
