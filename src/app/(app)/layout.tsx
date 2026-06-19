import { redirect } from "next/navigation";

import { StatusBanner } from "@/components/status-banner";
import { getPortalUser } from "@/lib/portal-dal";

/**
 * The members-only shell. The proxy guarantees a session here; this layer adds
 * the MEMBERSHIP gate that needs the DB + live roster:
 *   - no account  → /login
 *   - locked       → /locked (trial expired unmatched, lapsed, or rejected)
 *   - no photo yet → /onboarding (every member must add a verification photo)
 *   - trial        → full access + the "verifying" banner
 *   - verified     → full access
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getPortalUser();
  if (!user) redirect("/login");
  if (user.access === "locked") redirect("/locked");
  // Required verification photo gate — applies to trial AND verified members.
  // /onboarding lives outside this group, so there's no redirect loop.
  if (!user.account.photoUrl) redirect("/onboarding");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {user.access === "trial" && <StatusBanner reason={user.reason} daysLeft={user.daysLeft} />}
      {children}
    </div>
  );
}
