"use client";

import { useState } from "react";

import { Modal } from "@/components/modal";
import { buttonPrimary } from "@/components/ui";

import { createEvent } from "./actions";
import { EventForm } from "./event-form";

export function NewEventButton({
  people,
  sponsors,
  committees,
}: {
  people: { id: number; name: string }[];
  sponsors: { id: number; name: string }[];
  committees: { id: number; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={buttonPrimary} onClick={() => setOpen(true)}>
        New event
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="New event">
        <EventForm
          action={createEvent}
          people={people}
          sponsors={sponsors}
          committees={committees}
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}
