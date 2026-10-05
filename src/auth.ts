import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import {
  getUserForAuthentication,
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
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
      }

      return session;
    },
  },
});
