/**
 * Application-level rate limiting (abuse / scripting / brute-force guard).
 *
 * Volumetric DDoS is blocked upstream at the edge (Cloudflare + Vercel
 * Firewall — see SECURITY.md). This layer stops the things the edge is bad at:
 * credential stuffing on the login form and scripted hammering of an authed
 * session.
 *
 * State lives in Upstash Redis (REST), the only store that gives accurate
 * counts across Vercel's many short-lived function instances. If the Upstash
 * env vars are absent (local dev, or before the account is wired up) every
 * limiter FAILS OPEN — requests pass through unthrottled rather than erroring,
 * so nothing breaks while the service is being set up.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const upstashConfigured =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

// One Redis client, reused across warm invocations. Built only when configured.
const redis = upstashConfigured ? Redis.fromEnv() : null;

/** Per-IP limit on every matched route — catches scripted/abusive traffic. */
const general = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(120, "60 s"),
      prefix: "rl:app:ip",
      analytics: false,
    })
  : null;

/**
 * Strict limit for the credentials login. Keyed by IP+email so one attacker
 * can't grind a single account and a botnet can't grind one IP either.
 */
const login = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(8, "60 s"),
      prefix: "rl:app:login",
      analytics: false,
    })
  : null;

export type LimitResult = {
  success: boolean;
  /** Unix ms when the window resets — used for the Retry-After header. */
  reset: number;
};

const PASS: LimitResult = { success: true, reset: 0 };

/**
 * Best-effort client IP. Behind Cloudflare → Vercel the real client is in
 * `cf-connecting-ip`; Vercel's own header is `x-forwarded-for` (may be a list,
 * left-most is the client). `req.ip` was removed in Next 16.
 */
export function getClientIp(req: Request): string {
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return "0.0.0.0";
}

/** Per-IP limiter for general traffic. Fails open if Upstash is not configured. */
export async function limitByIp(ip: string): Promise<LimitResult> {
  if (!general) return PASS;
  const { success, reset } = await general.limit(ip);
  return { success, reset };
}

/** Strict limiter for login attempts, keyed by IP + email. Fails open. */
export async function limitLogin(ip: string, email: string): Promise<LimitResult> {
  if (!login) return PASS;
  const { success, reset } = await login.limit(`${ip}:${email}`);
  return { success, reset };
}

/** Build a 429 with a sane Retry-After (seconds) from a reset timestamp. */
export function tooManyRequests(reset: number): Response {
  const retryAfter = reset ? Math.max(1, Math.ceil((reset - dateNow()) / 1000)) : 60;
  return new Response("Too Many Requests", {
    status: 429,
    headers: { "Retry-After": String(retryAfter) },
  });
}

// Indirection so this module has a single, easily-mocked clock reference.
function dateNow(): number {
  return Date.now();
}
