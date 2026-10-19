import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { cache } from "react";
import { auth } from "@/auth";
import { db, users, eq, isAutoconfirmed, type Actor, type User } from "@wiki/db";

export type Viewer = { user: User | null; actor: Actor; ip: string };

export const clientIp = async () => {
  const h = await headers();
  // Behind Caddy, X-Forwarded-For is overwritten by the proxy and therefore trustworthy.
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "0.0.0.0";
};

export const hashIp = (ip: string) =>
  createHash("sha256").update(`${process.env.AUTH_SECRET}:${ip}`).digest("hex").slice(0, 32);

/** Resolve the current actor with fresh role/block status from the database. */
export const getViewer = cache(async (): Promise<Viewer> => {
  const ip = await clientIp();
  const session = await auth();
  if (session?.user?.id) {
    const [u] = await db.select().from(users).where(eq(users.id, session.user.id));
    if (u) {
      return {
        user: u, ip,
        actor: {
          userId: u.id, role: u.role, autoconfirmed: isAutoconfirmed(u),
          blocked: !!u.blockedUntil && u.blockedUntil > new Date(), ipHash: null,
        },
      };
    }
  }
  return { user: null, ip, actor: { userId: null, role: "anon", autoconfirmed: false, blocked: false, ipHash: hashIp(ip) } };
});
