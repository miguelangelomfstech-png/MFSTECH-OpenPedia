"use client";

import React from "react";
import { buildYouTubeWatchUrl } from "@/lib/social-media";
import { dict, type Locale } from "@/lib/i18n-config";

interface YouTubePlayerCardProps {
  videoId: string;
  youtubeUrl?: string | null;
  title?: string | null;
  currentLocale?: Locale;
}

export function YouTubePlayerCard({ videoId, youtubeUrl, title = "Vídeo do YouTube", currentLocale = "pt" }: YouTubePlayerCardProps) {
  const directWatchUrl = buildYouTubeWatchUrl(videoId, youtubeUrl);
  const t = dict[currentLocale] || dict.pt;

  return (
    <div
      data-testid="youtube-card"
      className="my-3 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/70 p-3 sm:p-4 shadow-xl backdrop-blur-sm"
    >
      {/* Player do YouTube Embutido (Execução Direta dentro do Site) */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-inner ring-1 ring-white/5">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=1`}
          title={title || "Player de Vídeo MFSTECH SOCIAL"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>

      {/* Barra de Ação e Link Direto para o YouTube */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5 pt-1">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-medium text-neutral-400">
            {t.socialPlayingDirectly}
          </span>
        </div>

        {/* Botão Direto para o YouTube */}
        <a
          href={directWatchUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="youtube-direct-link"
          className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-500 px-3.5 py-1.5 text-xs font-bold text-white transition-all shadow-md hover:shadow-red-900/30 active:scale-95 shrink-0"
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
          {t.socialWatchOnYouTube}
        </a>
      </div>
    </div>
  );
}
