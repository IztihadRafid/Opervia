import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import {
  getUserForAuthentication,
  getUserForSession,
  updateLastLoginAt,
} from "@/lib/services/auth.service";
import { verifyPassword } from "@/lib/auth/password";

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        if (
          typeof credentials?.email !== "string" ||
          typeof credentials?.password !== "string"
        ) {
          return null;
        }

        const user = await getUserForAuthentication(credentials.email);

        if (!user || !user.passwordHash) {
          return null;
        }

        if (user.status !== "active") {
          return null;
        }

        const isValidPassword = await verifyPassword(
          credentials.password,
          user.passwordHash,
        );

        if (!isValidPassword) {
          return null;
        }

        await updateLastLoginAt(user._id.toString());

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          sessionVersion: user.sessionVersion ?? 1,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.sessionVersion = user.sessionVersion ?? 1;
      }

      if (token.userId && token.sessionVersion !== undefined) {
        const currentUser = await getUserForSession(String(token.userId));

        if (
          !currentUser ||
          currentUser.status !== "active" ||
          (currentUser.sessionVersion ?? 1) !== token.sessionVersion
        ) {
          token.userId = undefined;
          token.sessionVersion = undefined;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token.userId) {
        session.user.id = String(token.userId);
      }

      return session;
    },
  },
});
