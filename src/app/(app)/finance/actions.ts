"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { finance } from "@/db/schema";
import { requireSession } from "@/lib/dal";
import { bool, int, num, str } from "@/lib/form-data";

export type FormState = { error?: string } | undefined;

function parseFinance(fd: FormData) {
  return {
    item: str(fd, "item") ?? "",
    type: str(fd, "type"),
    amountAud: num(fd, "amount_aud"),
    gstIncluded: bool(fd, "gst_included"),
    status: str(fd, "status"),
    dateRequested: str(fd, "date_requested"),
    datePaid: str(fd, "date_paid"),
    relatedEventId: int(fd, "related_event_id"),
    notes: str(fd, "notes"),
  };
}

function revalidateFinance() {
  revalidatePath("/finance");
  revalidatePath("/");
}

export async function createFinance(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireSession();
  const values = parseFinance(fd);
  if (!values.item) return { error: "Item is required." };
  await db.insert(finance).values(values);
  revalidateFinance();
  redirect("/finance");
}

export async function updateFinance(
  id: number,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireSession();
  const values = parseFinance(fd);
  if (!values.item) return { error: "Item is required." };
  await db
    .update(finance)
    .set({ ...values, updatedAt: new Date().toISOString() })
    .where(eq(finance.id, id));
  revalidateFinance();
  redirect("/finance");
}

export async function archiveFinance(id: number): Promise<void> {
  await requireSession();
  await db
    .update(finance)
    .set({ archived: true, updatedAt: new Date().toISOString() })
    .where(eq(finance.id, id));
  revalidateFinance();
  redirect("/finance");
}
