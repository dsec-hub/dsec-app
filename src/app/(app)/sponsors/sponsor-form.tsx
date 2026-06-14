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
import { SPONSOR_STAGES, SPONSOR_TIERS } from "@/lib/options";
import type { FormState } from "./actions";
import type { SponsorRow } from "@/lib/queries";

type Action = (prev: FormState, fd: FormData) => Promise<FormState>;

export function SponsorForm({
  action,
  people,
  sponsor,
}: {
  action: Action;
  people: { id: number; name: string }[];
  sponsor?: SponsorRow;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const s = sponsor;

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      <FormError>{state?.error}</FormError>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Organisation">
          <TextInput name="organisation" required defaultValue={s?.organisation ?? ""} />
        </Field>
        <Field label="Stage">
          <SelectField name="stage" defaultValue={s?.stage ?? "Prospect"}>
            {SPONSOR_STAGES.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </SelectField>
        </Field>
        <Field label="Tier">
          <SelectField name="tier" defaultValue={s?.tier ?? ""}>
            <option value="">—</option>
            {SPONSOR_TIERS.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </SelectField>
        </Field>
        <Field label="Value (AUD)">
          <TextInput
            type="number"
            step="0.01"
            name="value_aud"
            defaultValue={s?.valueAud ?? ""}
          />
        </Field>
        <Field label="Contact">
          <SelectField
            name="contact_person_id"
            defaultValue={s?.contactPersonId ? String(s.contactPersonId) : ""}
          >
            <option value="">—</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </SelectField>
        </Field>
      </div>

      <CheckboxField
        label="DUSA approved"
        name="dusa_approved"
        defaultChecked={s?.dusaApproved ?? false}
      />

      <Field label="Notes">
        <TextArea name="notes" defaultValue={s?.notes ?? ""} />
      </Field>

      <div className="flex items-center gap-3">
        <SubmitButton>{sponsor ? "Save changes" : "Add sponsor"}</SubmitButton>
        <Link href="/sponsors" className={buttonSecondary}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
