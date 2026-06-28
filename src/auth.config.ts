import type { NextAuthConfig } from "next-auth";

import { sanitizeCallbackUrl } from "./lib/login-redirect";

/**
 * Edge/proxy-safe base config: NO database, OAuth-secret, or bcrypt imports, so
 * `proxy.ts` (which runs on every matched request) can load it without bundling
 * `pg`. The real providers + the DB-aware `jwt` callback are added in `auth.ts`.
 *
 * This layer only does the COARSE gate: "is there a session?". The fine-grained
 * membership gate (trial vs locked vs verified) needs the DB + the live DUSA
 * roster, so it lives in the (app) layout via `getPortalUser()`.
 */
// Share the session cookie across *.dsec.club subdomains (e.g. games.dsec.club)
// when AUTH_COOKIE_DOMAIN is set. Auth.js sets a host-only cookie by default, so
// the domain must be set explicitly. Env-gated: a no-op (host-only) when unset,
// so existing single-domain behaviour is unchanged until you opt in.
const cookieDomain = process.env.AUTH_COOKIE_DOMAIN;
const useSecureCookie = process.env.NODE_ENV === "production";

export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [], // real providers added in auth.ts
  ...(cookieDomain
    ? {
        cookies: {
          sessionToken: {
            name: useSecureCookie ? "__Secure-authjs.session-token" : "authjs.session-token",
            options: {
              domain: cookieDomain,
              path: "/",
              sameSite: "lax" as const,
              secure: useSecureCookie,
              httpOnly: true,
            },
          },
        },
      }
    : {}),
  callbacks: {
    // Route gate, evaluated in the proxy on every matched request.
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;

      // Public membership verification: door / event staff scan a member's QR
      // (which opens /verify/<code>) without having a portal account themselves.
      if (path.startsWith("/verify")) return true;

      // The login page is the only OTHER unauthenticated route. Bounce signed-in
      // users off it: honour a trusted ?callbackUrl (e.g. straight back to the
      // games site when they were already logged in) else the root redirector.
      if (path === "/login") {
        if (!isLoggedIn) return true;
        const cb = sanitizeCallbackUrl(nextUrl.searchParams.get("callbackUrl"));
        return Response.redirect(new URL(cb ?? "/", nextUrl));
      }

      // Everything else requires a session. Members who are still unverified or
      // locked DO have a session — they're filtered by the (app) layout, not
      // here, so they can still reach /locked and /assistance.
      return isLoggedIn;
    },
    // Where `signIn({ redirectTo })` is allowed to land. Relative portal paths
    // and our own origin always pass; the games site passes via the shared
    // allowlist (lib/login-redirect) so a player who signed in from games.dsec
    // .club is dropped straight back into the game. Anything else → portal root.
    redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch {
        return baseUrl;
      }
      return sanitizeCallbackUrl(url) ?? baseUrl;
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
