import Link from "next/link";
import { notFound } from "next/navigation";

import { Markdown } from "@/components/markdown";
import { Badge, Card, PageHeader, SectionCard, buttonSecondary } from "@/components/ui";
import { requireModule } from "@/lib/dal";
import { formatDate } from "@/lib/format";
import { canWrite } from "@/lib/rbac";
import { projectStatusVariant } from "@/lib/workspace-options";
import { getPersonOptions, getProjectById } from "@/lib/workspace-queries";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireModule("projects");
  const writable = canWrite(me.modules, me.writeModules, "projects");
  const { id } = await params;
  const pid = Number(id);
  if (Number.isNaN(pid)) notFound();
  const [project, people] = await Promise.all([getProjectById(pid), getPersonOptions()]);
  if (!project) notFound();
  const lead = people.find((p) => p.id === project.leadId)?.name;

  return (
    <>
      <PageHeader
        title={project.name}
        description={project.summary ?? undefined}
        breadcrumbs={[
          { label: "Overview", href: "/" },
          { label: "Projects", href: "/projects" },
          { label: project.name },
        ]}
        action={
          writable && (
            <Link href={`/projects/${project.id}/edit`} className={buttonSecondary}>
              Edit
            </Link>
          )
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Badge variant={projectStatusVariant(project.status)}>{project.status ?? "—"}</Badge>
        {project.isPublic && <Badge variant="accent">Public</Badge>}
        {project.featured && <span className="text-sm text-accent-text">★ Featured</span>}
        {project.category && <Badge variant="neutral">{project.category}</Badge>}
      </div>

      {project.techTags && project.techTags.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-1.5">
          {project.techTags.map((t) => (
            <Badge key={t} variant="neutral">{t}</Badge>
          ))}
        </div>
      )}

      {project.description && (
        <SectionCard title="About" className="mb-6">
          <div className="p-5">
            <Markdown content={project.description} />
          </div>
        </SectionCard>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Meta label="Lead" value={lead ?? "—"} />
        <Meta label="Timeline" value={`${formatDate(project.startDate)} → ${formatDate(project.endDate)}`} />
        <Meta label="Repository" value={project.repoUrl ? <ExtLink href={project.repoUrl} /> : "—"} />
        <Meta label="Demo" value={project.demoUrl ? <ExtLink href={project.demoUrl} /> : "—"} />
      </div>

      {project.notes && (
        <SectionCard title="Notes" className="mt-6">
          <div className="p-5">
            <Markdown content={project.notes} />
          </div>
        </SectionCard>
      )}
    </>
  );
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card className="p-5">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1.5 text-sm">{value}</div>
    </Card>
  );
}

function ExtLink({ href }: { href: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="break-all text-accent-text underline underline-offset-2">
      {href}
    </a>
  );
}
