import { notFound } from "next/navigation";

import { PageHeader, buttonGhost } from "@/components/ui";
import { requireSession } from "@/lib/dal";
import { cn } from "@/lib/format";
import { getEventById, getPeopleOptions } from "@/lib/queries";

import { archiveEvent, updateEvent } from "../../actions";
import { EventForm } from "../../event-form";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;
  const eventId = Number(id);
  if (Number.isNaN(eventId)) notFound();

  const [event, people] = await Promise.all([
    getEventById(eventId),
    getPeopleOptions(),
  ]);
  if (!event) notFound();

  return (
    <>
      <PageHeader
        title="Edit event"
        description={event.name}
        action={
          <form
            action={async () => {
              "use server";
              await archiveEvent(eventId);
            }}
          >
            <button className={cn(buttonGhost, "text-danger hover:text-danger")}>
              Archive
            </button>
          </form>
        }
      />
      <EventForm
        action={updateEvent.bind(null, eventId)}
        people={people}
        event={event}
      />
    </>
  );
}
