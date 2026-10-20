import {
  db,
  articles,
  revisions,
  categories,
  articleCategories,
  media,
  mediaRenditions,
  and,
  eq,
  or,
  ilike,
  desc,
  sql,
  inArray,
} from "@wiki/db";
import { meili, INDEX_ARTICLES, INDEX_MEDIA, toPlainText } from "@wiki/shared";

export type ArticleHit = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  categories: string[];
  _formatted?: { excerpt?: string };
};

export type MediaHit = {
  id?: string;
  title: string;
  slug: string;
  kind: string;
  thumbKey: string | null;
};

function hasRemoteMeilisearch(): boolean {
  const host = process.env.MEILI_HOST ?? "";
  if (!host) return false;
  return !host.includes("localhost") && !host.includes("127.0.0.1");
}

function shouldTryMeili(): boolean {
  if (hasRemoteMeilisearch()) return true;
  // If running locally in development and not in Vercel serverless, allow trying localhost
  return !process.env.VERCEL && process.env.NODE_ENV !== "production";
}

async function withTimeout<T>(promise: Promise<T>, ms = 1000): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("MeiliSearch timeout")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

function makeExcerpt(content: string | null, q: string): { excerpt: string; formatted: string } {
  if (!content) return { excerpt: "", formatted: "" };
  const plain = toPlainText(content);
  if (!plain) return { excerpt: "", formatted: "" };

  const qClean = q.trim().toLowerCase();
  const plainLower = plain.toLowerCase();
  const idx = plainLower.indexOf(qClean);

  let raw = "";
  if (idx !== -1) {
    const start = Math.max(0, idx - 40);
    const end = Math.min(plain.length, idx + qClean.length + 80);
    raw = (start > 0 ? "... " : "") + plain.slice(start, end).trim() + (end < plain.length ? " ..." : "");
  } else {
    raw = plain.slice(0, 140) + (plain.length > 140 ? " ..." : "");
  }

  const escaped = qClean.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const formatted = escaped
    ? raw.replace(new RegExp(`(${escaped})`, "gi"), "<mark>$1</mark>")
    : raw;

  return { excerpt: raw, formatted };
}

export async function searchArticles(
  q: string,
  options: { limit?: number; namespace?: string } = {}
): Promise<{ hits: ArticleHit[]; total: number }> {
  const query = q.trim();
  if (!query) return { hits: [], total: 0 };
  const limit = options.limit ?? 25;
  const namespace = options.namespace ?? "main";

  // Try Meilisearch first if configured and responsive
  if (shouldTryMeili()) {
    try {
      const res = await withTimeout(
        meili().index(INDEX_ARTICLES).search(query, {
          limit,
          filter: `namespace = "${namespace}"`,
          attributesToHighlight: ["excerpt"],
          highlightPreTag: "<mark>",
          highlightPostTag: "</mark>",
          attributesToCrop: ["excerpt"],
          cropLength: 40,
        }),
        1000
      );
      return {
        hits: res.hits as ArticleHit[],
        total: res.estimatedTotalHits ?? res.hits.length,
      };
    } catch {
      // Meilisearch failed or timed out; seamlessly fall back to PostgreSQL database search
    }
  }

  // Database fallback search (PostgreSQL with full Unicode support)
  try {
    const term = `%${query}%`;
    const rows = await db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        namespace: articles.namespace,
        updatedAt: articles.updatedAt,
        content: revisions.content,
      })
      .from(articles)
      .leftJoin(revisions, eq(articles.currentRevisionId, revisions.id))
      .where(
        and(
          eq(articles.namespace, namespace as "main" | "talk" | "category"),
          or(
            ilike(articles.title, term),
            ilike(articles.slug, term),
            ilike(revisions.content, term)
          )
        )
      )
      .orderBy(
        sql`CASE 
          WHEN LOWER(${articles.title}) = LOWER(${query}) THEN 1
          WHEN LOWER(${articles.title}) LIKE LOWER(${term}) THEN 2
          ELSE 3
        END`,
        desc(articles.updatedAt)
      )
      .limit(limit);

    const articleIds = rows.map((r) => r.id);
    const categoryMap = new Map<string, string[]>();

    if (articleIds.length > 0) {
      try {
        const catRows = await db
          .select({
            articleId: articleCategories.articleId,
            categoryTitle: categories.title,
          })
          .from(articleCategories)
          .innerJoin(categories, eq(articleCategories.categoryId, categories.id))
          .where(inArray(articleCategories.articleId, articleIds));

        for (const c of catRows) {
          const list = categoryMap.get(c.articleId) ?? [];
          list.push(c.categoryTitle);
          categoryMap.set(c.articleId, list);
        }
      } catch {
        // category join fallback
      }
    }

    const hits: ArticleHit[] = rows.map((r) => {
      const { excerpt, formatted } = makeExcerpt(r.content, query);
      return {
        id: r.id,
        title: r.title,
        slug: r.slug,
        excerpt,
        categories: categoryMap.get(r.id) ?? [],
        _formatted: { excerpt: formatted },
      };
    });

    return { hits, total: hits.length };
  } catch (err) {
    console.error("Database search failed:", err);
    throw err;
  }
}

