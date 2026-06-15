"use client";

import { useState } from "react";

import { Modal } from "@/components/modal";
import { buttonPrimary } from "@/components/ui";

import { createPerson } from "./actions";
import { PersonForm } from "./person-form";

export function NewPersonButton({
  committees,
}: {
  committees: { id: number; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={buttonPrimary} onClick={() => setOpen(true)}>
        New person
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="New person">
        <PersonForm
          action={createPerson}
          committees={committees}
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}
