"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { projects } from "@/db/workspace-schema";
import { requireWrite } from "@/lib/dal";
import { bool, int, str } from "@/lib/form-data";
import { logMutation } from "@/lib/usage";
import { archiveToken, createToken, snapshotForDelete, snapshotForUpdate } from "@/lib/undo";
import type { ActionResult } from "@/lib/undo-types";

export type FormState = ActionResult;
export type ProjectRow = typeof projects.$inferSelect;

/** Lowercase, non-alphanumerics -> "-", trim leading/trailing "-". */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Comma-separated tech tags -> string[] (null when empty). */
function parseTechTags(fd: FormData): string[] | null {
  const raw = str(fd, "tech_tags");
  if (!raw) return null;
  const tags = raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  return tags.length ? tags : null;
}

function parseProject(fd: FormData) {
  return {
    name: str(fd, "name") ?? "",
    summary: str(fd, "summary"),
    description: str(fd, "description"),
    status: str(fd, "status"),
    category: str(fd, "category"),
    techTags: parseTechTags(fd),
    leadId: int(fd, "lead_id"),
    repoUrl: str(fd, "repo_url"),
    demoUrl: str(fd, "demo_url"),
    imageUrl: str(fd, "image_url"),
    isPublic: bool(fd, "is_public"),
    featured: bool(fd, "featured"),
    relatedEventId: int(fd, "related_event_id"),
    notes: str(fd, "notes"),
  };
}

function revalidateProjects() {
  revalidatePath("/projects");
  revalidatePath("/dashboard");
}

export async function createProject(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireWrite("projects");
  const values = parseProject(fd);
  if (!values.name) return { error: "Project name is required." };
  const slug = slugify(values.name) || null;
  const [row] = await db
    .insert(projects)
    .values({ ...values, slug })
    .returning({ id: projects.id });
  await logMutation(user, "create", "project", row?.id);
  revalidateProjects();
  return { ok: true, message: "Project created", undo: createToken("project", row?.id) };
}

export async function updateProject(
  id: number,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const user = await requireWrite("projects");
  const values = parseProject(fd);
  if (!values.name) return { error: "Project name is required." };
  const undo = await snapshotForUpdate("project", id);
  await db
    .update(projects)
    .set({ ...values, updatedAt: new Date().toISOString() })
    .where(eq(projects.id, id));
  await logMutation(user, "update", "project", id);
  revalidateProjects();
  return { ok: true, message: "Project updated", undo };
}

export async function archiveProject(id: number): Promise<FormState> {
  const user = await requireWrite("projects");
  await db
    .update(projects)
    .set({ archived: true, updatedAt: new Date().toISOString() })
    .where(eq(projects.id, id));
  await logMutation(user, "archive", "project", id);
  revalidateProjects();
  return {
    ok: true,
    message: "Project archived",
    undo: archiveToken("project", id),
  };
}

export async function deleteProject(id: number): Promise<FormState> {
  const user = await requireWrite("projects");
  const undo = await snapshotForDelete("project", id);
  await db.delete(projects).where(eq(projects.id, id));
  await logMutation(user, "delete", "project", id);
  revalidateProjects();
  return { ok: true, message: "Project deleted", undo };
}
