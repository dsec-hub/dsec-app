/**
 * Post-login redirect allowlist.
 *
 * Sign-in normally lands on "/" (the root router then picks dashboard vs locked).
 * But a player who started at games.dsec.club arrives at /login with
 * `?callbackUrl=<games URL>`; we honour it so they bounce straight back to the
 * game after verifying their code. Only in-portal relative paths and our own
 * sibling apps (the games site) are allowed — never an arbitrary origin, which
 * would be an open redirect.
 *
 * Pure + edge-safe (URL + env only), so the proxy's `authorized` callback and the
 * NextAuth `redirect` callback in auth.config.ts can share it.
 */

function allowedOrigins(): string[] {
  const out: string[] = [];
  for (const raw of [process.env.NEXT_PUBLIC_GAMES_URL, process.env.AUTH_URL]) {
    if (!raw) continue;
    try {
      out.push(new URL(raw).origin);
    } catch {
      /* ignore a malformed env value */
    }
  }
  return out;
}

/**
 * Return a safe redirect target, or null if the input is missing/untrusted.
 * In-portal relative paths and allowlisted sibling origins pass; everything else
 * is rejected so the caller can fall back to the portal root.
 */
export function sanitizeCallbackUrl(raw: unknown): string | null {
  if (typeof raw !== "string" || raw === "") return null;
  // In-portal relative path (but reject protocol-relative "//evil.com").
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  try {
    const url = new URL(raw);
    if (allowedOrigins().includes(url.origin)) return url.toString();
  } catch {
    /* not a valid absolute URL */
  }
  return null;
}
