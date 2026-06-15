/**
 * Serializable "undo token" describing how to reverse a single mutation. An
 * undoable server action returns one of these to the client; the Sonner toast's
 * "Undo" button hands it straight back to `performUndo`. Tokens must stay plain
 * JSON (no Date objects, no class instances) so they survive the
 * server → client → server round-trip — our timestamp columns are already
 * `mode: "string"`, numerics/dates serialize as strings, and json columns as
 * arrays/objects, so a snapshotted row is JSON-safe as-is.
 */

/** Registry keys for undoable tables — keep in sync with REGISTRY in undo.ts. */
export type UndoKey =
  | "event"
  | "finance"
  | "person"
  | "sponsor"
  | "project"
  | "task"
  | "board"
  | "user"
  | "role"
  | "committee";

type Row = Record<string, unknown>;

export type UndoToken =
  // reverse a create → delete the row we just inserted
  | { op: "create"; key: UndoKey; id: number }
  // reverse an update/archive → restore the prior column values
  | { op: "update"; key: UndoKey; id: number; prev: Row }
  // reverse a hard delete → re-insert the captured row (same id)
  | { op: "delete"; key: UndoKey; row: Row }
  // reverse a key/value settings write (admin → links) → restore prior values
  | { op: "settings"; prev: Record<string, string | null>; paths: string[] };

/**
 * What every undoable action returns — a superset of the old per-section
 * `FormState`. `message` is the toast headline; `undo` (when present) becomes
 * the toast's Undo button.
 */
export type ActionResult =
  | { error?: string; ok?: boolean; message?: string; undo?: UndoToken }
  | undefined;