export async function searchMedia(
  q: string,
  options: { limit?: number } = {}
): Promise<{ hits: MediaHit[]; total: number }> {
  const query = q.trim();
  if (!query) return { hits: [], total: 0 };
  const limit = options.limit ?? 36;

  // Try Meilisearch first if configured
  if (shouldTryMeili()) {
    try {
      const res = await withTimeout(
        meili().index(INDEX_MEDIA).search(query, { limit }),
        1000
      );
      return {
        hits: res.hits as MediaHit[],
        total: res.estimatedTotalHits ?? res.hits.length,
      };
    } catch {
      // Meilisearch failed or timed out; fall back to PostgreSQL
    }
  }

  // Database fallback search
  try {
    const term = `%${query}%`;
    const mediaRows = await db
      .select({
        id: media.id,
        title: media.filename,
        slug: media.slug,
        kind: media.kind,
        originalKey: media.originalKey,
        description: media.description,
      })
      .from(media)
      .where(
        or(
          ilike(media.filename, term),
          ilike(media.slug, term),
          ilike(media.description, term)
        )
      )
      .orderBy(desc(media.createdAt))
      .limit(limit);

    const mediaIds = mediaRows.map((m) => m.id);
    const renditionMap = new Map<string, string>();

    if (mediaIds.length > 0) {
      try {
        const rendRows = await db
          .select({
            mediaId: mediaRenditions.mediaId,
            key: mediaRenditions.key,
            label: mediaRenditions.label,
          })
          .from(mediaRenditions)
          .where(
            and(
              inArray(mediaRenditions.mediaId, mediaIds),
              or(eq(mediaRenditions.label, "thumb-400"), eq(mediaRenditions.label, "poster"))
            )
          );

        for (const row of rendRows) {
          renditionMap.set(row.mediaId, row.key);
        }
      } catch {
        // rendition join fallback
      }
    }

    const hits: MediaHit[] = mediaRows.map((m) => ({
      id: m.id,
      title: m.title,
      slug: m.slug,
      kind: m.kind,
      thumbKey: renditionMap.get(m.id) ?? m.originalKey ?? null,
    }));

    return { hits, total: hits.length };
  } catch (err) {
    console.error("Database media search failed:", err);
    throw err;
  }
}

export async function searchSuggest(
  q: string,
  limit = 6
): Promise<{ title: string; slug: string; excerpt: string }[]> {
  try {
    const { hits } = await searchArticles(q, { limit, namespace: "main" });
    return hits.map((h) => ({
      title: h.title,
      slug: h.slug,
      excerpt: h.excerpt,
    }));
  } catch {
    return [];
  }
}
