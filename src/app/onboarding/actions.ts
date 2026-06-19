"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { portalAccount } from "@/db/schema";
import { apiAuth } from "@/lib/api";

export type PhotoState = { ok?: true; photoUrl?: string; error?: string } | undefined;
export type FinishState = { error: string } | undefined;

const MAX_UPLOAD_BYTES = 12_000_000; // 12 MB source; dsec-api re-compresses to a budgeted webp.

/**
 * Upload the member's REQUIRED verification face photo. Bytes go to Supabase via
 * dsec-api /media (the portal holds no storage creds); we keep only the returned
 * URL on portal_account. Best-effort cleanup of any earlier photo so re-takes
 * during onboarding don't pile up. Needs a write-scoped DSEC_API_KEY.
 */
export async function uploadFacePhoto(_prev: PhotoState, fd: FormData): Promise<PhotoState> {
  const session = await auth();
  const accountId = session?.user?.accountId;
  if (!accountId) return { error: "Your session expired — please sign in again." };

  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a photo to upload." };
  if (file.type && !file.type.startsWith("image/")) return { error: "That file isn't an image." };
  if (file.size > MAX_UPLOAD_BYTES) return { error: "That image is too large (max 12 MB)." };

  const env = apiAuth();
  if (!env) {
    return {
      error:
        "Photo upload isn't configured yet (needs DSEC_API_URL + a write-scoped DSEC_API_KEY). Ask a developer.",
    };
  }

  // Existing portal_account photos to clean up after a successful replace.
  let previous: { id: number }[] = [];
  try {
    const list = await fetch(
      `${env.base}/media?entity_type=portal_account&entity_id=${accountId}`,
      { headers: { Authorization: `Bearer ${env.key}` }, cache: "no-store" },
    );
    if (list.ok) previous = (await list.json()) as { id: number }[];
  } catch {
    /* non-fatal — cleanup is best-effort */
  }

  const body = new FormData();
  body.set("entity_type", "portal_account");
  body.set("entity_id", String(accountId));
  body.set("role", "photo");
  body.set("file", file, file.name || "face.jpg");

  let webpUrl: string;
  try {
    const res = await fetch(`${env.base}/media`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.key}` },
      body,
    });
    if (!res.ok) {
      const detail = await res.text();
      return { error: `Upload failed (${res.status}). ${detail.slice(0, 160)}` };
    }
    const asset = (await res.json()) as { webp_url?: string };
    if (!asset.webp_url) return { error: "Upload succeeded but no image URL came back. Try again." };
    webpUrl = asset.webp_url;
  } catch (e) {
    return { error: `Couldn't reach the upload service: ${(e as Error).message}` };
  }

  const now = new Date().toISOString();
  await db
    .update(portalAccount)
    .set({ photoUrl: webpUrl, photoUploadedAt: now, updatedAt: now })
    .where(eq(portalAccount.id, accountId));

  // Drop the earlier photos now the new one is stored (best-effort).
  for (const m of previous) {
    await fetch(`${env.base}/media/${m.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${env.key}` },
    }).catch(() => {});
  }

  return { ok: true, photoUrl: webpUrl };
}

/**
 * Finish onboarding and enter the portal. The face photo is MANDATORY — even if
 * the member skips the optional name step, we won't complete without it. An
 * optional display name can be set here.
 */
export async function completeOnboarding(_prev: FinishState, fd: FormData): Promise<FinishState> {
  const session = await auth();
  const accountId = session?.user?.accountId;
  if (!accountId) return { error: "Your session expired — please sign in again." };

  const [account] = await db
    .select({ photoUrl: portalAccount.photoUrl })
    .from(portalAccount)
    .where(eq(portalAccount.id, accountId))
    .limit(1);

  if (!account?.photoUrl) {
    return { error: "Please add your verification photo before continuing." };
  }

  const name = String(fd.get("name") ?? "").trim().slice(0, 256);
  const now = new Date().toISOString();
  await db
    .update(portalAccount)
    .set({
      ...(name ? { name } : {}),
      onboardingCompletedAt: now,
      updatedAt: now,
    })
    .where(eq(portalAccount.id, accountId));

  redirect("/dashboard");
}
