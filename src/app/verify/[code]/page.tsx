import type { Metadata } from "next";

import { verifyMemberCode } from "@/lib/api";
import { getVerificationPhotoByMemberId } from "@/lib/portal-dal";

export const metadata: Metadata = { title: "Verify membership" };

function fmtSince(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-AU", { month: "short", year: "numeric" });
}

/**
 * PUBLIC membership-verification result. Door / event staff land here after
 * scanning a member's card QR (or opening the code's link). It confirms — at a
 * glance — that the holder is a current DSEC member, showing their FACE PHOTO
 * and name so staff can match the card to the person in front of them.
 *
 * Capability-gated: only someone shown the code can resolve it. We never expose
 * email or student id here (see the API's PublicVerifyResult).
 */
export default async function VerifyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const result = await verifyMemberCode(code);

  const unreachable = result === null;
  const valid = !!result?.valid;
  const photoUrl = valid && result?.memberId ? await getVerificationPhotoByMemberId(result.memberId) : null;
  const since = fmtSince(result?.memberSince ?? null);
  const displayCode = code.toUpperCase();

  return (
    <section className="mx-auto flex max-w-md flex-col items-center px-4 py-12 text-center sm:py-16">
      <p className="eyebrow">DSEC // Membership check</p>

      {valid ? (
        <>
          <h1 className="mt-2 font-display text-3xl font-bold text-mint">✓ Verified member</h1>
          <div className="pixel-card-lg mt-6 w-full p-6">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- remote Supabase URL; portal renders these as plain <img> (see next.config).
              <img
                src={photoUrl}
                alt={`${result?.fullName ?? "Member"}'s verification photo`}
                width={160}
                height={160}
                className="mx-auto block border-[3px] border-paper object-cover"
                style={{ width: 160, height: 160 }}
              />
            ) : (
              <div className="mx-auto flex h-[120px] w-[120px] items-center justify-center border-[3px] border-paper bg-panel-2 font-display text-3xl font-bold text-paper/60">
                {(result?.fullName?.trim()[0] ?? "?").toUpperCase()}
              </div>
            )}

            <h2 className="mt-5 font-display text-2xl font-bold text-3d-pink">
              {result?.fullName ?? "DSEC member"}
            </h2>
            <p className="mt-2 font-display text-sm font-bold text-mint">Current DSEC member</p>
            <p className="mt-1 font-mono text-xs text-paper/60">
              {result?.membershipType ? `${result.membershipType} · ` : ""}
              {since ? `Member since ${since}` : "Verified via DUSA"}
            </p>
            <p className="mt-4 font-mono text-[11px] tracking-[0.18em] text-paper/45">{displayCode}</p>
          </div>
          <p className="mt-5 text-sm text-paper/70">
            Check the photo matches the person showing the card.
          </p>
        </>
      ) : (
        <>
          <h1 className="mt-2 font-display text-3xl font-bold text-coral">
            {unreachable ? "Couldn't check right now" : "Not a valid member code"}
          </h1>
          <div className="pixel-card mt-6 w-full p-6 text-left">
            {unreachable ? (
              <p className="text-sm text-paper/80">
                We couldn&apos;t reach the membership service to check{" "}
                <span className="font-mono text-sky">{displayCode}</span>. Try again in a moment.
              </p>
            ) : (
              <>
                <p className="text-sm text-paper/80">
                  <span className="font-mono text-sky">{displayCode}</span> doesn&apos;t match a current DSEC
                  member.
                </p>
                <ul className="mt-4 flex flex-col gap-2 text-sm text-paper/75">
                  <li>• The code may have been typed or scanned incorrectly.</li>
                  <li>• The membership may have expired or not been renewed.</li>
                  <li>• Ask them to reopen their card in the DSEC member portal.</li>
                </ul>
              </>
            )}
          </div>
        </>
      )}
    </section>
  );
}
