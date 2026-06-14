"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { sponsors } from "@/db/schema";
import { requireSession } from "@/lib/dal";
import { bool, int, num, str } from "@/lib/form-data";

export type FormState = { error?: string } | undefined;

function parseSponsor(fd: FormData) {
  return {
    organisation: str(fd, "organisation") ?? "",
    stage: str(fd, "stage"),
    contactPersonId: int(fd, "contact_person_id"),
    tier: str(fd, "tier"),
    valueAud: num(fd, "value_aud"),
    dusaApproved: bool(fd, "dusa_approved"),
    notes: str(fd, "notes"),
  };
}

function revalidateSponsors() {
  revalidatePath("/sponsors");
  revalidatePath("/");
}

export async function createSponsor(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireSession();
  const values = parseSponsor(fd);
  if (!values.organisation) return { error: "Organisation is required." };
  await db.insert(sponsors).values(values);
  revalidateSponsors();
  redirect("/sponsors");
}

export async function updateSponsor(
  id: number,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireSession();
  const values = parseSponsor(fd);
  if (!values.organisation) return { error: "Organisation is required." };
  await db
    .update(sponsors)
    .set({ ...values, updatedAt: new Date().toISOString() })
    .where(eq(sponsors.id, id));
  revalidateSponsors();
  redirect("/sponsors");
}

export async function archiveSponsor(id: number): Promise<void> {
  await requireSession();
  await db
    .update(sponsors)
    .set({ archived: true, updatedAt: new Date().toISOString() })
    .where(eq(sponsors.id, id));
  revalidateSponsors();
  redirect("/sponsors");
}
