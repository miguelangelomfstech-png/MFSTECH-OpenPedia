import {
  pgTable, pgEnum, uuid, text, integer, boolean, timestamp, real, primaryKey, index, uniqueIndex, type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["user", "admin", "bureaucrat"]);
export const namespaceEnum = pgEnum("namespace", ["main", "talk", "category"]);
export const protectionEnum = pgEnum("protection", ["none", "semi", "full"]);
export const mediaKindEnum = pgEnum("media_kind", ["image", "video"]);
export const mediaStatusEnum = pgEnum("media_status", ["pending", "processing", "ready", "failed"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  image: text("image"),
  role: roleEnum("role").notNull().default("user"),
  editCount: integer("edit_count").notNull().default(0),
  locale: text("locale").notNull().default("en"),
  blockedUntil: timestamp("blocked_until", { withTimezone: true }),
  blockReason: text("block_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const articles = pgTable(
  "articles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    namespace: namespaceEnum("namespace").notNull().default("main"),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    /** Not an FK to avoid a circular dependency with revisions. */
    currentRevisionId: uuid("current_revision_id"),
    /** Target slug (main namespace) when this page is a redirect. */
    redirectToSlug: text("redirect_to_slug"),
    protection: protectionEnum("protection").notNull().default("none"),
    featured: boolean("featured").notNull().default(false),
    featuredAt: timestamp("featured_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("articles_ns_slug_uq").on(t.namespace, t.slug),
    index("articles_updated_idx").on(t.updatedAt),
    index("articles_redirect_idx").on(t.redirectToSlug),
  ],
);

export const revisions = pgTable(
  "revisions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    articleId: uuid("article_id").notNull().references(() => articles.id, { onDelete: "cascade" }),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    /** Salted hash of the IP for anonymous edits (privacy-preserving, still bannable). */
    ipHash: text("ip_hash"),
    parentId: uuid("parent_id"),
    content: text("content").notNull(),
    summary: text("summary").notNull().default(""),
    size: integer("size").notNull(),
    isMinor: boolean("is_minor").notNull().default(false),
    isRevert: boolean("is_revert").notNull().default(false),
    flagged: text("flagged"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("revisions_article_created_idx").on(t.articleId, t.createdAt),
    index("revisions_author_idx").on(t.authorId, t.createdAt),
    index("revisions_created_idx").on(t.createdAt),
  ],
);

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  parentId: uuid("parent_id").references((): AnyPgColumn => categories.id, { onDelete: "set null" }),
});

export const articleCategories = pgTable(
  "article_categories",
  {
    articleId: uuid("article_id").notNull().references(() => articles.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.articleId, t.categoryId] }), index("ac_category_idx").on(t.categoryId)],
);

/** Outgoing internal links; powers red links, "What links here", and redirect resolution. */
export const pageLinks = pgTable(
  "page_links",
  {
    fromArticleId: uuid("from_article_id").notNull().references(() => articles.id, { onDelete: "cascade" }),
    toSlug: text("to_slug").notNull(),
  },
  (t) => [primaryKey({ columns: [t.fromArticleId, t.toSlug] }), index("page_links_to_idx").on(t.toSlug)],
);

export const media = pgTable(
  "media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    uploaderId: uuid("uploader_id").references(() => users.id, { onDelete: "set null" }),
    kind: mediaKindEnum("kind").notNull(),
    /** File name shown to editors, e.g. "Eiffel_Tower.jpg". Used as [[File:...]] target. */
    filename: text("filename").notNull(),
    slug: text("slug").notNull().unique(),
    originalKey: text("original_key").notNull(),
    mimeType: text("mime_type").notNull(),
    size: integer("size").notNull(),
    width: integer("width"),
    height: integer("height"),
    durationSec: real("duration_sec"),
    status: mediaStatusEnum("status").notNull().default("pending"),
    error: text("error"),
    description: text("description").notNull().default(""),
    altText: text("alt_text").notNull().default(""),
    license: text("license").notNull().default("unspecified"),
    source: text("source").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("media_status_idx").on(t.status), index("media_created_idx").on(t.createdAt)],
);

export const mediaRenditions = pgTable(
  "media_renditions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    mediaId: uuid("media_id").notNull().references(() => media.id, { onDelete: "cascade" }),
    /** '360p' | '720p' | '1080p' | 'thumb-400' | 'webp-800' | 'webp-1600' | 'poster' */
    label: text("label").notNull(),
    key: text("key").notNull(),
    mimeType: text("mime_type").notNull(),
    width: integer("width"),
    height: integer("height"),
    size: integer("size").notNull().default(0),
  },
  (t) => [uniqueIndex("renditions_media_label_uq").on(t.mediaId, t.label)],
);

export const watchlist = pgTable(
  "watchlist",
  {
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    articleId: uuid("article_id").notNull().references(() => articles.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.articleId] })],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    articleId: uuid("article_id").references(() => articles.id, { onDelete: "cascade" }),
    revisionId: uuid("revision_id"),
    message: text("message").notNull(),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notifications_user_idx").on(t.userId, t.read, t.createdAt)],
);

export const articlesRelations = relations(articles, ({ many }) => ({ revisions: many(revisions) }));
export const revisionsRelations = relations(revisions, ({ one }) => ({
  article: one(articles, { fields: [revisions.articleId], references: [articles.id] }),
  author: one(users, { fields: [revisions.authorId], references: [users.id] }),
}));
export const mediaRelations = relations(media, ({ many }) => ({ renditions: many(mediaRenditions) }));
export const renditionsRelations = relations(mediaRenditions, ({ one }) => ({
  media: one(media, { fields: [mediaRenditions.mediaId], references: [media.id] }),
}));

export type User = typeof users.$inferSelect;
export type Article = typeof articles.$inferSelect;
export type Revision = typeof revisions.$inferSelect;
export type Media = typeof media.$inferSelect;
export type MediaRendition = typeof mediaRenditions.$inferSelect;
