import NextAuth from "next-auth";

import { authConfig } from "@/auth.config";

// Next.js 16 renamed Middleware to Proxy. This gates every matched route via the
// `authorized` callback in authConfig (JWT-only check — no DB hit here).
export default NextAuth(authConfig).auth;

export const config = {
  // Run on everything except API routes, Next internals, and static assets.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|ico|webp)$).*)"],
};
