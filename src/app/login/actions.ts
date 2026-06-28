"use server";

import { AuthError } from "next-auth";

import { signIn } from "@/auth";
import { issueLoginCode } from "@/lib/login-code";
import { sanitizeCallbackUrl } from "@/lib/login-redirect";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export type LoginState =
  | { step: "email"; error?: string }
  | { step: "code"; email: string; error?: string; resent?: boolean };

/**
 * One server action driving the two-step login, branched on the `intent` field:
 *   - request / resend → email a fresh code, advance to the code step
 *   - verify           → check the code via NextAuth (signIn redirects on success)
 *   - restart          → go back to the email step
 */
export async function loginAction(
  _prev: LoginState | undefined,
  formData: FormData,
): Promise<LoginState> {
  const intent = String(formData.get("intent") ?? "request");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (intent === "restart") return { step: "email" };

  if (!EMAIL_RE.test(email)) return { step: "email", error: "Enter a valid email address." };

  if (intent === "request" || intent === "resend") {
    const res = await issueLoginCode(email);
    if (!res.ok) {
      // On the first request, stay on the email step; on resend, keep the code step.
      return intent === "resend"
        ? { step: "code", email, error: res.error }
        : { step: "email", error: res.error };
    }
    return { step: "code", email, resent: intent === "resend" };
  }

  // intent === "verify"
  const code = String(formData.get("code") ?? "").trim();
  if (!/^\d{6}$/.test(code)) {
    return { step: "code", email, error: "Enter the 6-digit code we emailed you." };
  }
  // Carried from the games site via a hidden field; null unless trusted. The
  // NextAuth `redirect` callback re-validates it before honouring it.
  const callbackUrl = sanitizeCallbackUrl(formData.get("callbackUrl"));
  try {
    await signIn("credentials", { email, code, redirectTo: callbackUrl ?? "/" });
  } catch (err) {
    // NextAuth throws a redirect on success (must propagate); AuthError = bad code.
    if (err instanceof AuthError) {
      return { step: "code", email, error: "That code is invalid or expired. Try again or resend." };
    }
    throw err;
  }
  return { step: "code", email };
}
