import "server-only";

import { headers } from "next/headers";

/** Resolve the app's public origin for building invite links.
 * Prefers APP_URL; otherwise derives it from the incoming request headers. */
export async function getAppUrl(): Promise<string> {
  const fromEnv = process.env.APP_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

type InviteEmail = {
  to: string;
  link: string;
  roleName: string;
  committee?: string | null;
  invitedBy?: string | null;
};

/**
 * Send an invite email via the Resend HTTP API (no SDK dependency).
 * Degrades gracefully: with no RESEND_API_KEY set, it logs the link and reports
 * `sent: false` so the admin UI can surface the copyable link instead.
 */
export async function sendInviteEmail({
  to,
  link,
  roleName,
  committee,
  invitedBy,
}: InviteEmail): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "DSEC Dashboard <onboarding@resend.dev>";

  if (!apiKey) {
    console.info(`[invite] RESEND_API_KEY not set — share this link manually:\n  ${link}`);
    return { sent: false };
  }

  const by = invitedBy ? ` by ${invitedBy}` : "";
  const onCommittee = committee ? ` on the <strong>${committee}</strong> committee` : "";
  const html = `
    <div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:480px;margin:0 auto;color:#111">
      <h2 style="font-size:18px;margin:0 0 12px">You've been invited to the DSEC Dashboard</h2>
      <p style="font-size:14px;line-height:1.6;color:#444">
        You've been invited${by} to join the DSEC exec dashboard with the
        <strong>${roleName}</strong> role${onCommittee}. Click below to set your password and get started.
      </p>
      <p style="margin:24px 0">
        <a href="${link}" style="background:#e91e63;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px;font-weight:600">
          Accept invite
        </a>
      </p>
      <p style="font-size:12px;color:#888;line-height:1.6">
        Or paste this link into your browser:<br>${link}<br><br>
        This link expires in 7 days. If you weren't expecting this, you can ignore it.
      </p>
    </div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: "You've been invited to the DSEC Dashboard",
        html,
      }),
    });
    if (!res.ok) {
      const detail = await res.text();
      console.error(`[invite] Resend error ${res.status}: ${detail}`);
      return { sent: false, error: `Email failed (${res.status}). Share the link manually.` };
    }
    return { sent: true };
  } catch (err) {
    console.error("[invite] Resend request failed:", err);
    return { sent: false, error: "Email request failed. Share the link manually." };
  }
}
