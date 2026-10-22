import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db, users, eq } from "@wiki/db";
import { LIMITS, rateLimit } from "@wiki/shared";

const creds = z.object({ email: z.string().email(), password: z.string().min(1) });

export function uniqueName(base: string) {
  const clean = base.replace(/[^\p{L}\p{N} _.-]/gu, "").trim().slice(0, 30) || "User";
  return `${clean}${Math.random().toString(36).slice(2, 6)}`;
}

const providers: NextAuthConfig["providers"] = [
  Credentials({
    credentials: { email: {}, password: {} },
    async authorize(raw) {
      const parsed = creds.safeParse(raw);
      if (!parsed.success) return null;
      const email = parsed.data.email.toLowerCase();
      const rl = await rateLimit(`login:${email}`, LIMITS.login.limit, LIMITS.login.window);
      if (!rl.ok) return null;
      const [u] = await db.select().from(users).where(eq(users.email, email));
      if (!u?.passwordHash) return null;
      if (!(await bcrypt.compare(parsed.data.password, u.passwordHash))) return null;
      return { id: u.id, name: u.name, email: u.email, image: u.image };
    },
  }),
];
if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) providers.push(GitHub);
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) providers.push(Google);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  session: { strategy: "jwt", maxAge: 30 * 86400 },
  pages: { signIn: "/login" },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "credentials") return true;
      // OAuth: only trust verified emails; link to an existing account by email or create one.
      const email = user.email?.toLowerCase();
      if (!email) return false;
      if (account?.provider === "google" && !(profile as { email_verified?: boolean })?.email_verified) return false;
      const [existing] = await db.select().from(users).where(eq(users.email, email));
      if (!existing) {
        await db.insert(users).values({ email, name: uniqueName(user.name ?? email.split("@")[0]), image: user.image });
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const [u] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.email, user.email.toLowerCase()));
        if (u) {
          token.uid = u.id;
          token.role = u.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.uid && session.user) {
        session.user.id = token.uid as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});
