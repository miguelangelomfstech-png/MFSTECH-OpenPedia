CREATE TYPE "public"."social_media_type" AS ENUM('none', 'youtube', 'google_photos', 'external');--> statement-breakpoint
CREATE TABLE "social_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"author_name" text DEFAULT 'Comunidade MFSTECH' NOT NULL,
	"author_email" text,
	"content" text NOT NULL,
	"likes_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_name" text DEFAULT 'MFSTECH Oficial' NOT NULL,
	"author_email" text DEFAULT 'mfstechsocial@gmail.com' NOT NULL,
	"author_avatar" text,
	"title" text,
	"content" text NOT NULL,
	"media_type" "social_media_type" DEFAULT 'none' NOT NULL,
	"youtube_video_id" text,
	"youtube_url" text,
	"google_photos_url" text,
	"google_photos_title" text,
	"likes_count" integer DEFAULT 0 NOT NULL,
	"comments_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "social_comments" ADD CONSTRAINT "social_comments_post_id_social_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."social_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "social_comments_post_idx" ON "social_comments" USING btree ("post_id","created_at");--> statement-breakpoint
CREATE INDEX "social_posts_created_idx" ON "social_posts" USING btree ("created_at");