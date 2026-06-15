"use client";

import { useState } from "react";

import { Modal } from "@/components/modal";
import { buttonPrimary } from "@/components/ui";
import type { Option } from "@/lib/workspace-queries";

import { createProject } from "./actions";
import { ProjectForm } from "./project-form";

export function NewProjectButton({
  people,
  events,
}: {
  people: Option[];
  events: Option[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={buttonPrimary} onClick={() => setOpen(true)}>
        New project
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="New project">
        <ProjectForm
          action={createProject}
          people={people}
          events={events}
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}
