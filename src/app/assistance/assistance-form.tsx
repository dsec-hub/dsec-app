"use client";

import { useActionState } from "react";

import { submitAssistance, type AssistanceState } from "./actions";

export function AssistanceForm({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState<AssistanceState, FormData>(
    submitAssistance,
    undefined,
  );

  if (state && "ok" in state && state.ok) {
    return (
      <div className="pixel-card p-6" role="status">
        <p className="font-display text-lg font-bold text-mint">✓ Request sent</p>
        <p className="mt-2 text-sm text-paper/80">
          Thanks — a DSEC developer will take a look and sort out your access. We&apos;ll be in touch by email.
          You can close this tab.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="pixel-card flex flex-col gap-4 p-6">
      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-xs uppercase tracking-wide text-paper/60">What do you need help with?</span>
        <select name="category" className="pixel-input" defaultValue="verification">
          <option value="verification">My membership isn&apos;t being recognised</option>
          <option value="access">I can&apos;t access something</option>
          <option value="bug">Something&apos;s broken</option>
          <option value="other">Other</option>
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-xs uppercase tracking-wide text-paper/60">
          Email you used on DUSA <span className="text-paper/40">(if different from {email})</span>
        </span>
        <input name="contact_email" type="email" placeholder="the-email-on-your-membership@example.com" className="pixel-input" autoComplete="email" />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-xs uppercase tracking-wide text-paper/60">
          Deakin student ID <span className="text-paper/40">(optional, helps us find you)</span>
        </span>
        <input name="student_id" inputMode="numeric" placeholder="e.g. 2200xxxxx" className="pixel-input" />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-xs uppercase tracking-wide text-paper/60">Message</span>
        <textarea
          name="message"
          required
          minLength={10}
          maxLength={4000}
          rows={5}
          placeholder="Tell us what happened — e.g. 'I joined DSEC on DUSA with my personal Gmail but signed in here with my Deakin email.'"
          className="pixel-input resize-y"
        />
      </label>

      {state && "error" in state && (
        <p className="font-mono text-sm text-coral" role="alert">{state.error}</p>
      )}

      <button type="submit" disabled={pending} className="btn btn-pink disabled:opacity-60">
        {pending ? "Sending…" : "Send request"}
      </button>
    </form>
  );
}
