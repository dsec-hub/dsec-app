import type { NextAuthConfig } from "next-auth";

/**
 * Edge/proxy-safe base config: NO database or bcrypt imports, so it can be
 * loaded by `proxy.ts` (which runs on every request) without bundling `pg`.
 * The Credentials provider (which needs the DB) is added in `auth.ts`.
 */
export const authConfig = {
  pages: { signIn: "/signin" },
  session: { strategy: "jwt" },
  providers: [], // real provider added in auth.ts
  callbacks: {
    // Route gate, evaluated in the proxy on every matched request.
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnSignin = nextUrl.pathname === "/signin";
      if (isOnSignin) {
        return isLoggedIn ? Response.redirect(new URL("/", nextUrl)) : true;
      }
      return isLoggedIn; // every other route requires a session
    },
    // Carry id + role from the user record into the JWT…
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    // …and expose them on the session.
    session({ session, token }) {
      if (session.user) {
        if (typeof token.id === "string") session.user.id = token.id;
        if (typeof token.role === "string") session.user.role = token.role;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
