"use server";

import { and, count, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { assistanceRequest } from "@/db/schema";
import { notifyDevsOfAssistance } from "@/lib/notify";

export type AssistanceState = { ok: true } | { error: string } | undefined;

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const CATEGORIES = new Set(["verification", "access", "bug", "other"]);

export async function submitAssistance(
  _prev: AssistanceState,
  formData: FormData,
): Promise<AssistanceState> {
  const session = await auth();
  const accountId = session?.user?.accountId;
  const email = session?.user?.email?.toLowerCase();
  if (!accountId || !email) return { error: "Your session expired — please sign in again." };

  const message = String(formData.get("message") ?? "").trim();
  const contactEmailRaw = String(formData.get("contact_email") ?? "").trim().toLowerCase();
  const studentId = String(formData.get("student_id") ?? "").trim() || null;
  const category = String(formData.get("category") ?? "verification");

  if (message.length < 10) return { error: "Please tell us a bit more (at least 10 characters)." };
  if (message.length > 4000) return { error: "That's a bit long — please keep it under 4000 characters." };
  if (contactEmailRaw && (contactEmailRaw.length > 256 || !EMAIL_RE.test(contactEmailRaw))) {
    return { error: "That backup email doesn't look valid." };
  }
  if (studentId && studentId.length > 32) return { error: "That student ID looks too long." };
  const cat = CATEGORIES.has(category) ? category : "other";

  // Light anti-spam: cap how many OPEN requests one account can stack up.
  const [{ open }] = await db
    .select({ open: count() })
    .from(assistanceRequest)
    .where(and(eq(assistanceRequest.portalAccountId, accountId), eq(assistanceRequest.status, "open")));
  if (open >= 5) {
    return { error: "You already have a few open requests — hang tight, we'll get to them." };
  }

  await db.insert(assistanceRequest).values({
    portalAccountId: accountId,
    email,
    contactEmail: contactEmailRaw || null,
    studentId,
    category: cat,
    message,
  });

  // Best-effort alert; never blocks the request being saved.
  await notifyDevsOfAssistance({ email, contactEmail: contactEmailRaw || null, studentId, category: cat, message });

  return { ok: true };
}
