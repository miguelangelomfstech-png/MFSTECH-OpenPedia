"use client";

import React, { useState, useEffect, useCallback } from "react";
import { YouTubePlayerCard } from "./YouTubePlayerCard";
import { GooglePhotosCard } from "./GooglePhotosCard";
import { VideoPlayerCard } from "./VideoPlayerCard";
import { CommentBox, CommentData } from "./CommentBox";
import { CreatePostModal } from "./CreatePostModal";
import { dict, type Locale } from "@/lib/i18n-config";
import { isVideoUrl } from "@/lib/social-media";

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

interface SocialFeedProps {
  initialPosts?: SocialPostData[];
  currentLocale?: Locale;
  currentUser?: { id?: string; name?: string | null; email?: string | null; role?: string | null } | null;
  isAdmin?: boolean;
}

export function SocialFeed({
  initialPosts = [],
  currentLocale = "pt",
  currentUser,
  isAdmin = false,
}: SocialFeedProps) {
  const [posts, setPosts] = useState<SocialPostData[]>(initialPosts);
  const [filter, setFilter] = useState<"all" | "youtube" | "google_photos" | "videos">("all");
  const [loading, setLoading] = useState(false);

  const t = dict[currentLocale] || dict.pt;

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

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm(t.socialConfirmDeletePost)) return;
    try {
      const res = await fetch(`/api/social/posts?id=${postId}`, { method: "DELETE" });
      const json = await res.json();
      if (res.ok && json.success) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      } else {
        alert(json.error || "Erro ao remover publicação.");
      }
    } catch (err) {
      console.error("Erro ao remover post:", err);
    }
  };

  const handlePostCreated = (newPost?: SocialPostData) => {
    if (newPost) {
      setPosts((prev) => [newPost, ...prev.filter((p) => p.id !== newPost.id)]);
    }
    fetchPosts();
  };

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
      return (post.mediaType === "google_photos" || !!post.googlePhotosUrl) && !isVideoUrl(post.googlePhotosUrl || "");
    }
    if (filter === "videos") {
      return post.mediaType === "external" || isVideoUrl(post.googlePhotosUrl || "") || post.mediaType === "youtube" || !!post.youtubeVideoId;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Caixa de Criação de Post */}
      <CreatePostModal onPostCreated={handlePostCreated} currentLocale={currentLocale} currentUser={currentUser} />

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
            🌟 {t.socialAll} ({posts.length})
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
            <span>{t.socialYouTubeVideos}</span>
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
            <span>{t.socialGooglePhotos}</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter("videos")}
            id="filter-videos-btn"
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              filter === "videos"
                ? "bg-purple-600 text-white shadow-md shadow-purple-900/30"
                : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white"
            }`}
          >
            <span>📹</span>
            <span>{t.socialDirectVideos}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={fetchPosts}
          disabled={loading}
          className="text-xs text-neutral-400 hover:text-white transition-colors"
          title="Recarregar Feed"
        >
          {loading ? "..." : "🔄 Atualizar"}
        </button>
      </div>

      {/* Lista de Publicações */}
      <div className="space-y-6" data-testid="social-feed-list">
        {filteredPosts.length === 0 ? (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-8 text-center">
            <p className="text-sm text-neutral-400">
              {t.noResults}
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const dateStr = typeof post.createdAt === "string"
              ? new Date(post.createdAt).toLocaleDateString(currentLocale === "en" ? "en-US" : "pt-PT", {
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "2-digit",
                  month: "short",
                })
              : "Hoje";

            const isOfficial = post.authorEmail === "mfstechsocial@gmail.com";
            const canDelete = isAdmin || (currentUser && currentUser.email?.toLowerCase() === post.authorEmail?.toLowerCase());

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

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-neutral-500 font-mono hidden sm:inline">
                      {post.authorEmail}
                    </span>
                    {canDelete && (
                      <button
                        type="button"
                        data-testid="delete-post-btn"
                        onClick={() => handleDeletePost(post.id)}
                        className="inline-flex items-center gap-1 rounded-xl border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-400 hover:bg-red-600 hover:text-white transition-all shadow-xs active:scale-95"
                        title={t.socialDeletePost}
                      >
                        <span>🗑️</span>
                        <span className="hidden sm:inline">{t.socialDeletePost}</span>
                      </button>
                    )}
                  </div>
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
                    currentLocale={currentLocale}
                  />
                )}

                {/* Vídeo Gravado / Direto (Player HTML5 Integrado) */}
                {post.googlePhotosUrl && isVideoUrl(post.googlePhotosUrl) && (
                  <VideoPlayerCard
                    videoUrl={post.googlePhotosUrl}
                    title={post.title}
                    currentLocale={currentLocale}
                  />
                )}

                {/* Google Fotos / Fotografia (Visualizador + Link direto) */}
                {post.googlePhotosUrl && !isVideoUrl(post.googlePhotosUrl) && (
                  <GooglePhotosCard
                    googlePhotosUrl={post.googlePhotosUrl}
                    title={post.googlePhotosTitle || post.title}
                    currentLocale={currentLocale}
                  />
                )}

                {/* Sistema Interativo de Comentários */}
                <CommentBox
                  postId={post.id}
                  initialComments={post.comments}
                  currentLocale={currentLocale}
                  currentUser={currentUser}
                  isAdmin={isAdmin}
                />
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
