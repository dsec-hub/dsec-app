import "server-only";

import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { portalAccount } from "@/db/schema";
import { TRIAL_DAYS } from "@/lib/membership";

/**
 * Find-or-create the portal_account for a freshly-authenticated OAuth identity,
 * returning its id. Called from the NextAuth `jwt` callback on sign-in (see
 * auth.ts). Kept free of any `@/auth` import so auth.ts can import it without a
 * circular dependency.
 *
 * The email is the OAuth-verified address, lowercased — the one true key we
 * later match against the DUSA roster. On first sight we stamp the 7-day trial
 * window; on subsequent logins we just refresh the profile fields.
 */
export async function upsertPortalAccount(input: {
  email: string;
  name: string | null;
  avatarUrl: string | null;
  provider: string | null;
  providerAccountId: string | null;
}): Promise<number> {
  const email = input.email.trim().toLowerCase();

  const [existing] = await db
    .select({ id: portalAccount.id })
    .from(portalAccount)
    .where(sql`lower(${portalAccount.email}) = ${email}`)
    .limit(1);

  if (existing) {
    await db
      .update(portalAccount)
      .set({
        name: input.name,
        avatarUrl: input.avatarUrl,
        provider: input.provider,
        providerAccountId: input.providerAccountId,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(portalAccount.id, existing.id));
    return existing.id;
  }

  const now = new Date();
  const trialExpires = new Date(now.getTime() + TRIAL_DAYS * 86_400_000);
  const [created] = await db
    .insert(portalAccount)
    .values({
      email,
      name: input.name,
      avatarUrl: input.avatarUrl,
      provider: input.provider,
      providerAccountId: input.providerAccountId,
      status: "trial",
      trialStartedAt: now.toISOString(),
      trialExpiresAt: trialExpires.toISOString(),
    })
    .returning({ id: portalAccount.id });

  return created.id;
}
