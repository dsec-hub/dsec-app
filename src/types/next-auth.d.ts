import { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      /** portal_account.id — set in the auth.ts jwt callback on sign-in. */
      accountId?: number;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accountId?: number;
    email?: string;
  }
}
