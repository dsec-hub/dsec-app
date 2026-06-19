import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authConfig } from "./auth.config";
import { upsertPortalAccount } from "./lib/portal-account";
import { verifyLoginCode } from "./lib/login-code";

/**
 * The member-portal auth instance. Sign-in is **passwordless email + one-time
 * code**: a member enters their email, we email a 6-digit code, and they enter
 * it here. Receiving the code proves they control that inbox — so nobody can
 * type a stranger's DUSA email to hijack their membership. The verified email is
 * the only key the membership state machine matches against the DUSA roster.
 *
 * We always allow sign-in (anyone can have an account); the (app) layout decides
 * what a given member can actually see. On sign-in the `jwt` callback
 * find-or-creates the portal_account (starting the 7-day trial) and stamps its id.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      id: "credentials",
      name: "Email code",
      credentials: { email: {}, code: {} },
      async authorize(creds) {
        const email = String(creds?.email ?? "").trim().toLowerCase();
        const code = String(creds?.code ?? "").trim();
        if (!email || !code) return null;
        const ok = await verifyLoginCode(email, code);
        if (!ok) return null;
        return { id: email, email, name: email.split("@")[0] };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    // DB-aware: runs in the Node runtime (route handler / server `auth()` call),
    // not in the proxy. On sign-in `account` is set → upsert + stamp the id.
    async jwt({ token, user, account }) {
      if (account && user?.email) {
        const email = user.email.toLowerCase().trim();
        const accountId = await upsertPortalAccount({
          email,
          name: user.name ?? null,
          avatarUrl: user.image ?? null,
          provider: "email",
          providerAccountId: null,
        });
        token.accountId = accountId;
        token.email = email;
      }
      return token;
    },
  },
});
