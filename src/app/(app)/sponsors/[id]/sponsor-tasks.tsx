"use client";

import Link from "next/link";
import { useRef } from "react";

import { TextInput } from "@/components/form";
import { Badge, EmptyState, SectionCard, buttonGhost } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { priorityVariant } from "@/lib/workspace-options";
import type { SponsorTaskRow } from "@/lib/workspace-queries";

import { quickAddSponsorTask } from "../actions";

export function SponsorTasks({
  sponsorId,
  tasks,
  canWrite,
}: {
  sponsorId: number;
  tasks: SponsorTaskRow[];
  canWrite: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <SectionCard
      title={`Task board · ${tasks.length}`}
      action={
        <Link href="/tasks" className={buttonGhost}>
          Open global tasks
        </Link>
      }
    >
      {tasks.length === 0 ? (
        <EmptyState>No tasks yet. Add one below — it also shows on the global board.</EmptyState>
      ) : (
        <ul className="divide-y divide-border">
          {tasks.map((t) => {
            const done = t.completedAt != null;
            return (
              <li key={t.id} className="flex items-center justify-between gap-4 px-5 py-3">
                <div className="min-w-0">
                  <Link
                    href={`/tasks/${t.id}/edit`}
                    className={
                      done
                        ? "truncate text-sm text-muted line-through hover:text-foreground"
                        : "truncate text-sm font-medium hover:text-accent-text"
                    }
                  >
                    {t.title}
                  </Link>
                  <div className="truncate text-xs text-muted">
                    {[t.status, t.assigneeName, t.dueDate ? `due ${formatDate(t.dueDate)}` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
                {t.priority && <Badge variant={priorityVariant(t.priority)}>{t.priority}</Badge>}
              </li>
            );
          })}
        </ul>
      )}

      {canWrite && (
        <form
          ref={formRef}
          action={async (fd) => {
            await quickAddSponsorTask(sponsorId, fd);
            formRef.current?.reset();
          }}
          className="flex items-center gap-2 border-t border-border px-5 py-3"
        >
          <TextInput name="title" placeholder="Add a task for this sponsor…" />
          <button className={buttonGhost} type="submit">
            Add
          </button>
        </form>
      )}
    </SectionCard>
  );
}
