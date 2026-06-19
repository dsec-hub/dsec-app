import type { NextAuthConfig } from "next-auth";

/**
 * Edge/proxy-safe base config: NO database, OAuth-secret, or bcrypt imports, so
 * `proxy.ts` (which runs on every matched request) can load it without bundling
 * `pg`. The real providers + the DB-aware `jwt` callback are added in `auth.ts`.
 *
 * This layer only does the COARSE gate: "is there a session?". The fine-grained
 * membership gate (trial vs locked vs verified) needs the DB + the live DUSA
 * roster, so it lives in the (app) layout via `getPortalUser()`.
 */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [], // real providers added in auth.ts
  callbacks: {
    // Route gate, evaluated in the proxy on every matched request.
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;

      // Public membership verification: door / event staff scan a member's QR
      // (which opens /verify/<code>) without having a portal account themselves.
      if (path.startsWith("/verify")) return true;

      // The login page is the only OTHER unauthenticated route. Bounce signed-in
      // users off it (the root redirector sends them to the right place).
      if (path === "/login") {
        return isLoggedIn ? Response.redirect(new URL("/", nextUrl)) : true;
      }

      // Everything else requires a session. Members who are still unverified or
      // locked DO have a session — they're filtered by the (app) layout, not
      // here, so they can still reach /locked and /assistance.
      return isLoggedIn;
    },
    // Carry the portal account id + email onto the JWT (set in auth.ts on sign-in)…
    jwt({ token }) {
      return token;
    },
    // …and expose them on the session.
    session({ session, token }) {
      if (session.user) {
        if (typeof token.accountId === "number") session.user.accountId = token.accountId;
        if (typeof token.email === "string") session.user.email = token.email;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
