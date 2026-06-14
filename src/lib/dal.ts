import "server-only";

import { redirect } from "next/navigation";

import { auth } from "@/auth";

/**
 * Require a signed-in user. The proxy already gates routes, but Server Actions
 * and data reads must verify independently (defense in depth — see the Next.js
 * authentication guide).
 */
export async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect("/signin");
  return session;
}
