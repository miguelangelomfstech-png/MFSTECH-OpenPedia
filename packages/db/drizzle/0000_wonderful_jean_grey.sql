CREATE TYPE "public"."media_kind" AS ENUM('image', 'video');--> statement-breakpoint
CREATE TYPE "public"."media_status" AS ENUM('pending', 'processing', 'ready', 'failed');--> statement-breakpoint
CREATE TYPE "public"."namespace" AS ENUM('main', 'talk', 'category');--> statement-breakpoint
CREATE TYPE "public"."protection" AS ENUM('none', 'semi', 'full');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin', 'bureaucrat');--> statement-breakpoint
CREATE TABLE "article_categories" (
	"article_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	CONSTRAINT "article_categories_article_id_category_id_pk" PRIMARY KEY("article_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"namespace" "namespace" DEFAULT 'main' NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"current_revision_id" uuid,
	"redirect_to_slug" text,
	"protection" "protection" DEFAULT 'none' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"featured_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"parent_id" uuid,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"uploader_id" uuid,
	"kind" "media_kind" NOT NULL,
	"filename" text NOT NULL,
	"slug" text NOT NULL,
	"original_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" integer NOT NULL,
	"width" integer,
	"height" integer,
	"duration_sec" real,
	"status" "media_status" DEFAULT 'pending' NOT NULL,
	"error" text,
	"description" text DEFAULT '' NOT NULL,
	"alt_text" text DEFAULT '' NOT NULL,
	"license" text DEFAULT 'unspecified' NOT NULL,
	"source" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "media_renditions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"media_id" uuid NOT NULL,
	"label" text NOT NULL,
	"key" text NOT NULL,
	"mime_type" text NOT NULL,
	"width" integer,
	"height" integer,
	"size" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"article_id" uuid,
	"revision_id" uuid,
	"message" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "page_links" (
	"from_article_id" uuid NOT NULL,
	"to_slug" text NOT NULL,
	CONSTRAINT "page_links_from_article_id_to_slug_pk" PRIMARY KEY("from_article_id","to_slug")
);
--> statement-breakpoint
CREATE TABLE "revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" uuid NOT NULL,
	"author_id" uuid,
	"ip_hash" text,
	"parent_id" uuid,
	"content" text NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"size" integer NOT NULL,
	"is_minor" boolean DEFAULT false NOT NULL,
	"is_revert" boolean DEFAULT false NOT NULL,
	"flagged" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"image" text,
	"role" "role" DEFAULT 'user' NOT NULL,
	"edit_count" integer DEFAULT 0 NOT NULL,
	"locale" text DEFAULT 'en' NOT NULL,
	"blocked_until" timestamp with time zone,
	"block_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_name_unique" UNIQUE("name"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "watchlist" (
	"user_id" uuid NOT NULL,
	"article_id" uuid NOT NULL,
	CONSTRAINT "watchlist_user_id_article_id_pk" PRIMARY KEY("user_id","article_id")
);
--> statement-breakpoint
ALTER TABLE "article_categories" ADD CONSTRAINT "article_categories_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_categories" ADD CONSTRAINT "article_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_uploader_id_users_id_fk" FOREIGN KEY ("uploader_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_renditions" ADD CONSTRAINT "media_renditions_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_links" ADD CONSTRAINT "page_links_from_article_id_articles_id_fk" FOREIGN KEY ("from_article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revisions" ADD CONSTRAINT "revisions_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revisions" ADD CONSTRAINT "revisions_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlist" ADD CONSTRAINT "watchlist_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlist" ADD CONSTRAINT "watchlist_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ac_category_idx" ON "article_categories" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "articles_ns_slug_uq" ON "articles" USING btree ("namespace","slug");--> statement-breakpoint
CREATE INDEX "articles_updated_idx" ON "articles" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "articles_redirect_idx" ON "articles" USING btree ("redirect_to_slug");--> statement-breakpoint
CREATE INDEX "media_status_idx" ON "media" USING btree ("status");--> statement-breakpoint
CREATE INDEX "media_created_idx" ON "media" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "renditions_media_label_uq" ON "media_renditions" USING btree ("media_id","label");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id","read","created_at");--> statement-breakpoint
CREATE INDEX "page_links_to_idx" ON "page_links" USING btree ("to_slug");--> statement-breakpoint
CREATE INDEX "revisions_article_created_idx" ON "revisions" USING btree ("article_id","created_at");--> statement-breakpoint
CREATE INDEX "revisions_author_idx" ON "revisions" USING btree ("author_id","created_at");--> statement-breakpoint
CREATE INDEX "revisions_created_idx" ON "revisions" USING btree ("created_at");