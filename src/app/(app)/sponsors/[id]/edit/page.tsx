import { notFound } from "next/navigation";

import { PageHeader, buttonGhost } from "@/components/ui";
import { requireSession } from "@/lib/dal";
import { cn } from "@/lib/format";
import { getPeopleOptions, getSponsorById } from "@/lib/queries";

import { archiveSponsor, updateSponsor } from "../../actions";
import { SponsorForm } from "../../sponsor-form";

export default async function EditSponsorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;
  const sponsorId = Number(id);
  if (Number.isNaN(sponsorId)) notFound();

  const [sponsor, people] = await Promise.all([
    getSponsorById(sponsorId),
    getPeopleOptions(),
  ]);
  if (!sponsor) notFound();

  return (
    <>
      <PageHeader
        title="Edit sponsor"
        description={sponsor.organisation}
        action={
          <form
            action={async () => {
              "use server";
              await archiveSponsor(sponsorId);
            }}
          >
            <button className={cn(buttonGhost, "text-danger hover:text-danger")}>
              Archive
            </button>
          </form>
        }
      />
      <SponsorForm
        action={updateSponsor.bind(null, sponsorId)}
        people={people}
        sponsor={sponsor}
      />
    </>
  );
}
