/**
 * The membership state machine — PURE, no I/O, so it's trivially testable and
 * has one obvious source of truth.
 *
 * Background: a student buys DSEC membership through DUSA; every Friday DUSA
 * emails a roster that dsec-api ingests into `members` (flipping `is_current`).
 * So the roster IS the live paid list, but it only updates weekly. A brand-new
 * signup therefore can't be verified until the next Friday import — hence the
 * trial. OAuth guarantees the login email is really theirs, so an email match
 * against the current roster is a trustworthy "paid member" signal.
 *
 * `resolveAccess` decides, for one account at one instant, which bucket it's in:
 *   - "verified" — confirmed paid member (roster match or committee approval)
 *   - "trial"    — full access, still being verified (or in post-lapse grace)
 *   - "locked"   — no dashboard access (trial expired unmatched, lapsed, rejected)
 */

export type Access = "verified" | "trial" | "locked";

export type AccessReason =
  | "manual_approved" // committee approved → verified
  | "manual_rejected" // committee rejected → locked
  | "roster_match" // found on the current DUSA roster → verified
  | "trial" // within the 7-day trial window
  | "awaiting_import" // trial elapsed but no Friday import has run since signup yet
  | "lapsed_grace" // was verified, now off the roster, still inside the grace window
  | "trial_expired" // trial elapsed + an import ran + still no match → locked
  | "lapsed"; // was verified, off the roster, past the grace window → locked

export const TRIAL_DAYS = 7;
export const LAPSE_GRACE_DAYS = 14;

/** Just the fields `resolveAccess` needs — keeps it decoupled from the row type. */
export type AccountState = {
  manualOverride: string | null;
  trialStartedAt: string; // ISO
  trialExpiresAt: string; // ISO
  verifiedAt: string | null; // ISO
  lastMatchedAt: string | null; // ISO
};

export type Resolution = { access: Access; reason: AccessReason };

function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 86_400_000);
}

/**
 * @param acc          the account's lifecycle fields
 * @param matched      is there a CURRENT roster member with this account's email?
 * @param lastImportAt newest successful *membership* import time, or null if none ran
 * @param now          evaluation instant
 */
export function resolveAccess(
  acc: AccountState,
  matched: boolean,
  lastImportAt: Date | null,
  now: Date,
): Resolution {
  // 1. Committee decision always wins (a dev's manual call overrides the roster).
  if (acc.manualOverride === "rejected") return { access: "locked", reason: "manual_rejected" };
  if (acc.manualOverride === "approved") return { access: "verified", reason: "manual_approved" };

  // 2. Live roster match → verified.
  if (matched) return { access: "verified", reason: "roster_match" };

  // 3. Was a member before but isn't on the roster now → short grace, then lock.
  //    Survives a single missed/late Friday import or a one-week roster glitch.
  if (acc.verifiedAt) {
    const base = new Date(acc.lastMatchedAt ?? acc.verifiedAt);
    if (now < addDays(base, LAPSE_GRACE_DAYS)) return { access: "trial", reason: "lapsed_grace" };
    return { access: "locked", reason: "lapsed" };
  }

  // 4. Never verified → trial. Crucially we NEVER lock before a membership import
  //    has actually run since signup, so a student who joins right after a Friday
  //    import still gets a real verification chance before being cut off.
  const trialEnds = new Date(acc.trialExpiresAt);
  const importRanSinceSignup =
    lastImportAt != null && lastImportAt.getTime() > new Date(acc.trialStartedAt).getTime();

  if (now < trialEnds) return { access: "trial", reason: "trial" };
  if (!importRanSinceSignup) return { access: "trial", reason: "awaiting_import" };
  return { access: "locked", reason: "trial_expired" };
}

/** The denormalised `portal_account.status` snapshot for a resolution. */
export function snapshotStatus(r: Resolution): string {
  switch (r.reason) {
    case "manual_approved":
    case "roster_match":
      return "verified";
    case "manual_rejected":
      return "rejected";
    case "lapsed":
    case "lapsed_grace":
      return "lapsed";
    case "trial_expired":
      return "locked";
    default:
      return "trial";
  }
}

/** Whole days left in the trial window (0 when already past). */
export function trialDaysLeft(trialExpiresAt: string, now: Date): number {
  const ms = new Date(trialExpiresAt).getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}
