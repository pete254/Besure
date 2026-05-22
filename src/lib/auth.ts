// src/lib/auth.ts
// NextAuth v5 configuration — credentials login for staff

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Validate inputs
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        // Find user in DB
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user || !user.isActive) return null;

        // Verify password
        const passwordMatch = await compare(password, user.passwordHash);
        if (!passwordMatch) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Only restrict Google sign-ins
      if (account?.provider === "google" && user.email) {
        // Get whitelisted emails from environment variable
        const whitelistedEmails = process.env.GOOGLE_WHITELIST_EMAILS?.split(",").map(e => e.trim().toLowerCase()) || [];
        
        // If whitelist is configured, check if email is allowed
        if (whitelistedEmails.length > 0) {
          const isWhitelisted = whitelistedEmails.includes(user.email.toLowerCase());
          if (!isWhitelisted) {
            console.warn(`Blocked Google login attempt from non-whitelisted email: ${user.email}`);
            return false; // Deny access
          }
        }

        // Check if user exists in database
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, user.email))
          .limit(1);

        if (!existingUser) {
          console.warn(`Google login blocked: user ${user.email} not found in database`);
          return false; // User must exist in DB
        }

        if (!existingUser.isActive) {
          console.warn(`Google login blocked: user ${user.email} is inactive`);
          return false; // User must be active
        }
      }

      return true; // Allow sign-in
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.email = user.email;
      }

      // Store Google refresh token
      if (account?.provider === "google" && account?.refresh_token) {
        token.googleRefreshToken = account.refresh_token;
        token.googleAccessToken = account.access_token;

        // Update user in database
        if (token.email) {
          try {
            const [existingUser] = await db
              .select()
              .from(users)
              .where(eq(users.email, token.email))
              .limit(1);

            if (existingUser) {
              await db
                .update(users)
                .set({
                  googleRefreshToken: account.refresh_token,
                  googleAccessToken: account.access_token,
                  updatedAt: new Date(),
                })
                .where(eq(users.email, token.email));
            }
          } catch (error) {
            console.error("Error storing Google token:", error);
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).googleRefreshToken = token.googleRefreshToken;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours — typical work day
  },
});