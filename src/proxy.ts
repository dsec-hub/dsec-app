import NextAuth from "next-auth";

import { authConfig } from "@/auth.config";

// Next.js 16 renamed Middleware to Proxy. We load only the edge-safe `authConfig`
// (no `pg`/OAuth-secret imports) so this stays lightweight. Delegating to
// NextAuth's middleware runs the `authorized` route gate in auth.config.ts:
// anonymous requests to anything but /login are redirected to /login.
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  // Run on everything except API routes, Next internals, and static assets.
  // /api/auth/* (the OAuth dance) is excluded here on purpose.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|ico|webp|gif|mp4|webm|woff2?)$).*)"],
};
