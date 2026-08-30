import type { Metadata } from "next";
import Link from "next/link";

import { FeatureTile } from "@/components/feature-tile";
import { VerificationCard } from "@/components/verification-card";
import { getMemberVerification, getUpcomingEvents } from "@/lib/api";
import { site } from "@/lib/content";
import { getPortalUser } from "@/lib/portal-dal";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  // Cached within the request — shares the layout's single DB round-trip.
  const user = await getPortalUser();
  const events = await getUpcomingEvents(1);

  const firstName = (user?.account.name ?? user?.account.email ?? "there").split(/[ @]/)[0];
  const verified = user?.access === "verified";
  const member = user?.member ?? null;
  const nextEvent = events && events.length > 0 ? events[0] : null;

  // The membership card. Codes/QR are minted by dsec-api and keyed to the roster
  // row id (portal_account.member_id), so a code can only be fetched when the
  // account is verified AND linked to a roster row. A manually-approved account is
  // verified with member_id still NULL — the committee approved it but never linked
  // it to a DUSA roster record — so there is nothing to fetch and no card can be
  // issued until a committee member makes the link. That is the "needs-link" state
  // below, kept distinct from a linked account whose code merely failed to load
  // because the API was unreachable: both leave `code` null, but they are different
  // situations and must not show the same message.
  const memberId = member?.id ?? user?.account.memberId ?? null;
  const verification = verified && memberId ? await getMemberVerification(memberId) : null;
  const cardName =
    user?.account.name?.trim() || member?.fullName?.trim() || verification?.fullName?.trim() || firstName;

  // dsec-api mints a code for any member id, but /members/verify/{code} only
  // resolves CURRENT members — so a code for a not-current member scans as
  // invalid at the door. Don't show a card we know will be rejected; the card
  // shows a "record needs updating" message instead (NEW-APPDEEP-02).
  const cardCode = verification?.isCurrent ? verification.code : null;
  const cardQr = verification?.isCurrent ? verification.qrSvg : null;

  // Explicit card state — computed here, where memberId is known, rather than
  // inferred from `code === null` in the card (which is ambiguous: not-linked vs
  // API-unreachable). "ready" = verified and linked, a code is expected (the card
  // resolves the code/not-current/loading sub-states from `code`/`isCurrent`);
  // "needs-link" = verified but no roster link yet; "pending" = still being verified.
  const cardState: "ready" | "needs-link" | "pending" = !verified
    ? "pending"
    : memberId == null
      ? "needs-link"
      : "ready";

  return (
    <>
      <p className="eyebrow">Welcome back</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-3d-pink sm:text-4xl">Hey, {firstName} 👋</h1>
      <p className="mt-3 max-w-xl text-paper/75">
        Your DSEC member hub. More perks unlock here soon — open-source projects, member tools, and the
        members&apos; Discord.
      </p>

      {/* Membership card — the one fully-live tile. Tap to full-screen at the door. */}
      <section className="mt-8">
        <VerificationCard
          name={cardName}
          photoUrl={user?.account.photoUrl ?? null}
          status={verified ? "verified" : "trial"}
          cardState={cardState}
          membershipType={verification?.membershipType ?? member?.membershipType ?? null}
          memberSince={verification?.memberSince ?? member?.firstSubscriptionDate ?? null}
          code={cardCode}
          qrSvg={cardQr}
          isCurrent={verification?.isCurrent ?? true}
        />
        {!verified && (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-paper/70">
              Full access during your trial — we confirm after each Friday&apos;s DUSA update.{" "}
              <Link href="/assistance" className="font-bold text-sky underline-offset-2 hover:underline">
                Membership help
              </Link>
            </p>
            {/* Not a confirmed member yet (trial / no DUSA membership) — the Join CTA
                lives here now instead of the navbar, where it nudges conversion. */}
            <a href={`${site.website}/join`} className="btn btn-pink shrink-0 !py-2.5 !text-sm">
              Join DSEC
            </a>
          </div>
        )}
      </section>

      {/* Feature grid — mostly locked for now. */}
      <section className="mt-8">
        <p className="eyebrow">Member perks</p>
        <h2 className="mt-2 font-display text-2xl font-bold">What&apos;s in the club</h2>
        <div className="stagger mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Events — live-ish (links to the public calendar; shows the next event). */}
          <FeatureTile
            title="Events"
            duck="duck-rocket"
            blurb={nextEvent ? `Next up: ${nextEvent.title}` : "RSVP to what's on, synced from the club calendar."}
            href={`${site.website}/events`}
            external
            badge="Open"
          />

          {/* Games — TEMPORARILY LOCKED. To re-enable, restore the live tile below:
          <FeatureTile
            title="Games"
            duck="duck-trophy"
            blurb="Play Flappy Duck and Codle, climb the leaderboard, win the monthly skill draw."
            href={site.games}
            external
            badge="Play"
          /> */}
          <FeatureTile
            title="Games"
            duck="duck-trophy"
            blurb="Play Flappy Duck and Codle, climb the leaderboard, win the monthly skill draw."
            locked
            badge="Soon"
          />

          <FeatureTile
            title="Open-Source Projects"
            duck="duck-laptop"
            blurb="Browse and contribute to the projects DSEC builds and maintains — find a team and ship."
            locked
          />
          <FeatureTile
            title="Member Tools"
            duck="duck-iso"
            blurb="Free access to the tools the club develops — internal apps, templates, and credits."
            locked
          />
          <FeatureTile
            title="Members' Discord"
            duck="duck-mail"
            blurb="Get your invite to the members-only Discord — channels, events, and help."
            locked
          />
          <FeatureTile
            title="Your Profile"
            duck="duck-mascot"
            blurb="Headshot, bio, and links — the same profile that powers the public team page."
            locked
          />
        </div>
      </section>
    </>
  );
}
