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
import { FINANCE_STATUSES, FINANCE_TYPES } from "@/lib/options";
import type { FormState } from "./actions";
import type { FinanceRow } from "@/lib/queries";

type Action = (prev: FormState, fd: FormData) => Promise<FormState>;

export function FinanceForm({
  action,
  events,
  entry,
}: {
  action: Action;
  events: { id: number; name: string }[];
  entry?: FinanceRow;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const f = entry;

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      <FormError>{state?.error}</FormError>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Item">
          <TextInput name="item" required defaultValue={f?.item ?? ""} />
        </Field>
        <Field label="Type">
          <SelectField name="type" defaultValue={f?.type ?? "Other Expense"}>
            {FINANCE_TYPES.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </SelectField>
        </Field>
        <Field label="Amount (AUD)">
          <TextInput
            type="number"
            step="0.01"
            name="amount_aud"
            defaultValue={f?.amountAud ?? ""}
          />
        </Field>
        <Field label="Status">
          <SelectField name="status" defaultValue={f?.status ?? "Requested"}>
            {FINANCE_STATUSES.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </SelectField>
        </Field>
        <Field label="Date requested">
          <TextInput type="date" name="date_requested" defaultValue={f?.dateRequested ?? ""} />
        </Field>
        <Field label="Date paid">
          <TextInput type="date" name="date_paid" defaultValue={f?.datePaid ?? ""} />
        </Field>
        <Field label="Related event">
          <SelectField
            name="related_event_id"
            defaultValue={f?.relatedEventId ? String(f.relatedEventId) : ""}
          >
            <option value="">—</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </SelectField>
        </Field>
      </div>

      <CheckboxField
        label="GST included"
        name="gst_included"
        defaultChecked={f?.gstIncluded ?? false}
      />

      <Field label="Notes">
        <TextArea name="notes" defaultValue={f?.notes ?? ""} />
      </Field>

      <div className="flex items-center gap-3">
        <SubmitButton>{entry ? "Save changes" : "Add item"}</SubmitButton>
        <Link href="/finance" className={buttonSecondary}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
