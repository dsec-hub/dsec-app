import Link from "next/link";

import { StatTile } from "@/components/dashboard";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { requireModule } from "@/lib/dal";
import type { BadgeVariant } from "@/lib/options";
import { canWrite } from "@/lib/rbac";
import {
  getEventOptions,
  getPersonOptions,
  getProjects,
  getProjectStats,
} from "@/lib/workspace-queries";

import { NewProjectButton } from "./new-project-button";

function projectStatusVariant(status: string | null | undefined): BadgeVariant {
  switch (status) {
    case "Completed":
    case "Showcased":
      return "success";
    case "In Progress":
    case "Active":
      return "accent";
    case "Planning":
    case "Concept":
    case "Idea":
      return "warning";
    case "Cancelled":
    case "Archived":
      return "danger";
    default:
      return "neutral";
  }
}

export default async function ProjectsPage() {
  const me = await requireModule("projects");
  const writable = canWrite(me.modules, me.writeModules, "projects");
  const [projects, stats, people, events] = await Promise.all([
    getProjects(),
    getProjectStats(),
    getPersonOptions(),
    getEventOptions(),
  ]);

  return (
    <>
      <PageHeader
        title="Projects"
        description="What the club is building — community projects, tools, and showcases."
        breadcrumbs={[{ label: "Overview", href: "/" }, { label: "Projects" }]}
        action={writable && <NewProjectButton people={people} events={events} />}
      />

      <div className="mb-6 grid grid-cols-3 gap-4">
        <StatTile label="Total" value={stats.total} accent />
        <StatTile label="Public" value={stats.public} sub="visible on the site" />
        <StatTile label="Shipped" value={stats.shipped} tone="success" sub="completed or showcased" />
      </div>

      {projects.length === 0 ? (
        <Card>
          <EmptyState>No projects yet — add the first one.</EmptyState>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Card
              key={p.id}
              className="relative flex h-full flex-col p-5 transition-colors hover:border-accent/50"
            >
              <Link
                href={`/projects/${p.id}`}
                aria-label={`View ${p.name}`}
                className="absolute inset-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
              />
              {p.category && (
                <div className="text-xs uppercase tracking-wide text-muted">{p.category}</div>
              )}
              <div className="mt-1 font-medium">{p.name}</div>
              {p.summary && (
                <p className="mt-1.5 line-clamp-2 text-sm text-muted">{p.summary}</p>
              )}

              {p.techTags && p.techTags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.techTags.map((tag) => (
                    <Badge key={tag} variant="neutral">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {(p.repoUrl || p.demoUrl) && (
                <div className="relative z-10 mt-3 flex flex-wrap gap-3 text-xs">
                  {p.repoUrl && (
                    <a
                      href={p.repoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted transition-colors hover:text-foreground"
                    >
                      Repo ↗
                    </a>
                  )}
                  {p.demoUrl && (
                    <a
                      href={p.demoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted transition-colors hover:text-foreground"
                    >
                      Demo ↗
                    </a>
                  )}
                </div>
              )}

              <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-4">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant={projectStatusVariant(p.status)}>{p.status ?? "—"}</Badge>
                  {p.isPublic && <Badge variant="accent">Public</Badge>}
                  {p.featured && (
                    <span className="text-accent-text" title="Featured" aria-label="Featured">
                      ★
                    </span>
                  )}
                </div>
                {p.leadName && (
                  <span className="truncate text-xs text-muted">{p.leadName}</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
