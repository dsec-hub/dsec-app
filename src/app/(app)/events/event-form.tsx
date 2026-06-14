"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  CheckboxField,
  Field,
  FormError,
  SelectField,
  TextArea,
  TextInput,
} from "@/components/form";
import { SubmitButton } from "@/components/submit-button";
import { buttonSecondary } from "@/components/ui";
import {
  COMMITTEES,
  DUSA_STATUSES,
  EVENT_FORMATS,
  EVENT_STATUSES,
  EVENT_TYPES,
} from "@/lib/options";
import type { FormState } from "./actions";
import type { EventRow } from "@/lib/queries";

type Action = (prev: FormState, fd: FormData) => Promise<FormState>;

export function EventForm({
  action,
  people,
  event,
}: {
  action: Action;
  people: { id: number; name: string }[];
  event?: EventRow;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const e = event;

  return (
    <form action={formAction} className="max-w-3xl space-y-6">
      <FormError>{state?.error}</FormError>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name">
          <TextInput name="name" required defaultValue={e?.name ?? ""} />
        </Field>
        <Field label="Type">
          <SelectField name="type" defaultValue={e?.type ?? ""}>
            <option value="">—</option>
            {EVENT_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </SelectField>
        </Field>
        <Field label="Status">
          <SelectField name="status" defaultValue={e?.status ?? "Idea"}>
            {EVENT_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </SelectField>
        </Field>
        <Field label="Committee">
          <SelectField name="committee" defaultValue={e?.committee ?? ""}>
            <option value="">—</option>
            {COMMITTEES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </SelectField>
        </Field>
        <Field label="Start date">
          <TextInput type="date" name="start_date" defaultValue={e?.startDate ?? ""} />
        </Field>
        <Field label="End date">
          <TextInput type="date" name="end_date" defaultValue={e?.endDate ?? ""} />
        </Field>
        <Field label="Event lead">
          <SelectField
            name="event_lead_id"
            defaultValue={e?.eventLeadId ? String(e.eventLeadId) : ""}
          >
            <option value="">—</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </SelectField>
        </Field>
        <Field label="Format">
          <SelectField name="format" defaultValue={e?.format ?? ""}>
            <option value="">—</option>
            {EVENT_FORMATS.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </SelectField>
        </Field>
        <Field label="Venue">
          <TextInput name="venue" defaultValue={e?.venue ?? ""} />
        </Field>
        <Field label="Trimester">
          <TextInput
            name="trimester"
            defaultValue={e?.trimester ?? ""}
            placeholder="e.g. T2 2026"
          />
        </Field>
        <Field label="Expected attendance">
          <TextInput
            type="number"
            name="expected_attendance"
            defaultValue={e?.expectedAttendance ?? ""}
          />
        </Field>
        <Field label="Actual attendance">
          <TextInput
            type="number"
            name="actual_attendance"
            defaultValue={e?.actualAttendance ?? ""}
          />
        </Field>
      </div>

      <fieldset className="rounded-xl border border-border p-4">
        <legend className="px-1 text-xs text-muted">DUSA</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Submission status">
            <SelectField
              name="dusa_submission_status"
              defaultValue={e?.dusaSubmissionStatus ?? "Not Started"}
            >
              {DUSA_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </SelectField>
          </Field>
          <Field label="Deadline">
            <TextInput type="date" name="dusa_deadline" defaultValue={e?.dusaDeadline ?? ""} />
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap gap-5">
          <CheckboxField
            label="DUSA required"
            name="dusa_required"
            defaultChecked={e?.dusaRequired ?? false}
          />
          <CheckboxField
            label="Food provided"
            name="food_provided"
            defaultChecked={e?.foodProvided ?? false}
          />
          <CheckboxField
            label="External guests"
            name="external_guests"
            defaultChecked={e?.externalGuests ?? false}
          />
        </div>
      </fieldset>

      <Field label="Notes">
        <TextArea name="notes" defaultValue={e?.notes ?? ""} />
      </Field>

      <div className="flex items-center gap-3">
        <SubmitButton>{event ? "Save changes" : "Create event"}</SubmitButton>
        <Link href="/events" className={buttonSecondary}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
