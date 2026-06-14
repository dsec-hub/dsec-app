"use server";

import { AuthError } from "next-auth";

import { signIn } from "@/auth";

export async function authenticate(
  _prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });
  } catch (error) {
    // signIn throws a redirect on success — that must propagate.
    if (error instanceof AuthError) {
      return "Invalid email or password.";
    }
    throw error;
  }
  return undefined;
}
