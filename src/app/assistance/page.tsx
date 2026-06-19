import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getPortalUser } from "@/lib/portal-dal";
import { AssistanceForm } from "./assistance-form";

export const metadata: Metadata = { title: "Get help" };

export default async function AssistancePage() {
  // Login-required (proxy), but ANY membership status may reach this — it's the
  // escape hatch for members whose verification didn't work.
  const user = await getPortalUser();
  if (!user) redirect("/login");

  return (
    <section className="mx-auto max-w-lg px-4 py-12 sm:py-16">
      <p className="eyebrow">Member support</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-3d-pink">Ask a developer for help</h1>
      <p className="mt-3 text-sm text-paper/75">
        Signed in with the wrong email, membership not showing up, or something else not working? Send us
        the details and a DSEC developer will sort it out manually. You&apos;re signed in as{" "}
        <span className="font-mono text-sky">{user.account.email}</span>.
      </p>

      <div className="mt-6">
        <AssistanceForm email={user.account.email} />
      </div>

      <p className="mt-6 text-center font-mono text-xs text-paper/55">
        {user.access === "locked" ? (
          <Link href="/locked" className="hover:text-paper hover:underline">← Back</Link>
        ) : (
          <Link href="/dashboard" className="hover:text-paper hover:underline">← Back to dashboard</Link>
        )}
      </p>
    </section>
  );
}
