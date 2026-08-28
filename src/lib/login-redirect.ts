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

// Placeholder origin used only to resolve relative callbacks. `.invalid` is a
// reserved TLD that can never be a real allowlisted origin, so if a value that
// looked relative resolves to anything other than this exact origin it escaped
// (protocol-relative "//evil.com", the backslash forms) and is rejected.
const PLACEHOLDER_ORIGIN = "https://portal.invalid";

/**
 * Return a safe redirect target, or null if the input is missing/untrusted.
 * In-portal relative paths and allowlisted sibling origins pass; everything else
 * is rejected so the caller can fall back to the portal root.
 *
 * A raw string prefix test is NOT trusted: a backslash callbackUrl (e.g.
 * "/\evil.com") starts with "/", never with "//", yet the URL parser resolves it
 * to an external origin. So we reject any backslash outright, then RESOLVE the
 * relative value and re-verify its origin instead of trusting how it starts.
 */
export function sanitizeCallbackUrl(raw: unknown): string | null {
  if (typeof raw !== "string" || raw === "") return null;

  // A backslash has no legitimate place in a portal-relative callback, and the
  // URL parser resolves several backslash forms to an external origin. Reject
  // outright, before any parsing.
  if (raw.includes("\\")) return null;

  // In-portal relative path. Resolve against a placeholder origin and confirm it
  // did not escape it — do not trust the leading "/". "//evil.com" and other
  // protocol-relative forms resolve to a different origin and are rejected here.
  if (raw.startsWith("/")) {
    try {
      const url = new URL(raw, PLACEHOLDER_ORIGIN);
      if (url.origin !== PLACEHOLDER_ORIGIN) return null;
      // The origin check alone is NOT enough: the WHATWG parser collapses dot
      // segments, so "/..//evil.com" (and "/.//evil.com", "/foo/..//evil.com",
      // "/%2e%2e//evil.com") keeps the placeholder origin yet yields the
      // pathname "//evil.com". Returned as-is that string is protocol-relative,
      // and a browser resolves Location "//evil.com" to "https://evil.com/" —
      // the open redirect all over again. Reject any result that would itself
      // start with "//".
      const safe = `${url.pathname}${url.search}${url.hash}`;
      if (safe.startsWith("//")) return null;
      return safe;
    } catch {
      return null;
    }
  }

  // Allowlisted sibling origin (the games site). Unchanged.
  try {
    const url = new URL(raw);
    if (allowedOrigins().includes(url.origin)) return url.toString();
  } catch {
    /* not a valid absolute URL */
  }
  return null;
}
