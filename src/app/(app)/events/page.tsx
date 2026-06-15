import Link from "next/link";

import { PageHeader, buttonSecondary } from "@/components/ui";
import { getCommitteeOptions } from "@/lib/committee-queries";
import { requireModule } from "@/lib/dal";
import { todayISO } from "@/lib/format";
import { getEvents, getPeopleOptions, getSponsorOptions } from "@/lib/queries";
import { canWrite } from "@/lib/rbac";

import { EventsView } from "./events-view";
import { NewEventButton } from "./new-event-button";

export default async function EventsPage() {
  const me = await requireModule("events");
  const writable = canWrite(me.modules, me.writeModules, "events");
  const [events, people, sponsors, committees] = await Promise.all([
    getEvents(),
    getPeopleOptions(),
    getSponsorOptions(),
    getCommitteeOptions(),
  ]);

  return (
    <>
      <PageHeader
        title="Events"
        description="Every event the club is running. Click one to view."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Events" }]}
        action={
          <div className="flex gap-2">
            <Link href="/events/dusa" className={buttonSecondary}>
              DUSA pipeline
            </Link>
            {writable && (
              <NewEventButton people={people} sponsors={sponsors} committees={committees} />
            )}
          </div>
        }
      />

      <EventsView events={events} today={todayISO()} />
    </>
  );
}
