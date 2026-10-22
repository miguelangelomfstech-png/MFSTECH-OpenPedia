"use client";

import React, { useState, useEffect } from "react";
import { dict, type Locale } from "@/lib/i18n-config";
import { isDirectImageUrl, normalizePhotoUrl } from "@/lib/social-media";

interface GooglePhotosCardProps {
  googlePhotosUrl: string;
  title?: string | null;
  currentLocale?: Locale;
}

export function GooglePhotosCard({
  googlePhotosUrl,
  title = "Álbum no Google Fotos",
  currentLocale = "pt",
}: GooglePhotosCardProps) {
  const t = dict[currentLocale] || dict.pt;
  const normalizedUrl = normalizePhotoUrl(googlePhotosUrl);
  const isDirect = isDirectImageUrl(normalizedUrl);

  const [resolvedPhotos, setResolvedPhotos] = useState<string[]>(isDirect ? [normalizedUrl] : []);
  const [resolvedTitle, setResolvedTitle] = useState<string | null>(title || null);
  const [loading, setLoading] = useState<boolean>(!isDirect);
  const [imageError, setImageError] = useState<boolean>(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Se for um link de álbum do Google Fotos, tenta resolver fotos públicas da página
  useEffect(() => {
    if (isDirect) {
      setResolvedPhotos([normalizedUrl]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    async function fetchAlbumPhotos() {
      try {
        setLoading(true);
        const res = await fetch(`/api/social/resolve-photos?url=${encodeURIComponent(googlePhotosUrl)}`);
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.success && json.data) {
            if (json.data.photos && json.data.photos.length > 0) {
              setResolvedPhotos(json.data.photos);
            }
            if (json.data.title && !title) {
              setResolvedTitle(json.data.title);
            }
          }
        }
      } catch (err) {
        console.warn("Failed to fetch album photos:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchAlbumPhotos();

    return () => {
      isMounted = false;
    };
  }, [googlePhotosUrl, isDirect, normalizedUrl, title]);

  return (
    <>
      <div
        data-testid="google-photos-card"
        className="my-3 overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/80 p-4 shadow-xl backdrop-blur-md transition-all hover:border-neutral-700/80"
      >
        {/* Cabeçalho do Card */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 text-lg shadow-sm">
              📷
            </div>
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <span>{resolvedTitle || t.socialGooglePhotos}</span>
                {isDirect && (
                  <span className="rounded-md bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-blue-400">
                    {t.socialDirectPhoto}
                  </span>
                )}
              </h4>
              <p className="text-[11px] text-neutral-400">
                {isDirect
                  ? "Fotografia integrada em alta resolução"
                  : "Galeria de fotografias sincronizada com o Google Fotos"}
              </p>
            </div>
          </div>

          {/* Link Direto para o Google Fotos ou Foto Original */}
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

        {/* Exibição da Foto ou Galeria */}
        <div className="mt-3.5">
          {/* Caso 1: Foto Direta / Foto Única */}
          {resolvedPhotos.length === 1 && !imageError && (
            <div
              onClick={() => setLightboxIndex(0)}
              className="relative group overflow-hidden rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center cursor-pointer"
            >
              <img
                src={resolvedPhotos[0]}
                alt={resolvedTitle || "Foto MFSTECH SOCIAL"}
                className="max-h-[500px] w-full object-contain cursor-pointer transition-transform duration-300 group-hover:scale-[1.01]"
                loading="lazy"
                onError={() => setImageError(true)}
              />
              <div
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none"
              >
                <span className="rounded-xl bg-neutral-900/90 border border-neutral-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xl backdrop-blur-sm flex items-center gap-1.5">
                  🔍 {t.socialViewFullPhoto}
                </span>
              </div>
            </div>
          )}

          {/* Caso 2: Múltiplas Fotos Resolvidas do Álbum */}
          {resolvedPhotos.length > 1 && !imageError && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {resolvedPhotos.slice(0, 6).map((imgUrl, idx) => (
                  <div
                    key={idx}
                    onClick={() => setLightboxIndex(idx)}
                    className="relative aspect-[4/3] rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 cursor-pointer group"
                  >
                    <img
                      src={imgUrl}
                      alt={`Foto ${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-base">🔍</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-neutral-400 text-center">
                Mostrando {Math.min(resolvedPhotos.length, 6)} fotografias do álbum. Clique para ampliar ou aceda ao álbum completo acima.
              </p>
            </div>
          )}

          {/* Caso 3: Carregando fotos do álbum */}
          {loading && resolvedPhotos.length === 0 && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-2 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              <p className="text-xs text-neutral-400">A carregar fotos do Google Fotos...</p>
            </div>
          )}

          {/* Caso 4: Álbum sem pré-visualização direta extraível ou erro */}
          {!loading && (resolvedPhotos.length === 0 || imageError) && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-neutral-800/80 border border-neutral-700/60 flex flex-col items-center justify-center text-center p-3 group">
                <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">🖼️</div>
                <span className="text-[11px] font-medium text-neutral-300">Fotografias em Alta Resolução</span>
              </div>
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-neutral-800/80 border border-neutral-700/60 flex flex-col items-center justify-center text-center p-3 group">
                <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">✨</div>
                <span className="text-[11px] font-medium text-neutral-300">Álbum Compartilhado</span>
              </div>
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-neutral-800/80 border border-neutral-700/60 col-span-2 sm:col-span-1 flex flex-col items-center justify-center text-center p-3 group">
                <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">📲</div>
                <span className="text-[11px] font-medium text-neutral-300">Acesso Mobile e Desktop</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Lightbox / Zoom em Ecrã Inteiro */}
      {lightboxIndex !== null && resolvedPhotos[lightboxIndex] && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-fadeIn"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botão de Fechar */}
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="absolute -top-10 right-0 rounded-full bg-neutral-800/90 text-white p-2 hover:bg-neutral-700 transition-colors shadow-lg"
              title="Fechar"
            >
              ✕
            </button>

            {/* Imagem em tamanho amplo */}
            <img
              src={resolvedPhotos[lightboxIndex]}
              alt="Ampliação"
              className="max-h-[80vh] max-w-full rounded-2xl object-contain shadow-2xl border border-neutral-800"
            />

            {/* Rodapé com Navegação se houver mais de uma */}
            <div className="mt-3 flex items-center justify-between w-full px-2 text-xs text-neutral-400">
              <span>{resolvedTitle || t.socialGooglePhotos}</span>
              <div className="flex items-center gap-3">
                {resolvedPhotos.length > 1 && (
                  <span>
                    {lightboxIndex + 1} de {resolvedPhotos.length}
                  </span>
                )}
                <a
                  href={googlePhotosUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-blue-600 px-3 py-1 font-bold text-white hover:bg-blue-500 transition-colors"
                >
                  {t.socialOpenGooglePhotos}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
