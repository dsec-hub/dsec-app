"use client";

import { useEffect } from "react";

export default function Error({
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
      <p className="eyebrow">Something broke</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-3d-pink">Something went wrong</h1>
      <p className="mt-3 text-paper/75">
        That&apos;s on us, not you. Try again — if it keeps happening, let the
        committee know.
      </p>
      <button type="button" onClick={reset} className="btn btn-pink mt-6">
        Try again
      </button>
      {error.digest ? (
        <p className="mt-6 font-mono text-[11px] text-paper/45">Reference: {error.digest}</p>
      ) : null}
    </div>
  );
}
