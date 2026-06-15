"use server";

import { requireWrite } from "@/lib/dal";
import { REGISTRY, applyUndo } from "@/lib/undo";
import type { ActionResult, UndoToken } from "@/lib/undo-types";

/**
 * Reverse a single mutation from the token its action returned. The token comes
 * from the client, so we NEVER trust it for authorization: we re-check the
 * caller still has write access to the affected module (settings tokens require
 * admin) before applying anything. Re-running an op the caller could already do
 * themselves — so undo grants no new power.
 */
export async function performUndo(token: UndoToken | undefined): Promise<ActionResult> {
  if (!token) return { error: "Nothing to undo." };

  const moduleKey = token.op === "settings" ? "admin" : REGISTRY[token.key]?.module;
  if (!moduleKey) return { error: "Can't undo that." };
  await requireWrite(moduleKey); // redirects view-only users (settings tokens → admin only)

  try {
    await applyUndo(token);
    return { ok: true };
  } catch {
    return { error: "Couldn't undo — the data may have changed since." };
  }
}
