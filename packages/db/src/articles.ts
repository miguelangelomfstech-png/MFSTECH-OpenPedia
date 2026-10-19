import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "./client";
import {
  articles, revisions, categories, articleCategories, pageLinks, users, watchlist, notifications,
} from "./schema";
import { enqueueSearch, normalizeTitle, parseMeta, slugify, type Namespace } from "@wiki/shared";

export type Protection = "none" | "semi" | "full";
export type Actor = {
  userId: string | null;
  role: "anon" | "user" | "admin" | "bureaucrat";
  autoconfirmed: boolean;
  blocked: boolean;
  ipHash: string | null;
};

export class EditError extends Error {
  constructor(public code: "forbidden" | "blocked" | "conflict" | "invalid" | "vandalism", message: string) {
    super(message);
  }
}

export const isAdmin = (a: Actor) => a.role === "admin" || a.role === "bureaucrat";

export function isAutoconfirmed(u: { createdAt: Date; editCount: number }) {
  return Date.now() - u.createdAt.getTime() > 4 * 86400_000 && u.editCount >= 10;
}

export function canEdit(a: Actor, protection: Protection) {
  if (a.blocked) return false;
  if (protection === "full") return isAdmin(a);
  if (protection === "semi") return a.role !== "anon" && (a.autoconfirmed || isAdmin(a));
  return true;
}

export type SaveInput = {
  namespace: Namespace;
  title: string;
  content: string;
  summary?: string;
  minor?: boolean;
  isRevert?: boolean;
  /** Revision the editor started from; enables edit-conflict detection. */
  baseRevisionId?: string | null;
  actor: Actor;
};

const MAX_BYTES = 2_000_000;

function vandalismCheck(prev: string | null, next: string, actor: Actor) {
  if (actor.autoconfirmed || isAdmin(actor)) return null;
  if (prev && prev.length > 500 && next.length < prev.length * 0.1) return "blanking";
  const links = (s: string) => (s.match(/https?:\/\//g) ?? []).length;
  if (links(next) - (prev ? links(prev) : 0) > 8) return "link-spam";
  return null;
}

/** The single write path for article content. Everything derived is updated transactionally. */
export async function saveRevision(input: SaveInput) {
  const { actor } = input;
  const title = normalizeTitle(input.title);
  const slug = slugify(title);
  const content = input.content.replace(/\r\n/g, "\n");
  if (!slug || title.length > 200) throw new EditError("invalid", "Invalid title.");
  if (!content.trim()) throw new EditError("invalid", "Content cannot be empty.");
  if (Buffer.byteLength(content) > MAX_BYTES) throw new EditError("invalid", "Content is too large.");
  if (actor.blocked) throw new EditError("blocked", "Your account or address is blocked from editing.");

  const meta = parseMeta(content);

  const result = await db.transaction(async (tx) => {
    let [article] = await tx.select().from(articles)
      .where(and(eq(articles.namespace, input.namespace), eq(articles.slug, slug))).for("update");
    const created = !article;
    if (article && !canEdit(actor, article.protection)) {
      throw new EditError("forbidden", `This page is ${article.protection}-protected.`);
    }
    let prev: string | null = null;
    if (article?.currentRevisionId) {
      if (input.baseRevisionId && input.baseRevisionId !== article.currentRevisionId) {
        throw new EditError("conflict", "Someone else edited this page while you were editing.");
      }
      const [r] = await tx.select({ content: revisions.content }).from(revisions)
        .where(eq(revisions.id, article.currentRevisionId));
      prev = r?.content ?? null;
      if (prev === content) throw new EditError("invalid", "No changes were made.");
    }
    const flag = vandalismCheck(prev, content, actor);
    if (flag) throw new EditError("vandalism", `Edit rejected by anti-abuse filter (${flag}). Register or build up your history to make this change.`);

    if (!article) {
      [article] = await tx.insert(articles).values({ namespace: input.namespace, title, slug }).returning();
    }
    const [rev] = await tx.insert(revisions).values({
      articleId: article.id,
      authorId: actor.userId,
      ipHash: actor.userId ? null : actor.ipHash,
      parentId: article.currentRevisionId,
      content,
      summary: (input.summary ?? "").slice(0, 500),
      size: Buffer.byteLength(content),
      isMinor: !!input.minor,
      isRevert: !!input.isRevert,
    }).returning();

    await tx.update(articles).set({
      currentRevisionId: rev.id,
      redirectToSlug: input.namespace === "main" ? meta.redirect : null,
      updatedAt: new Date(),
    }).where(eq(articles.id, article.id));

    await tx.delete(pageLinks).where(eq(pageLinks.fromArticleId, article.id));
    if (meta.links.length) {
      await tx.insert(pageLinks).values(meta.links.map((toSlug) => ({ fromArticleId: article!.id, toSlug })))
        .onConflictDoNothing();
    }

    // Categories: create on first use, then (re)attach.
    const wanted = [...meta.categories];
    if (input.namespace === "category") wanted.push({ slug, title });
    const catIds = new Map<string, string>();
    for (const c of wanted) {
      await tx.insert(categories).values({ slug: c.slug, title: c.title }).onConflictDoNothing();
      const [row] = await tx.select({ id: categories.id }).from(categories).where(eq(categories.slug, c.slug));
      catIds.set(c.slug, row.id);
    }
    await tx.delete(articleCategories).where(eq(articleCategories.articleId, article.id));
    const attach = meta.categories.map((c) => ({ articleId: article!.id, categoryId: catIds.get(c.slug)! }));
    if (attach.length) await tx.insert(articleCategories).values(attach).onConflictDoNothing();

    // A category page's own [[Category:Parent]] defines the hierarchy.
    if (input.namespace === "category") {
      const parent = meta.categories.find((c) => c.slug !== slug);
      await tx.update(categories).set({ parentId: parent ? catIds.get(parent.slug)! : null })
        .where(eq(categories.id, catIds.get(slug)!));
    }

    if (actor.userId) {
      await tx.update(users).set({ editCount: sql`${users.editCount} + 1` }).where(eq(users.id, actor.userId));
    }

    if (!created) {
      const watchers = await tx.select({ userId: watchlist.userId }).from(watchlist)
        .where(and(eq(watchlist.articleId, article.id), ne(watchlist.userId, actor.userId ?? "00000000-0000-0000-0000-000000000000")));
      if (watchers.length) {
        await tx.insert(notifications).values(watchers.map((w) => ({
          userId: w.userId, type: "watch-edit", articleId: article!.id, revisionId: rev.id,
          message: `"${title}" was edited${input.summary ? `: ${input.summary.slice(0, 120)}` : ""}`,
        })));
      }
    }
    return { articleId: article.id, revisionId: rev.id, created, slug, title };
  });

  enqueueSearch({ type: "article", articleId: result.articleId }).catch((e) =>
    console.error("failed to enqueue search index", e));
  return result;
}
