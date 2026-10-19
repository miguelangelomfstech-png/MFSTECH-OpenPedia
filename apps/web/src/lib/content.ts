import { and, eq, inArray, db, articles, revisions, media, mediaRenditions, users } from "@wiki/db";
import { parseMeta, slugify, type Namespace } from "@wiki/shared";
import { renderMarkdown, type MediaView, type RenderCtx } from "./render";

export async function loadRenderCtx(content: string): Promise<RenderCtx> {
  const meta = parseMeta(content);
  const exists = new Set<string>();
  if (meta.links.length) {
    const rows = await db.select({ slug: articles.slug }).from(articles)
      .where(and(eq(articles.namespace, "main"), inArray(articles.slug, meta.links)));
    rows.forEach((r) => exists.add(r.slug));
  }
  const mediaMap = new Map<string, MediaView>();
  if (meta.media.length) {
    const rows = await db.select().from(media).where(inArray(media.slug, meta.media));
    const rends = rows.length
      ? await db.select().from(mediaRenditions).where(inArray(mediaRenditions.mediaId, rows.map((r) => r.id)))
      : [];
    for (const m of rows) {
      mediaMap.set(m.slug, {
        slug: m.slug, kind: m.kind, status: m.status, width: m.width, height: m.height,
        originalKey: m.originalKey, altText: m.altText,
        renditions: rends.filter((r) => r.mediaId === m.id).map((r) => ({ label: r.label, key: r.key, width: r.width })),
      });
    }
  }
  return { exists, media: mediaMap };
}

export async function renderContent(content: string) {
  return renderMarkdown(content, await loadRenderCtx(content));
}

export async function getArticle(ns: Namespace, slug: string) {
  const [a] = await db.select().from(articles).where(and(eq(articles.namespace, ns), eq(articles.slug, slug)));
  if (!a?.currentRevisionId) return null;
  const [rev] = await db
    .select({
      id: revisions.id, content: revisions.content, createdAt: revisions.createdAt, summary: revisions.summary,
      authorName: users.name,
    })
    .from(revisions).leftJoin(users, eq(users.id, revisions.authorId))
    .where(eq(revisions.id, a.currentRevisionId));
  return rev ? { article: a, revision: rev } : null;
}

export { slugify };
