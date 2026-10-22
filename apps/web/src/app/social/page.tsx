import React from "react";
import { db, socialPosts, socialComments, desc } from "@wiki/db";
import { SocialFeed } from "@/components/social/SocialFeed";

export const dynamic = "force-dynamic";

export default async function SocialPage() {
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
            <span>🚀 Nova Plataforma de Mídia Social</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            MFSTECH SOCIAL
          </h1>
          <p className="text-sm text-neutral-300 leading-relaxed">
            A sua nova rede multimédia. Cole links do <strong>YouTube</strong> para assistir aos vídeos diretamente dentro do site com link externo opcional, integre álbuns de fotos do <strong>Google Fotos</strong> e participe com comentários em tempo real com o máximo profissionalismo.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-neutral-400">
            <span className="flex items-center gap-1.5">
              <span className="text-red-500">▶</span> Player YouTube Integrado
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-blue-400">📷</span> Google Fotos
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-green-400">💬</span> Comentários Interativos
            </span>
          </div>
        </div>
      </section>

      {/* Feed Principal */}
      <section>
        <SocialFeed initialPosts={initialPosts} />
      </section>
    </div>
  );
}
