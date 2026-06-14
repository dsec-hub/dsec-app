"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { people } from "@/db/schema";
import { requireSession } from "@/lib/dal";
import { str } from "@/lib/form-data";

export type FormState = { error?: string } | undefined;

function parsePerson(fd: FormData) {
  return {
    name: str(fd, "name") ?? "",
    type: str(fd, "type"),
    committee: str(fd, "committee"),
    roleTitle: str(fd, "role_title"),
    email: str(fd, "email"),
    status: str(fd, "status"),
    notes: str(fd, "notes"),
  };
}

function revalidatePeople() {
  revalidatePath("/people");
  revalidatePath("/");
}

export async function createPerson(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireSession();
  const values = parsePerson(fd);
  if (!values.name) return { error: "Name is required." };
  await db.insert(people).values(values);
  revalidatePeople();
  redirect("/people");
}

export async function updatePerson(
  id: number,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireSession();
  const values = parsePerson(fd);
  if (!values.name) return { error: "Name is required." };
  await db
    .update(people)
    .set({ ...values, updatedAt: new Date().toISOString() })
    .where(eq(people.id, id));
  revalidatePeople();
  redirect("/people");
}

export async function archivePerson(id: number): Promise<void> {
  await requireSession();
  await db
    .update(people)
    .set({ archived: true, updatedAt: new Date().toISOString() })
    .where(eq(people.id, id));
  revalidatePeople();
  redirect("/people");
}
