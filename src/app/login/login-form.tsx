"use client";

import { useActionState, useEffect, useRef } from "react";

import { OtpInput } from "@/components/otp-input";
import { useAnnounce } from "@/components/live-region";
import { loginAction, type LoginState } from "./actions";

export function LoginForm({ callbackUrl }: { callbackUrl?: string | null }) {
  const [state, formAction, pending] = useActionState<LoginState | undefined, FormData>(
    loginAction,
    undefined,
  );
  const step = state?.step ?? "email";

  // Announce step changes on the parallel screen-reader channel; the visible
  // paragraphs stay untouched for sighted users. Track "first becomes code" so a
  // verify-error re-render (still on the code step) doesn't re-announce the hint.
  const announce = useAnnounce();
  const prevStepRef = useRef<"email" | "code">("email");
  useEffect(() => {
    if (state?.step !== "code") {
      prevStepRef.current = state?.step ?? "email";
      return;
    }
    if (state.resent) {
      announce("A new code is on its way.");
    } else if (prevStepRef.current !== "code") {
      announce(`We emailed a 6-digit code to ${state.email}.`);
    }
    prevStepRef.current = "code";
  }, [state, announce]);

  if (step === "code") {
    const email = state && state.step === "code" ? state.email : "";
    return (
      <form key="code" action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="email" value={email} />
        {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}
        <div>
          <p id="otp-hint" className="text-sm text-paper/80">
            Enter the 6-digit code we emailed to{" "}
            <span className="font-mono text-sky">{email}</span>.
          </p>
          {state && state.step === "code" && state.resent && (
            <p className="mt-1 font-mono text-xs text-mint">A new code is on its way.</p>
          )}
        </div>

        <OtpInput name="code" disabled={pending} describedBy="otp-hint" />

        {state?.error && (
          <p className="font-mono text-sm text-coral" role="alert">{state.error}</p>
        )}

        <button type="submit" name="intent" value="verify" disabled={pending} className="btn btn-pink disabled:opacity-60">
          {pending ? "Verifying…" : "Verify & sign in"}
        </button>

        <div className="flex items-center justify-between font-mono text-xs text-paper/55">
          <button type="submit" name="intent" value="resend" formNoValidate disabled={pending} className="hover:text-paper hover:underline">
            Resend code
          </button>
          <button type="submit" name="intent" value="restart" formNoValidate disabled={pending} className="hover:text-paper hover:underline">
            Use a different email
          </button>
        </div>
      </form>
    );
  }

  return (
    <form key="email" action={formAction} className="flex flex-col gap-4">
      {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}
      <label className="flex flex-col gap-1.5">
        <span className="font-mono text-xs uppercase tracking-wide text-paper/60">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="pixel-input"
        />
      </label>

      {state?.error && (
        <p className="font-mono text-sm text-coral" role="alert">{state.error}</p>
      )}

      <button type="submit" name="intent" value="request" disabled={pending} className="btn btn-pink disabled:opacity-60">
        {pending ? "Sending…" : "Email me a sign-in code"}
      </button>
    </form>
  );
}
