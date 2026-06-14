"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { events } from "@/db/schema";
import { requireSession } from "@/lib/dal";

export type FormState = { error?: string } | undefined;

function str(fd: FormData, key: string): string | null {
  const v = (fd.get(key) as string | null)?.trim();
  return v ? v : null;
}

function int(fd: FormData, key: string): number | null {
  const v = str(fd, key);
  if (v === null) return null;
  const n = Number.parseInt(v, 10);
  return Number.isNaN(n) ? null : n;
}

function bool(fd: FormData, key: string): boolean {
  return fd.get(key) != null; // a checked checkbox is present; unchecked is absent
}

function parseEvent(fd: FormData) {
  return {
    name: str(fd, "name") ?? "",
    type: str(fd, "type"),
    status: str(fd, "status"),
    startDate: str(fd, "start_date"),
    endDate: str(fd, "end_date"),
    trimester: str(fd, "trimester"),
    format: str(fd, "format"),
    venue: str(fd, "venue"),
    eventLeadId: int(fd, "event_lead_id"),
    committee: str(fd, "committee"),
    dusaSubmissionStatus: str(fd, "dusa_submission_status"),
    dusaDeadline: str(fd, "dusa_deadline"),
    dusaRequired: bool(fd, "dusa_required"),
    foodProvided: bool(fd, "food_provided"),
    externalGuests: bool(fd, "external_guests"),
    expectedAttendance: int(fd, "expected_attendance"),
    actualAttendance: int(fd, "actual_attendance"),
    notes: str(fd, "notes"),
  };
}

function revalidateEvents() {
  revalidatePath("/events");
  revalidatePath("/events/dusa");
  revalidatePath("/");
}

export async function createEvent(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireSession();
  const values = parseEvent(fd);
  if (!values.name) return { error: "Event name is required." };
  await db.insert(events).values(values);
  revalidateEvents();
  redirect("/events");
}

export async function updateEvent(
  id: number,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireSession();
  const values = parseEvent(fd);
  if (!values.name) return { error: "Event name is required." };
  await db
    .update(events)
    .set({ ...values, updatedAt: new Date().toISOString() })
    .where(eq(events.id, id));
  revalidateEvents();
  redirect("/events");
}

export async function archiveEvent(id: number): Promise<void> {
  await requireSession();
  await db
    .update(events)
    .set({ archived: true, updatedAt: new Date().toISOString() })
    .where(eq(events.id, id));
  revalidateEvents();
  redirect("/events");
}
