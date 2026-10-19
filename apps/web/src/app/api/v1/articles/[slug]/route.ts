import { NextResponse } from "next/server";
import { db, articles, revisions, articleCategories, categories, eq, and } from "@wiki/db";
import { slugify } from "@wiki/shared";
import { LIMITS, rateLimit } from "@wiki/shared";
import { clientIp } from "@/lib/viewer";
import { renderContent } from "@/lib/content";

export const dynamic = "force-dynamic";

/** GET /api/v1/articles/:slug?format=html|markdown (default: both) */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!(await rateLimit(`api:${await clientIp()}`, LIMITS.api.limit, LIMITS.api.window)).ok) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const slug = slugify(decodeURIComponent((await params).slug));
  const [a] = await db.select().from(articles).where(and(eq(articles.namespace, "main"), eq(articles.slug, slug)));
  if (!a?.currentRevisionId) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const [rev] = await db.select().from(revisions).where(eq(revisions.id, a.currentRevisionId));
  const cats = await db.select({ title: categories.title, slug: categories.slug }).from(articleCategories)
    .innerJoin(categories, eq(categories.id, articleCategories.categoryId)).where(eq(articleCategories.articleId, a.id));
  const format = new URL(req.url).searchParams.get("format");
  const rendered = format === "markdown" ? null : await renderContent(rev.content);
  return NextResponse.json({
    id: a.id, title: a.title, slug: a.slug, protection: a.protection, featured: a.featured,
    redirectTo: a.redirectToSlug, categories: cats, revisionId: rev.id, updatedAt: a.updatedAt,
    ...(format !== "html" && { markdown: rev.content }),
    ...(rendered && { html: rendered.html, toc: rendered.toc }),
  }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300" } });
}
