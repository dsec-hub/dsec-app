"use client";

import { useActionState } from "react";

import { authenticate } from "./actions";

export function SignInForm() {
  const [errorMessage, formAction, pending] = useActionState(
    authenticate,
    undefined,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-muted">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-muted">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
        />
      </label>

      {errorMessage && (
        <p className="text-sm text-danger" role="alert">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
