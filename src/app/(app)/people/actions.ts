"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { people } from "@/db/schema";
import { requireWrite } from "@/lib/dal";
import { bool, int, str } from "@/lib/form-data";
import { archiveToken, createToken, snapshotForDelete, snapshotForUpdate } from "@/lib/undo";
import type { ActionResult } from "@/lib/undo-types";

export type FormState = ActionResult;

function parsePerson(fd: FormData) {
  return {
    name: str(fd, "name") ?? "",
    type: str(fd, "type"),
    committee: str(fd, "committee"),
    roleTitle: str(fd, "role_title"),
    email: str(fd, "email"),
    status: str(fd, "status"),
    studentId: str(fd, "student_id"),
    discord: str(fd, "discord"),
    instagram: str(fd, "instagram"),
    github: str(fd, "github"),
    linkedin: str(fd, "linkedin"),
    website: str(fd, "website"),
    notes: str(fd, "notes"),
    bio: str(fd, "bio"),
    showOnWebsite: bool(fd, "show_on_website"),
    displayOrder: int(fd, "display_order") ?? 0,
  };
}

function revalidatePeople() {
  revalidatePath("/people");
  revalidatePath("/");
}

export async function createPerson(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireWrite("people");
  const values = parsePerson(fd);
  if (!values.name) return { error: "Name is required." };
  const [row] = await db.insert(people).values(values).returning({ id: people.id });
  revalidatePeople();
  return { ok: true, message: "Person created", undo: createToken("person", row?.id) };
}

export async function updatePerson(
  id: number,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireWrite("people");
  const values = parsePerson(fd);
  if (!values.name) return { error: "Name is required." };
  const undo = await snapshotForUpdate("person", id);
  await db
    .update(people)
    .set({ ...values, updatedAt: new Date().toISOString() })
    .where(eq(people.id, id));
  revalidatePeople();
  return { ok: true, message: "Person updated", undo };
}

export async function archivePerson(id: number): Promise<FormState> {
  await requireWrite("people");
  await db
    .update(people)
    .set({ archived: true, updatedAt: new Date().toISOString() })
    .where(eq(people.id, id));
  revalidatePeople();
  return {
    ok: true,
    message: "Person archived",
    undo: archiveToken("person", id),
  };
}

export async function deletePerson(id: number): Promise<FormState> {
  await requireWrite("people");
  const undo = await snapshotForDelete("person", id);
  await db.delete(people).where(eq(people.id, id));
  revalidatePeople();
  return { ok: true, message: "Person deleted", undo };
}
