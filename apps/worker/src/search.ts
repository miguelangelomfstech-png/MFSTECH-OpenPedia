import { db, articles, revisions, categories, articleCategories, media, mediaRenditions, eq, and } from "@wiki/db";
import {
  meili, toPlainText, INDEX_ARTICLES, INDEX_MEDIA,
  type ArticleDoc, type MediaDoc, type SearchJob,
} from "@wiki/shared";

export async function indexJob(job: SearchJob) {
  if (job.type === "delete-article") {
    await meili().index(INDEX_ARTICLES).deleteDocument(job.articleId);
    return;
  }
  if (job.type === "media") {
    const [m] = await db.select().from(media).where(eq(media.id, job.mediaId));
    if (!m || m.status !== "ready") return;
    const [thumb] = await db.select().from(mediaRenditions)
      .where(and(eq(mediaRenditions.mediaId, m.id), eq(mediaRenditions.label, "thumb-400")));
    const doc: MediaDoc = {
      id: m.id, title: m.filename.replace(/_/g, " "), slug: m.slug, kind: m.kind,
      description: m.description, license: m.license, thumbKey: thumb?.key ?? null,
      createdAt: m.createdAt.getTime(),
    };
    await meili().index(INDEX_MEDIA).addDocuments([doc]);
    return;
  }
  const [a] = await db.select().from(articles).where(eq(articles.id, job.articleId));
  const idx = meili().index(INDEX_ARTICLES);
  // Talk pages and redirects are not search results.
  if (!a || !a.currentRevisionId || a.namespace === "talk" || a.redirectToSlug) {
    await idx.deleteDocument(job.articleId).catch(() => {});
    return;
  }
  const [rev] = await db.select({ content: revisions.content }).from(revisions).where(eq(revisions.id, a.currentRevisionId));
  const cats = await db.select({ title: categories.title }).from(articleCategories)
    .innerJoin(categories, eq(categories.id, articleCategories.categoryId))
    .where(eq(articleCategories.articleId, a.id));
  const text = toPlainText(rev?.content ?? "");
  const doc: ArticleDoc = {
    id: a.id, title: a.title, slug: a.slug, namespace: a.namespace,
    excerpt: text.slice(0, 280), body: text.slice(0, 40_000),
    categories: cats.map((c) => c.title), featured: a.featured, updatedAt: a.updatedAt.getTime(),
  };
  await idx.addDocuments([doc]);
}
