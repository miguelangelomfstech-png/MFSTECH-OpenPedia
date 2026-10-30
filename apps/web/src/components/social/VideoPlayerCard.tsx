"use client";

import React from "react";
import { dict, type Locale } from "@/lib/i18n-config";

interface VideoPlayerCardProps {
  videoUrl: string;
  title?: string | null;
  currentLocale?: Locale;
}

export function VideoPlayerCard({
  videoUrl,
  title,
  currentLocale = "pt",
}: VideoPlayerCardProps) {
  const t = dict[currentLocale] || dict.pt;
  const isDataUrl = videoUrl.startsWith("data:video/");

  return (
    <div
      data-testid="video-player-card"
      className="my-3 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/80 p-3 sm:p-4 shadow-xl backdrop-blur-md transition-all hover:border-neutral-700/80"
    >
      {/* Cabeçalho do Card */}
      <div className="flex items-center justify-between gap-2.5 pb-2.5 mb-2.5 border-b border-neutral-800/80">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-sm shadow-sm">
            📹
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
              <span>{title || t.socialRecordedVideoTitle}</span>
              <span className="rounded-md bg-red-500/15 border border-red-500/30 px-1.5 py-0.5 text-[10px] font-semibold text-red-400">
                {isDataUrl ? "Gravação Direta" : "Vídeo HD"}
              </span>
            </h4>
            <p className="text-[10px] sm:text-[11px] text-neutral-400">
              {isDataUrl ? "Gravado com a câmara do utilizador" : "Reprodução de vídeo integrada"}
            </p>
          </div>
        </div>

        {/* Botão de Download / Abertura de Vídeo */}
        <a
          href={videoUrl}
          download={isDataUrl ? "video-mfstech.webm" : undefined}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="video-download-link"
          className="inline-flex items-center gap-1 rounded-lg border border-neutral-700/60 bg-neutral-800/80 hover:bg-neutral-700 px-2.5 py-1 text-[11px] font-semibold text-neutral-200 transition-colors shadow-sm"
          title="Guardar ou abrir vídeo"
        >
          <span>⬇️</span>
          <span className="hidden sm:inline">Descarregar</span>
        </a>
      </div>

      {/* Player de Vídeo HTML5 Responsivo */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-inner ring-1 ring-white/5 flex items-center justify-center">
        <video
          src={videoUrl}
          controls
          playsInline
          preload="metadata"
          data-testid="social-video-element"
          className="h-full w-full object-contain"
        />
      </div>

      {/* Barra de Status */}
      <div className="mt-2.5 flex items-center justify-between text-[11px] text-neutral-400 pt-1">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Pronto a reproduzir</span>
        </div>
        <span className="font-mono text-[10px] text-neutral-500">
          MFSTECH Media Player
        </span>
      </div>
    </div>
  );
}

