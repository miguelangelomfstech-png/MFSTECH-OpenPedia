import type { MetadataRoute } from "next";
import { db, articles, media, eq, and, isNull } from "@wiki/db";

export const dynamic = "force-dynamic";

/** Up to 50k URLs per sitemap; split with generateSitemaps() once the wiki grows past that. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.SITE_URL ?? "http://localhost:3000";
  const rows = await db.select({ slug: articles.slug, at: articles.updatedAt }).from(articles)
    .where(and(eq(articles.namespace, "main"), isNull(articles.redirectToSlug))).limit(49000);
  const files = await db.select({ slug: media.slug, at: media.createdAt }).from(media).where(eq(media.status, "ready")).limit(1000);
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    ...rows.map((r) => ({ url: `${base}/wiki/${encodeURIComponent(r.slug)}`, lastModified: r.at, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...files.map((f) => ({ url: `${base}/file/${encodeURIComponent(f.slug)}`, lastModified: f.at, priority: 0.3 })),
  ];
}
