"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Field, FormError, SelectField, TextArea, TextInput } from "@/components/form";
import { SubmitButton } from "@/components/submit-button";
import { buttonSecondary } from "@/components/ui";
import { COMMITTEES, PERSON_STATUSES, PERSON_TYPES } from "@/lib/options";
import type { FormState } from "./actions";
import type { PersonRow } from "@/lib/queries";

type Action = (prev: FormState, fd: FormData) => Promise<FormState>;

export function PersonForm({
  action,
  person,
}: {
  action: Action;
  person?: PersonRow;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const p = person;

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      <FormError>{state?.error}</FormError>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name">
          <TextInput name="name" required defaultValue={p?.name ?? ""} />
        </Field>
        <Field label="Email">
          <TextInput type="email" name="email" defaultValue={p?.email ?? ""} />
        </Field>
        <Field label="Type">
          <SelectField name="type" defaultValue={p?.type ?? "Committee Member"}>
            {PERSON_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </SelectField>
        </Field>
        <Field label="Status">
          <SelectField name="status" defaultValue={p?.status ?? "Active"}>
            {PERSON_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </SelectField>
        </Field>
        <Field label="Committee">
          <SelectField name="committee" defaultValue={p?.committee ?? ""}>
            <option value="">—</option>
            {COMMITTEES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </SelectField>
        </Field>
        <Field label="Role title">
          <TextInput
            name="role_title"
            defaultValue={p?.roleTitle ?? ""}
            placeholder="e.g. Events Lead"
          />
        </Field>
      </div>

      <Field label="Notes">
        <TextArea name="notes" defaultValue={p?.notes ?? ""} />
      </Field>

      <div className="flex items-center gap-3">
        <SubmitButton>{person ? "Save changes" : "Add person"}</SubmitButton>
        <Link href="/people" className={buttonSecondary}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
