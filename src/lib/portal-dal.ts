import "server-only";

import { cache } from "react";
import { and, desc, eq, isNotNull, sql } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { portalAccount, members, dusaImport } from "@/db/schema";
import {
  resolveAccess,
  snapshotStatus,
  trialDaysLeft,
  type Access,
  type AccessReason,
} from "@/lib/membership";

export type MatchedMember = {
  id: number;
  fullName: string | null;
  email: string | null;
  dusaMember: boolean;
  membershipType: string | null;
  firstSubscriptionDate: string | null;
  endDate: string | null;
};

export type PortalAccountRow = typeof portalAccount.$inferSelect;

export type PortalUser = {
  account: PortalAccountRow;
  access: Access;
  reason: AccessReason;
  /** The matched current roster row, when verified by roster (drives the Membership tile). */
  member: MatchedMember | null;
  /** Whole days left in the trial window (only meaningful while access === "trial"). */
  daysLeft: number;
};

/**
 * The authoritative "who is this member and what can they see?" loader. Run on
 * every authenticated request; `cache()` dedupes it within a single render so
 * the layout and page share one DB round-trip.
 *
 * It (1) loads the account, (2) checks the LIVE DUSA roster for an email match,
 * (3) finds the newest successful membership import, (4) runs the pure state
 * machine, and (5) persists the resulting snapshot (status + verify/match
 * stamps) so dsec-hub's Member Support view stays current without recomputing.
 *
 * Returns null when there's no session or the account vanished.
 */
export const getPortalUser = cache(async (): Promise<PortalUser | null> => {
  const session = await auth();
  const accountId = session?.user?.accountId;
  const email = session?.user?.email?.toLowerCase();
  if (!accountId || !email) return null;

  const [account] = await db
    .select()
    .from(portalAccount)
    .where(eq(portalAccount.id, accountId))
    .limit(1);
  if (!account) return null;

  // (2) Roster lookup by email, current-or-not. A CURRENT match is the paid-member
  // signal (drives `matched`); a NOT-current row still tells us when the roster
  // last saw this member (last_seen_at), which anchors the post-lapse grace window
  // (NEW-APPDEEP-03). Order current-first so a live membership always wins.
  const [rosterRow] = await db
    .select({
      id: members.id,
      fullName: members.fullName,
      email: members.email,
      dusaMember: members.dusaMember,
      membershipType: members.membershipType,
      firstSubscriptionDate: members.firstSubscriptionDate,
      endDate: members.endDate,
      isCurrent: members.isCurrent,
      lastSeenAt: members.lastSeenAt,
    })
    .from(members)
    .where(sql`lower(${members.email}) = ${email}`)
    .orderBy(desc(members.isCurrent), desc(members.endDate))
    .limit(1);

  // Only a CURRENT roster row is a live match (drives the verified state and the
  // Membership tile). A not-current row is kept solely for its timestamp below.
  const member: MatchedMember | null = rosterRow?.isCurrent
    ? {
        id: rosterRow.id,
        fullName: rosterRow.fullName,
        email: rosterRow.email,
        dusaMember: rosterRow.dusaMember,
        membershipType: rosterRow.membershipType,
        firstSubscriptionDate: rosterRow.firstSubscriptionDate,
        endDate: rosterRow.endDate,
      }
    : null;

  // Grace anchor: when the roster last saw this member, read from their row
  // whether or not it is still current — so a member dropped by one bad import
  // still has a recent timestamp (their row keeps last_seen_at from the previous
  // good import). Null when they have never been on the roster → resolveAccess
  // falls back to the visit/verify stamps.
  const rosterLastSeenAt = rosterRow?.lastSeenAt ? new Date(rosterRow.lastSeenAt) : null;

  // (3) Newest successful *membership* import — tells us whether a Friday roster
  // has landed since this account signed up.
  const [imp] = await db
    .select({ createdAt: dusaImport.createdAt })
    .from(dusaImport)
    .where(and(eq(dusaImport.reportType, "membership"), eq(dusaImport.status, "ok")))
    .orderBy(desc(dusaImport.createdAt))
    .limit(1);
  const lastImportAt = imp?.createdAt ? new Date(imp.createdAt) : null;

  // (4) Decide.
  const now = new Date();
  const resolution = resolveAccess(account, !!member, rosterLastSeenAt, lastImportAt, now);
  const nowISO = now.toISOString();

  // (5) Persist the snapshot (best-effort heartbeat).
  const patch: Partial<PortalAccountRow> = {
    status: snapshotStatus(resolution),
    lastCheckAt: nowISO,
    updatedAt: nowISO,
  };
  if (member) {
    patch.lastMatchedAt = nowISO;
    patch.memberId = member.id;
    if (!account.verifiedAt) patch.verifiedAt = nowISO;
  }
  try {
    await db.update(portalAccount).set(patch).where(eq(portalAccount.id, account.id));
  } catch (err) {
    console.warn("[portal-dal] snapshot update failed:", (err as Error).message);
  }

  return {
    account: { ...account, ...patch },
    access: resolution.access,
    reason: resolution.reason,
    member: member ?? null,
    daysLeft: trialDaysLeft(account.trialExpiresAt, now),
  };
});

/**
 * The authorisation entry point for Server Actions. A Server Action is a plain
 * POST endpoint, so the page-level membership redirects in (app)/layout.tsx and
 * onboarding/page.tsx do NOT protect it — every action must ask for itself.
 *
 *   allow: "active" → rejects locked/rejected accounts (the default)
 *   allow: "any"    → any signed-in account, used ONLY by the assistance form,
 *                     which locked members must be able to reach
 */
export async function requirePortalUser(
  opts: { allow?: "active" | "any" } = {},
): Promise<PortalUser | null> {
  const user = await getPortalUser();
  if (!user) return null;
  if ((opts.allow ?? "active") === "active" && user.access === "locked") return null;
  return user;
}

/**
 * The verification face photo for a roster member, by `members.id`. Used by the
 * PUBLIC /verify page so a scanned card shows the member's face (matched via the
 * portal_account that linked to this member). No session needed — the caller is
 * already gated by knowing a valid membership code. Returns null if none set.
 */
export async function getVerificationPhotoByMemberId(memberId: number): Promise<string | null> {
  const [row] = await db
    .select({ photoUrl: portalAccount.photoUrl })
    .from(portalAccount)
    .where(and(eq(portalAccount.memberId, memberId), isNotNull(portalAccount.photoUrl)))
    .orderBy(desc(portalAccount.lastMatchedAt))
    .limit(1);
  return row?.photoUrl ?? null;
}
