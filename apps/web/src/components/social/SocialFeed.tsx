"use client";

import React, { useState, useEffect, useCallback } from "react";
import { YouTubePlayerCard } from "./YouTubePlayerCard";
import { GooglePhotosCard } from "./GooglePhotosCard";
import { CommentBox, CommentData } from "./CommentBox";
import { CreatePostModal } from "./CreatePostModal";

export interface SocialPostData {
  id: string;
  authorName: string;
  authorEmail: string;
  authorAvatar?: string | null;
  title?: string | null;
  content: string;
  mediaType: "none" | "youtube" | "google_photos" | "external";
  youtubeVideoId?: string | null;
  youtubeUrl?: string | null;
  googlePhotosUrl?: string | null;
  googlePhotosTitle?: string | null;
  likesCount: number;
  commentsCount: number;
  createdAt: string | Date;
  comments: CommentData[];
}

export function SocialFeed({ initialPosts = [] }: { initialPosts?: SocialPostData[] }) {
  const [posts, setPosts] = useState<SocialPostData[]>(initialPosts);
  const [filter, setFilter] = useState<"all" | "youtube" | "google_photos">("all");
  const [loading, setLoading] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/social/posts");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setPosts(json.data);
      }
    } catch (err) {
      console.error("Erro ao carregar feed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialPosts.length === 0) {
      fetchPosts();
    }
  }, [initialPosts, fetchPosts]);

  const filteredPosts = posts.filter((post) => {
    if (filter === "youtube") {
      return post.mediaType === "youtube" || !!post.youtubeVideoId;
    }
    if (filter === "google_photos") {
      return post.mediaType === "google_photos" || !!post.googlePhotosUrl;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Caixa de Criação de Post */}
      <CreatePostModal onPostCreated={fetchPosts} />

      {/* Barra de Filtros e Atualização */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800/80 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              filter === "all"
                ? "bg-blue-600 text-white shadow-md shadow-blue-900/30"
                : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white"
            }`}
          >
            🌟 Todas ({posts.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("youtube")}
            id="filter-youtube-btn"
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              filter === "youtube"
                ? "bg-red-600 text-white shadow-md shadow-red-900/30"
                : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white"
            }`}
          >
            <span>▶️</span>
            <span>Vídeos YouTube</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter("google_photos")}
            id="filter-photos-btn"
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              filter === "google_photos"
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white"
            }`}
          >
            <span>📷</span>
            <span>Google Fotos</span>
          </button>
        </div>

        <button
          type="button"
          onClick={fetchPosts}
          disabled={loading}
          className="text-xs text-neutral-400 hover:text-white transition-colors"
          title="Recarregar Feed"
        >
          {loading ? "A atualizar..." : "🔄 Atualizar"}
        </button>
      </div>

      {/* Lista de Publicações */}
      <div className="space-y-6" data-testid="social-feed-list">
        {filteredPosts.length === 0 ? (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-8 text-center">
            <p className="text-sm text-neutral-400">
              Nenhuma publicação encontrada para este filtro.
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const dateStr = typeof post.createdAt === "string"
              ? new Date(post.createdAt).toLocaleDateString("pt-PT", {
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "2-digit",
                  month: "short",
                })
              : "Hoje";

            const isOfficial = post.authorEmail === "mfstechsocial@gmail.com";

            return (
              <article
                key={post.id}
                data-testid="social-post-card"
                className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 p-5 shadow-xl transition-all hover:border-neutral-700/80"
              >
                {/* Cabeçalho do Post */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-md">
                      {post.authorName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{post.authorName}</span>
                        {isOfficial && (
                          <span className="rounded-full bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 text-[10px] font-bold text-blue-400">
                            Oficial
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-400">{dateStr}</p>
                    </div>
                  </div>

                  <span className="text-[11px] text-neutral-500 font-mono hidden sm:inline">
                    {post.authorEmail}
                  </span>
                </div>

                {/* Título (se houver) */}
                {post.title && (
                  <h3 className="text-base font-bold text-white mb-2 tracking-tight">
                    {post.title}
                  </h3>
                )}

                {/* Conteúdo textual */}
                <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-line mb-3">
                  {post.content}
                </p>

                {/* Vídeo do YouTube (Player interno + Botão externo) */}
                {post.youtubeVideoId && (
                  <YouTubePlayerCard
                    videoId={post.youtubeVideoId}
                    youtubeUrl={post.youtubeUrl}
                    title={post.title}
                  />
                )}

                {/* Google Fotos (Visualizador + Link direto) */}
                {post.googlePhotosUrl && (
                  <GooglePhotosCard
                    googlePhotosUrl={post.googlePhotosUrl}
                    title={post.googlePhotosTitle || post.title}
                  />
                )}

                {/* Sistema Interativo de Comentários */}
                <CommentBox postId={post.id} initialComments={post.comments} />
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
