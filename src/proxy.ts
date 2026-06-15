import NextAuth from "next-auth";
import type { NextRequest, NextFetchEvent } from "next/server";

import { authConfig } from "@/auth.config";
import { getClientIp, limitByIp, tooManyRequests } from "@/lib/rate-limit";

// Next.js 16 renamed Middleware to Proxy. Defaults to the Node.js runtime, so
// the Upstash REST client works here without edge restrictions.
const { auth } = NextAuth(authConfig);

// Per-IP rate limit runs FIRST, then we delegate to NextAuth's middleware.
// Calling `auth(req, ctx)` with a real Request re-runs the `authorized` route
// gate in auth.config.ts, so the existing RBAC behaviour is unchanged — we've
// only added a throttle in front of it.
export default async function proxy(req: NextRequest, ctx: NextFetchEvent) {
  const { success, reset } = await limitByIp(getClientIp(req));
  if (!success) return tooManyRequests(reset);
  return auth(req as never, ctx as never);
}

export const config = {
  // Run on everything except API routes, Next internals, and static assets.
  // Login (/api/auth/*) is excluded here and throttled inside auth.ts instead.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|ico|webp)$).*)"],
};
