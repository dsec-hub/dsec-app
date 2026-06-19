import "server-only";

import { renderEmail, emailButton, codeBox, infoRow, p, esc } from "@/lib/email-layout";

/**
 * Fire a "new assistance request" alert to the developers via the Resend REST
 * API. We call the HTTP API directly (no SDK) to keep the portal dependency-light.
 *
 * Best-effort: if RESEND_API_KEY is unset (local dev) or the send fails, we log
 * and move on — the request is already saved and visible in dsec-hub's Member
 * Support queue, so a missed email never loses the request.
 */
export type AssistanceAlert = {
  email: string;
  contactEmail?: string | null;
  studentId?: string | null;
  category: string;
  message: string;
};

export async function notifyDevsOfAssistance(req: AssistanceAlert): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.DEVS_ALERT_EMAIL || "admin@dsec.club";
  const from = process.env.PORTAL_FROM_EMAIL || "DSEC Portal <portal@dsec.club>";
  const hub = (process.env.HUB_URL || "https://hub.dsec.club").replace(/\/+$/, "");

  if (!key) {
    console.warn("[notify] RESEND_API_KEY unset — assistance email skipped (request still saved).");
    return;
  }

  const lines = [
    `A member asked for help on the portal.`,
    ``,
    `Login email: ${req.email}`,
    req.contactEmail ? `Email they think they used on DUSA: ${req.contactEmail}` : null,
    req.studentId ? `Student ID: ${req.studentId}` : null,
    `Category: ${req.category}`,
    ``,
    `Message:`,
    req.message,
    ``,
    `Review & action: ${hub}/admin/members`,
  ].filter(Boolean);

  const rows = [
    infoRow("Login email", req.email),
    req.contactEmail ? infoRow("DUSA email", req.contactEmail) : "",
    req.studentId ? infoRow("Student ID", req.studentId) : "",
    infoRow("Category", req.category),
  ].join("");

  const html = renderEmail({
    preview: `New ${req.category} request from ${req.email}`,
    eyebrow: "Member support",
    heading: "A member needs a hand",
    body: `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 24px;">${rows}</table>
      <div style="border:3px solid #f5efe2;background:#050505;padding:18px 18px;margin:0 0 28px;">
        <div style="font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#00bcd4;margin:0 0 10px;">Message</div>
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#f5efe2;white-space:pre-wrap;">${esc(req.message)}</div>
      </div>
      ${emailButton(`${hub}/admin/members`, "Review in Hub", "pink")}
      ${p(`<span style="color:#6f6a60;font-size:13px;">Reply to this email to reach the member directly.</span>`)}`,
  });

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: req.contactEmail || req.email,
        subject: `[Member Support] ${req.category} · ${req.email}`,
        html,
        text: lines.join("\n"),
      }),
    });
    if (!res.ok) {
      console.warn(`[notify] Resend ${res.status}: ${await res.text().catch(() => "")}`);
    }
  } catch (err) {
    console.warn("[notify] assistance email failed:", (err as Error).message);
  }
}

/**
 * Email a 6-digit sign-in code via Resend. Returns whether it was sent — the
 * caller logs the code to the server console as a dev fallback when this is
 * false (no RESEND_API_KEY locally) so the flow is testable without email.
 */
export async function sendLoginCodeEmail(email: string, code: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.PORTAL_FROM_EMAIL || "DSEC Portal <portal@dsec.club>";
  if (!key) return false;

  const html = renderEmail({
    preview: `Your DSEC sign-in code is ${code}`,
    eyebrow: "Member portal",
    heading: "Your sign-in code",
    body: `
      ${p("Enter this code on the portal to finish signing in:")}
      ${codeBox(code)}
      ${p(`<span style="color:#6f6a60;font-size:13px;">It expires in <strong style="color:#f5efe2;">10 minutes</strong>. If you didn't try to sign in, you can safely ignore this email — nobody can access your account without this code.</span>`)}`,
  });

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [email],
        subject: `Your DSEC sign-in code: ${code}`,
        html,
        text: [
          `Your DSEC member portal sign-in code is:`,
          ``,
          `    ${code}`,
          ``,
          `It expires in 10 minutes. If you didn't try to sign in, you can ignore this email.`,
        ].join("\n"),
      }),
    });
    if (!res.ok) {
      console.warn(`[notify] login-code Resend ${res.status}: ${await res.text().catch(() => "")}`);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[notify] login-code email failed:", (err as Error).message);
    return false;
  }
}
