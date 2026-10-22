"use client";

import React from "react";
import { dict, type Locale } from "@/lib/i18n-config";

interface GooglePhotosCardProps {
  googlePhotosUrl: string;
  title?: string | null;
  currentLocale?: Locale;
}

export function GooglePhotosCard({ googlePhotosUrl, title = "Álbum no Google Fotos", currentLocale = "pt" }: GooglePhotosCardProps) {
  const t = dict[currentLocale] || dict.pt;

  return (
    <div
      data-testid="google-photos-card"
      className="my-3 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 shadow-xl backdrop-blur-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 text-base">
            📷
          </div>
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight">
              {title || t.socialGooglePhotos}
            </h4>
            <p className="text-[11px] text-neutral-400">
              Galeria de fotografias sincronizada com o Google Fotos
            </p>
          </div>
        </div>

        {/* Link Direto para o Google Fotos */}
        <a
          href={googlePhotosUrl}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="google-photos-direct-link"
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-3.5 py-1.5 text-xs font-bold text-white transition-all shadow-md hover:shadow-blue-900/30 active:scale-95 shrink-0"
        >
          <span>{t.socialOpenGooglePhotos}</span>
        </a>
      </div>

      {/* Visualizador / Pré-visualização elegante de Galeria */}
      <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-neutral-800 border border-neutral-700/60 flex flex-col items-center justify-center text-center p-3 group">
          <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">🖼️</div>
          <span className="text-[11px] font-medium text-neutral-300">Fotografias em Alta Resolução</span>
        </div>
        <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-neutral-800 border border-neutral-700/60 flex flex-col items-center justify-center text-center p-3 group">
          <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">✨</div>
          <span className="text-[11px] font-medium text-neutral-300">Álbum Compartilhado</span>
        </div>
        <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-neutral-800 border border-neutral-700/60 col-span-2 sm:col-span-1 flex flex-col items-center justify-center text-center p-3 group">
          <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">📲</div>
          <span className="text-[11px] font-medium text-neutral-300">Acesso Mobile e Desktop</span>
        </div>
      </div>
    </div>
  );
}
