"use server";

import { signOut } from "@/auth";

/** Sign out and return to the login page. Used by the header's "Sign out" form. */
export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}
