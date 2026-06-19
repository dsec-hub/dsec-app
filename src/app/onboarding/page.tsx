import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PixelDuck } from "@/components/pixel-duck";
import { getPortalUser } from "@/lib/portal-dal";
import { OnboardingWizard } from "./onboarding-wizard";

export const metadata: Metadata = { title: "Set up your card" };

/**
 * Forced first-run onboarding. The proxy guarantees a session; here we apply the
 * same membership gate as the app shell and then REQUIRE a verification photo:
 *   - no account  → /login
 *   - locked       → /locked
 *   - already has a photo → /dashboard (nothing to do)
 *   - otherwise    → the wizard (must upload a face photo to proceed)
 */
export default async function OnboardingPage() {
  const user = await getPortalUser();
  if (!user) redirect("/login");
  if (user.access === "locked") redirect("/locked");
  if (user.account.photoUrl) redirect("/dashboard");

  const firstName = (user.account.name ?? user.account.email ?? "there").split(/[ @]/)[0];

  return (
    <section className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-col items-center text-center">
        <PixelDuck name="duck-wave" alt="A pixel-art duck waving hello" size={96} priority bob />
        <p className="eyebrow mt-4">Welcome to DSEC</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-3d-pink sm:text-4xl">
          Let&apos;s set up your card, {firstName}
        </h1>
        <p className="mt-3 max-w-lg text-sm text-paper/75">
          One quick thing before you&apos;re in: add a photo for your digital membership card so we can
          verify you at events. Takes about ten seconds.
        </p>
      </div>

      <div className="mt-8">
        <OnboardingWizard
          initialName={user.account.name ?? ""}
          initialPhotoUrl={user.account.photoUrl ?? null}
        />
      </div>
    </section>
  );
}
