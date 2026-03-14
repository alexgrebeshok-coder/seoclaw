import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { Adapter } from "next-auth/adapters";
import bcrypt from "bcryptjs";
import { checkAuthRateLimit } from "@/lib/auth-rate-limit";

// Extend NextAuth types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role?: string;
      organizationSlug?: string;
      workspaceId?: string;
    };
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        // Rate limiting: 5 attempts per 15 minutes per email/IP
        const clientIp = req.headers?.["x-forwarded-for"] || "unknown";
        const rateLimitKey = `auth:${credentials.email}:${clientIp}`;
        const { allowed, remaining, resetAt } = checkAuthRateLimit(rateLimitKey);
        
        if (!allowed) {
          const resetTime = resetAt ? Math.ceil((resetAt - Date.now()) / 60000) : 15;
          throw new Error(`Too many login attempts. Please try again in ${resetTime} minutes.`);
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user.password) {
          // Don't reveal whether user exists
          throw new Error("Invalid email or password");
        }

        // Check email verification
        if (!user.emailVerified) {
          throw new Error("Please verify your email address before logging in");
        }

        // NOTE: Password hashing best practices:
        // - bcryptjs is used for secure password hashing
        // - Salt rounds: 10 (good balance of security and performance)
        // - Never store plain text passwords in production
        const passwordMatch = await bcrypt.compare(credentials.password, user.password);

        if (!passwordMatch) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
    // Google OAuth Provider (optional - configured if env vars exist)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    // GitHub OAuth Provider (optional - configured if env vars exist)
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name;
        session.user.image = token.picture;
        session.user.role = token.role as string | undefined;
        session.user.organizationSlug = token.organizationSlug as string | undefined;
        session.user.workspaceId = token.workspaceId as string | undefined;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;

        // Fetch user role and workspace from Membership
        const membership = await prisma.membership.findFirst({
          where: { userId: user.id },
          include: { organization: true },
        });

        if (membership) {
          token.role = membership.role;
          token.organizationSlug = membership.organization.slug;
          token.workspaceId = membership.workspaceMemberships[0]?.workspaceId;
        }
      }
      return token;
    },
    async signIn({ user, account, profile }) {
      // Allow credentials provider (already validated in authorize)
      if (account?.provider === "credentials") {
        return true;
      }

      // For OAuth providers, check if user exists in database
      // This prevents unauthorized users from accessing the system
      if (account?.provider === "google" || account?.provider === "github") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email || "" }
        });

        if (!existingUser) {
          // Reject unknown users
          // NOTE: For public apps, you might want to auto-create users instead
          console.log(`OAuth sign-in rejected for unknown user: ${user.email}`);
          return false;
        }

        // Check if email is verified
        if (!existingUser.emailVerified) {
          console.log(`OAuth sign-in rejected - email not verified: ${user.email}`);
          return false;
        }

        return true;
      }

      // Unknown provider
      return false;
    },
  },
  events: {
    async signIn({ user, account, profile }) {
      console.log(`User signed in: ${user.email}`);
    },
    async signOut({ token }) {
      console.log(`User signed out: ${token?.email}`);
    },
  },
  debug: process.env.NODE_ENV === "development",
};
