import "server-only";

import { createHmac, randomInt, timingSafeEqual } from "crypto";
import { and, count, desc, eq, gte, isNull } from "drizzle-orm";

import { db } from "@/db";
import { emailLoginCode } from "@/db/schema";
import { sendLoginCodeEmail } from "@/lib/notify";

const CODE_TTL_MS = 10 * 60_000; // 10 minutes
const MAX_ATTEMPTS = 5; // wrong tries per code before it's dead
const MAX_PER_HOUR = 5; // codes requested per email per hour (anti-bombing)

/** HMAC the code with AUTH_SECRET as a pepper so a DB leak can't reverse it. */
function hashCode(email: string, code: string): string {
  const secret = process.env.AUTH_SECRET ?? "";
  return createHmac("sha256", secret).update(`${email}:${code}`).digest("hex");
}

function hashesEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export type IssueResult = { ok: true } | { ok: false; error: string };

/**
 * Generate a 6-digit code for `email`, store its hash, and email it (or log it
 * to the console in local dev without Resend). Rate-limited per email/hour.
 */
export async function issueLoginCode(email: string): Promise<IssueResult> {
  email = email.trim().toLowerCase();
  const now = Date.now();

  const hourAgo = new Date(now - 3_600_000).toISOString();
  const [{ n }] = await db
    .select({ n: count() })
    .from(emailLoginCode)
    .where(and(eq(emailLoginCode.email, email), gte(emailLoginCode.createdAt, hourAgo)));
  if (n >= MAX_PER_HOUR) {
    return { ok: false, error: "Too many codes requested for this email. Please try again later." };
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await db.insert(emailLoginCode).values({
    email,
    codeHash: hashCode(email, code),
    expiresAt: new Date(now + CODE_TTL_MS).toISOString(),
  });

  const sent = await sendLoginCodeEmail(email, code);
  if (!sent) {
    if (process.env.NODE_ENV === "production") {
      return { ok: false, error: "We couldn't send the email right now. Please try again shortly." };
    }
    // Local dev fallback: read the code from the server console.
    console.log(`\n[login-code] DEV — sign-in code for ${email}: ${code}\n`);
  }
  return { ok: true };
}

/**
 * Verify a submitted code against the newest unconsumed code for `email`.
 * Single-use, expiring, and attempt-limited. Returns true only on a match.
 */
export async function verifyLoginCode(email: string, code: string): Promise<boolean> {
  email = email.trim().toLowerCase();
  code = code.trim();
  if (!/^\d{6}$/.test(code)) return false;

  const [row] = await db
    .select()
    .from(emailLoginCode)
    .where(and(eq(emailLoginCode.email, email), isNull(emailLoginCode.consumedAt)))
    .orderBy(desc(emailLoginCode.createdAt))
    .limit(1);
  if (!row) return false;
  if (new Date(row.expiresAt).getTime() < Date.now()) return false;
  if (row.attempts >= MAX_ATTEMPTS) return false;

  if (!hashesEqual(hashCode(email, code), row.codeHash)) {
    await db
      .update(emailLoginCode)
      .set({ attempts: row.attempts + 1 })
      .where(eq(emailLoginCode.id, row.id));
    return false;
  }

  // Consume it (single use).
  await db
    .update(emailLoginCode)
    .set({ consumedAt: new Date().toISOString() })
    .where(eq(emailLoginCode.id, row.id));
  return true;
}
