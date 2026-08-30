"use client";

import { useEffect } from "react";

import { signOutAction } from "@/app/actions";

/**
 * error.tsx catches errors in the segment BELOW it, not in its own layout — so
 * the members-only group needs its own boundary as well as the root one. This
 * one carries a sign-out link so a member whose dashboard is broken (e.g. a Neon
 * cold-start blip in the layout's queries) can still get out.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Once OPS-01 lands, report to Sentry here instead.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <p className="eyebrow">Portal error</p>
      <h1 className="mt-2 font-display text-2xl font-bold text-3d-pink">We couldn&apos;t load your portal</h1>
      <p className="mt-3 text-paper/75">This is usually temporary. Try again in a moment.</p>
      <button type="button" onClick={reset} className="btn btn-pink mt-6">Try again</button>
      {error.digest ? (
        <p className="mt-4 font-mono text-[11px] text-paper/45">Reference: {error.digest}</p>
      ) : null}
      {/* Real sign-out (same server action as the header), so a member stuck on a
          broken portal can always get out. */}
      <form action={signOutAction} className="mt-6">
        <button type="submit" className="text-sm underline underline-offset-2 hover:text-paper">
          Sign out
        </button>
      </form>
    </div>
  );
}
