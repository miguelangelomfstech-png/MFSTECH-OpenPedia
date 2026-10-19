import { NextResponse } from "next/server";
import { db, articles, eq, and, desc, isNull } from "@wiki/db";
import { LIMITS, rateLimit } from "@wiki/shared";
import { clientIp } from "@/lib/viewer";

export const dynamic = "force-dynamic";

/** GET /api/v1/articles?limit=20&offset=0 — public, read-only, rate limited. */
export async function GET(req: Request) {
  if (!(await rateLimit(`api:${await clientIp()}`, LIMITS.api.limit, LIMITS.api.window)).ok) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const u = new URL(req.url);
  const limit = Math.min(100, Math.max(1, Number(u.searchParams.get("limit") ?? 20)));
  const offset = Math.max(0, Number(u.searchParams.get("offset") ?? 0));
  const rows = await db.select({
    id: articles.id, title: articles.title, slug: articles.slug, featured: articles.featured, updatedAt: articles.updatedAt,
  }).from(articles).where(and(eq(articles.namespace, "main"), isNull(articles.redirectToSlug)))
    .orderBy(desc(articles.updatedAt)).limit(limit).offset(offset);
  return NextResponse.json({ data: rows, limit, offset }, { headers: { "Cache-Control": "public, s-maxage=30" } });
}
