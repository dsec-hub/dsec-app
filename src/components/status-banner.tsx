import Link from "next/link";

import type { AccessReason } from "@/lib/membership";

/**
 * The "you're still being verified" / "your membership lapsed" banner shown
 * above the dashboard for trial-bucket members. Locked members never see this —
 * they're redirected to /locked.
 */
export function StatusBanner({
  reason,
  daysLeft,
}: {
  reason: AccessReason;
  daysLeft: number;
}) {
  const lapsed = reason === "lapsed_grace";

  const headline = lapsed
    ? "We couldn't confirm your membership on the latest roster"
    : "We're verifying your DSEC membership";

  const body = lapsed
    ? "Your access continues for now. If you've renewed, the next Friday DUSA update will pick it up — otherwise renew on DUSA, or let us know if something's off."
    : reason === "awaiting_import"
      ? "You have full access while we wait for this Friday's DUSA membership update. We check automatically each week."
      : `You have full access during your trial${
          daysLeft > 0 ? ` (about ${daysLeft} day${daysLeft === 1 ? "" : "s"} left)` : ""
        }. We confirm your membership after each Friday's DUSA update.`;

  return (
    <div
      className="mb-8 flex flex-col gap-3 border-[3px] border-yellow bg-panel-2 p-4 sm:flex-row sm:items-center sm:justify-between"
      role="status"
    >
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="mt-0.5 text-xl">
          {lapsed ? "⚠️" : "⏳"}
        </span>
        <div>
          <p className="font-display text-sm font-bold text-yellow">{headline}</p>
          <p className="mt-1 text-sm text-paper/80">{body}</p>
          <p className="mt-1.5 font-mono text-xs text-paper/55">
            Signed in with the wrong email, or think this is a mistake?{" "}
            <Link href="/assistance" className="font-bold text-sky hover:underline">
              Get help →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
