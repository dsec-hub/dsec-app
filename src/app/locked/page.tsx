import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PixelDuck } from "@/components/pixel-duck";
import { signOutAction } from "@/app/actions";
import { site } from "@/lib/content";
import { getPortalUser } from "@/lib/portal-dal";

export const metadata: Metadata = { title: "Membership not verified" };

export default async function LockedPage() {
  const user = await getPortalUser();
  if (!user) redirect("/login");
  // Active members shouldn't sit on the locked screen.
  if (user.access !== "locked") redirect("/dashboard");

  const rejected = user.reason === "manual_rejected";
  const lapsed = user.reason === "lapsed";

  const headline = rejected
    ? "Your access was declined"
    : lapsed
      ? "Your DSEC membership has lapsed"
      : "We couldn't verify your DSEC membership";

  return (
    <section className="mx-auto flex max-w-lg flex-col items-center px-4 py-12 text-center sm:py-16">
      <PixelDuck name="duck-coffee" alt="A pixel-art duck taking a coffee break" size={120} priority />
      <p className="eyebrow mt-5">Members only</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-3d-pink">{headline}</h1>

      <div className="pixel-card mt-6 w-full p-6 text-left">
        <p className="text-sm text-paper/80">
          We looked for a current DSEC membership matching{" "}
          <span className="font-mono text-sky">{user.account.email}</span> and couldn&apos;t find one.
        </p>

        {rejected ? (
          <p className="mt-3 text-sm text-paper/80">
            A DSEC organiser reviewed your account and didn&apos;t approve access. If you think that&apos;s a
            mistake, reach out and we&apos;ll take another look.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2 text-sm text-paper/75">
            <li>• You signed in with a <strong>different email</strong> than the one on your DUSA membership.</li>
            <li>• Your membership has <strong>expired</strong> and needs renewing on DUSA.</li>
            <li>• You haven&apos;t bought a DSEC membership <strong>yet</strong>.</li>
          </ul>
        )}
      </div>

      <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/assistance" className="btn btn-pink">Request help from a developer</Link>
        {!rejected && (
          <a href={site.dusa} target="_blank" rel="noreferrer noopener" className="btn btn-ghost">
            Get / renew on DUSA ↗
          </a>
        )}
      </div>

      <form action={signOutAction} className="mt-5">
        <button type="submit" className="font-mono text-xs text-paper/55 underline-offset-2 hover:text-paper hover:underline">
          Used a different email? Sign in with another account →
        </button>
      </form>
    </section>
  );
}
