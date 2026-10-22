import React from "react";
import { db, socialPosts, socialComments, desc } from "@wiki/db";
import { SocialFeed } from "@/components/social/SocialFeed";
import { getLocale } from "@/lib/i18n";
import { dict } from "@/lib/i18n-config";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export default async function SocialPage() {
  const locale = await getLocale();
  const { user, actor } = await getViewer();
  const isAdmin = actor.role === "admin" || actor.role === "bureaucrat" || user?.email === "mfstechsocial@gmail.com";

  const userSummary = user
    ? {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image ?? null,
      }
    : null;

  const t = dict[locale] || dict.pt;

  let initialPosts: any[] = [];

  try {
    const posts = await db
      .select()
      .from(socialPosts)
      .orderBy(desc(socialPosts.createdAt));

    const comments = await db
      .select()
      .from(socialComments)
      .orderBy(desc(socialComments.createdAt));

    const commentsByPost = comments.reduce<Record<string, typeof comments>>((acc, comment) => {
      acc[comment.postId] = acc[comment.postId] || [];
      acc[comment.postId].push(comment);
      return acc;
    }, {});

    initialPosts = posts.map((post) => ({
      ...post,
      comments: commentsByPost[post.id] || [],
    }));
  } catch (err) {
    console.error("Erro ao carregar posts iniciais:", err);
  }

  return (
    <div className="space-y-8">
      {/* Hero Banner do MFSTECH SOCIAL */}
      <section className="relative overflow-hidden rounded-3xl border border-neutral-800 bg-gradient-to-b from-neutral-900/90 via-neutral-900/50 to-neutral-950 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-xs font-bold text-blue-400">
            <span>🚀 {t.socialBadge}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {t.socialHeroTitle}
          </h1>
          <p className="text-sm text-neutral-300 leading-relaxed">
            {t.socialHeroDesc}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-neutral-400">
            <span className="flex items-center gap-1.5">
              <span className="text-red-500">▶</span> {t.socialYouTubeVideos}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-blue-400">📷</span> {t.socialGooglePhotos}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-green-400">💬</span> {t.socialComments}
            </span>
          </div>
        </div>
      </section>

      {/* Feed Principal com Suporte a Controlo de Conta e Moderação Admin */}
      <section>
        <SocialFeed
          initialPosts={initialPosts}
          currentLocale={locale}
          currentUser={userSummary}
          isAdmin={isAdmin}
        />
      </section>
    </div>
  );
}

