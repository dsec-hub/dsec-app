/**
 * Pure-logic tests for the membership state machine. Run:
 *
 *   npx tsx src/lib/membership.test.ts
 *
 * Focus (NEW-APPDEEP-03): the post-lapse grace window is anchored to when the
 * ROSTER last saw the member (`rosterLastSeenAt`), not to when they last opened
 * the portal — so a verified member who has not visited in months still gets the
 * full grace when one bad import drops them, and falls back to the visit/verify
 * stamps only when the roster timestamp is unavailable.
 */
import { resolveAccess, LAPSE_GRACE_DAYS, type AccountState } from "./membership";

const DAY = 86_400_000;
const now = new Date("2026-08-30T12:00:00Z");
const ago = (days: number): Date => new Date(now.getTime() - days * DAY);
const agoISO = (days: number): string => ago(days).toISOString();

const failures: string[] = [];
const check = (name: string, ok: boolean) => {
  if (!ok) {
    failures.push(name);
  }
};

/** A previously-verified account, off the roster now (matched=false in tests). */
function verifiedAccount(over: Partial<AccountState> = {}): AccountState {
  return {
    manualOverride: null,
    trialStartedAt: agoISO(200),
    trialExpiresAt: agoISO(193), // trial long over
    verifiedAt: agoISO(180),
    lastMatchedAt: agoISO(180),
    ...over,
  };
}

// --- The headline fix: roster anchor grants full grace to a long-absent member.
check(
  "dropped member unseen for months still gets grace (roster seen yesterday)",
  resolveAccess(
    verifiedAccount({ lastMatchedAt: agoISO(180) }),
    false,
    ago(1), // roster last saw them yesterday
    ago(2), // an import ran (this is the one that dropped them)
    now,
  ).reason === "lapsed_grace",
);

// --- Fresh roster timestamp, inside the window → lapsed_grace (trial access).
{
  const r = resolveAccess(verifiedAccount(), false, ago(1), ago(2), now);
  check("fresh roster timestamp → lapsed_grace", r.reason === "lapsed_grace");
  check("lapsed_grace grants trial access", r.access === "trial");
}

// --- Roster timestamp past the window → lapsed (locked).
{
  const r = resolveAccess(verifiedAccount(), false, ago(LAPSE_GRACE_DAYS + 16), ago(2), now);
  check("roster timestamp 30 days ago → lapsed", r.reason === "lapsed");
  check("lapsed locks access", r.access === "locked");
}

// --- Boundary: exactly at the window edge is expired (now === base+grace, not <).
check(
  "roster timestamp exactly grace days ago → lapsed",
  resolveAccess(verifiedAccount(), false, ago(LAPSE_GRACE_DAYS), ago(2), now).reason === "lapsed",
);

// --- Fallback when roster timestamp is null: uses lastMatchedAt (old behaviour).
check(
  "null roster ts, lastMatchedAt 90 days ago → lapsed (fallback)",
  resolveAccess(
    verifiedAccount({ lastMatchedAt: agoISO(90) }),
    false,
    null,
    ago(2),
    now,
  ).reason === "lapsed",
);
check(
  "null roster ts, lastMatchedAt yesterday → lapsed_grace (fallback)",
  resolveAccess(
    verifiedAccount({ lastMatchedAt: agoISO(1) }),
    false,
    null,
    ago(2),
    now,
  ).reason === "lapsed_grace",
);
check(
  "null roster ts and null lastMatchedAt → falls back to verifiedAt",
  resolveAccess(
    verifiedAccount({ lastMatchedAt: null, verifiedAt: agoISO(1) }),
    false,
    null,
    ago(2),
    now,
  ).reason === "lapsed_grace",
);

// --- The roster anchor must win over a stale visit stamp in BOTH directions.
check(
  "stale visit but fresh roster ts → grace (roster wins)",
  resolveAccess(
    verifiedAccount({ lastMatchedAt: agoISO(180) }),
    false,
    ago(3),
    ago(2),
    now,
  ).reason === "lapsed_grace",
);
check(
  "fresh visit but stale roster ts → lapsed (roster wins)",
  resolveAccess(
    verifiedAccount({ lastMatchedAt: agoISO(1) }),
    false,
    ago(LAPSE_GRACE_DAYS + 16),
    ago(2),
    now,
  ).reason === "lapsed",
);

// --- Sanity: earlier branches are unaffected by the new parameter.
check(
  "current roster match → roster_match (grace anchor irrelevant)",
  resolveAccess(verifiedAccount(), true, ago(200), null, now).reason === "roster_match",
);
check(
  "manual approval still wins over everything",
  resolveAccess(
    verifiedAccount({ manualOverride: "approved" }),
    false,
    ago(200),
    ago(2),
    now,
  ).reason === "manual_approved",
);

if (failures.length) {
  console.error("FAILED: " + failures.join(", "));
  process.exit(1);
}
console.log("membership: all assertions passed");
