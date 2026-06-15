"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { CommitteeSelect } from "@/components/committee-select";
import { Field, FormError, SelectField, TextArea, TextInput } from "@/components/form";
import { SubmitButton } from "@/components/submit-button";
import { buttonSecondary } from "@/components/ui";
import { PERSON_STATUSES, PERSON_TYPES } from "@/lib/options";
import { useUndoToast } from "@/lib/use-undo-toast";
import type { FormState } from "./actions";
import type { PersonRow } from "@/lib/queries";

type Action = (prev: FormState, fd: FormData) => Promise<FormState>;

export function PersonForm({
  action,
  person,
  committees,
  canWrite = true,
  onSuccess,
  onCancel,
  redirectOnSuccess,
}: {
  action: Action;
  person?: PersonRow;
  committees: { id: number; name: string }[];
  canWrite?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
  redirectOnSuccess?: string;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(action, undefined);
  useUndoToast(state);
  const p = person;

  useEffect(() => {
    if (!state?.ok) return;
    if (onSuccess) onSuccess();
    else if (redirectOnSuccess) router.push(redirectOnSuccess);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      <fieldset disabled={!canWrite} className="space-y-6">
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
            <CommitteeSelect committees={committees} defaultValue={p?.committee} />
          </Field>
          <Field label="Role title">
            <TextInput
              name="role_title"
              defaultValue={p?.roleTitle ?? ""}
              placeholder="e.g. Events Lead"
            />
          </Field>
          <Field label="Student ID">
            <TextInput
              name="student_id"
              defaultValue={p?.studentId ?? ""}
              placeholder="Links DUSA membership"
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Website / portfolio">
            <TextInput name="website" defaultValue={p?.website ?? ""} placeholder="https://…" />
          </Field>
          <Field label="Discord">
            <TextInput name="discord" defaultValue={p?.discord ?? ""} placeholder="username" />
          </Field>
          <Field label="Instagram">
            <TextInput name="instagram" defaultValue={p?.instagram ?? ""} placeholder="@handle" />
          </Field>
          <Field label="GitHub">
            <TextInput name="github" defaultValue={p?.github ?? ""} placeholder="username" />
          </Field>
          <Field label="LinkedIn">
            <TextInput name="linkedin" defaultValue={p?.linkedin ?? ""} placeholder="profile URL" />
          </Field>
        </div>

        <Field label="Notes">
          <TextArea name="notes" defaultValue={p?.notes ?? ""} />
        </Field>
      </fieldset>

      <div className="flex items-center gap-3">
        {canWrite ? (
          <SubmitButton>{person ? "Save changes" : "Add person"}</SubmitButton>
        ) : (
          <p className="text-sm text-muted">View only — you don’t have edit access for this section.</p>
        )}
        {onCancel ? (
          <button type="button" onClick={onCancel} className={buttonSecondary}>
            Cancel
          </button>
        ) : (
          <Link href="/people" className={buttonSecondary}>
            Cancel
          </Link>
        )}
      </div>
    </form>
  );
}
