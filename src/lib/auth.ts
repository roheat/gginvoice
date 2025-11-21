import { DefaultSession, NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import { db } from "./db";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      id: string;
    };
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "database",
  },
  callbacks: {
    async signIn({ user, account }) {
      // Log for debugging
      if (process.env.NODE_ENV === "development") {
        console.log("Sign in attempt:", {
          email: user.email,
          accountProvider: account?.provider,
          accountId: account?.providerAccountId,
        });
      }

      // Ensure email is normalized (lowercase, trimmed)
      if (user.email) {
        user.email = user.email.toLowerCase().trim();
      }

      if (!account?.provider || !account?.providerAccountId) {
        return false;
      }

      // Check if this Google account is already linked to a user
      const existingAccount = await db.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
          },
        },
        include: { user: true },
      });

      if (existingAccount) {
        // Account exists - verify email matches exactly
        const existingEmail = existingAccount.user.email.toLowerCase().trim();
        const signInEmail = user.email?.toLowerCase().trim();

        if (existingEmail !== signInEmail) {
          console.error("Account linking mismatch:", {
            accountEmail: existingAccount.user.email,
            signInEmail: user.email,
            accountId: account.providerAccountId,
          });
          // Don't allow linking to different email
          return false;
        }

        // Account is correctly linked, allow sign in
        return true;
      }

      // New account - check if user already has an account with this provider
      if (user.email) {
        const existingUser = await db.user.findUnique({
          where: { email: user.email },
          include: {
            accounts: {
              where: { provider: account.provider },
            },
          },
        });

        if (existingUser && existingUser.accounts.length > 0) {
          // User already has a Google account linked
          // Prevent linking a second Google account to the same user
          console.error("User already has a Google account linked:", {
            userEmail: user.email,
            existingAccountId: existingUser.accounts[0].providerAccountId,
            newAccountId: account.providerAccountId,
          });
          return false;
        }
      }

      return true;
    },
    async session({ session, user }) {
      if (user) {
        session.user.id = user.id;
        // Ensure email matches
        if (session.user.email !== user.email) {
          console.warn("Email mismatch in session:", {
            sessionEmail: session.user.email,
            userEmail: user.email,
          });
          session.user.email = user.email;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
};
