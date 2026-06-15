"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { taskBoards, tasks } from "@/db/workspace-schema";
import { requireWrite } from "@/lib/dal";
import { int, str } from "@/lib/form-data";
import { createToken, snapshotForDelete, snapshotForUpdate } from "@/lib/undo";
import type { ActionResult } from "@/lib/undo-types";
import { logMutation } from "@/lib/usage";
import { DEFAULT_BOARD_COLUMNS } from "@/lib/workspace-options";

export type FormState = ActionResult;

function parseTask(fd: FormData) {
  return {
    title: str(fd, "title") ?? "",
    boardId: int(fd, "board_id"),
    status: str(fd, "status") ?? "Backlog",
    priority: str(fd, "priority"),
    assigneeId: int(fd, "assignee_id"),
    committee: str(fd, "committee"),
    dueDate: str(fd, "due_date"),
    description: str(fd, "description"),
    relatedEventId: int(fd, "related_event_id"),
    relatedProjectId: int(fd, "related_project_id"),
  };
}

function revalidateTasks() {
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  revalidatePath("/");
}

export async function createTask(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireWrite("tasks");
  const values = parseTask(fd);
  if (!values.title) return { error: "Title is required." };
  const [row] = await db.insert(tasks).values(values).returning({ id: tasks.id });
  await logMutation(user, "create", "task", row?.id);
  revalidateTasks();
  return { ok: true, message: "Task created", undo: createToken("task", row?.id) };
}

export async function updateTask(
  id: number,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const user = await requireWrite("tasks");
  const values = parseTask(fd);
  if (!values.title) return { error: "Title is required." };
  const undo = await snapshotForUpdate("task", id);
  await db
    .update(tasks)
    .set({ ...values, updatedAt: new Date().toISOString() })
    .where(eq(tasks.id, id));
  await logMutation(user, "update", "task", id);
  revalidateTasks();
  return { ok: true, message: "Task updated", undo };
}

export async function archiveTask(id: number): Promise<FormState> {
  const user = await requireWrite("tasks");
  await db
    .update(tasks)
    .set({ archived: true, updatedAt: new Date().toISOString() })
    .where(eq(tasks.id, id));
  await logMutation(user, "archive", "task", id);
  revalidateTasks();
  return { ok: true, message: "Task archived", undo: { op: "update", key: "task", id, prev: { archived: false } } };
}

export async function deleteTask(id: number): Promise<FormState> {
  const user = await requireWrite("tasks");
  const undo = await snapshotForDelete("task", id);
  await db.delete(tasks).where(eq(tasks.id, id));
  await logMutation(user, "delete", "task", id);
  revalidateTasks();
  return { ok: true, message: "Task deleted", undo };
}

/**
 * Quick-add from a board column: creates a task with just a title, in the given
 * board (or the Inbox when boardId is null) and status. Used by the inline
 * "+ Add task" affordance on each kanban column.
 */
export async function quickAddTask(
  boardId: number | null,
  status: string,
  fd: FormData,
): Promise<void> {
  const user = await requireWrite("tasks");
  const title = str(fd, "title");
  if (!title) return;
  const [row] = await db
    .insert(tasks)
    .values({ boardId, status, title })
    .returning({ id: tasks.id });
  await logMutation(user, "create", "task", row?.id);
  revalidateTasks();
}

export async function createBoard(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireWrite("tasks");
  const name = str(fd, "name") ?? "";
  if (!name) return { error: "Board name is required." };
  const [row] = await db
    .insert(taskBoards)
    .values({
      name,
      description: str(fd, "description"),
      committee: str(fd, "committee"),
      columns: [...DEFAULT_BOARD_COLUMNS],
    })
    .returning({ id: taskBoards.id });
  await logMutation(user, "create", "board", row?.id);
  revalidateTasks();
  return { ok: true, message: "Board created", undo: createToken("board", row?.id) };
}

/**
 * Move a task to a new status column. Called inline from <MoveControl> with the
 * taskId bound, so it reads only `status` from the submitted FormData and does
 * NOT redirect. Setting status to "Done" stamps completedAt; anything else
 * clears it.
 */
export async function moveTask(taskId: number, fd: FormData): Promise<void> {
  await moveTaskTo(taskId, str(fd, "status") ?? "Backlog");
}

/** Programmatic move (used by the drag-and-drop board). */
export async function moveTaskTo(taskId: number, status: string): Promise<void> {
  const user = await requireWrite("tasks");
  const now = new Date().toISOString();
  await db
    .update(tasks)
    .set({
      status,
      completedAt: status === "Done" ? now : null,
      updatedAt: now,
    })
    .where(eq(tasks.id, taskId));
  await logMutation(user, "update", "task", taskId);
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}
