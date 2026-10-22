"use client";

import React, { useState } from "react";
import { extractYouTubeVideoId, isGooglePhotosUrl, isYouTubeUrl } from "@/lib/social-media";

interface CreatePostModalProps {
  onPostCreated?: () => void;
}

export function CreatePostModal({ onPostCreated }: CreatePostModalProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectedYouTubeId = isYouTubeUrl(mediaUrl) ? extractYouTubeVideoId(mediaUrl) : null;
  const detectedGooglePhotos = isGooglePhotosUrl(mediaUrl);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || null,
          content: content.trim(),
          mediaUrl: mediaUrl.trim() || null,
          authorName: authorName.trim() || "Utilizador MFSTECH",
          authorEmail: "mfstechsocial@gmail.com",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Erro ao criar publicação.");
      }

      setTitle("");
      setContent("");
      setMediaUrl("");
      setOpen(false);

      if (onPostCreated) {
        onPostCreated();
      }
    } catch (err: any) {
      setError(err.message || "Não foi possível criar a publicação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Botão de Disparo / Caixa Rápida de Publicação */}
      <div className="mb-6 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 font-bold border border-blue-500/20">
            ✍️
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            id="open-create-post-btn"
            className="flex-1 rounded-xl border border-neutral-800 bg-neutral-950/80 px-4 py-2.5 text-left text-sm text-neutral-400 hover:border-neutral-700 hover:text-neutral-300 transition-all shadow-inner"
          >
            Partilhe um pensamento, link do YouTube ou Google Fotos...
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-xs font-bold text-white transition-all shadow-md hover:shadow-blue-900/30 active:scale-95 shrink-0"
          >
            Publicar
          </button>
        </div>
      </div>

      {/* Modal de Criação */}
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fadeIn">
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl space-y-4"
          >
            {/* Cabeçalho do Modal */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">✨</span>
                <h3 className="text-base font-bold text-white">
                  Nova Publicação no MFSTECH SOCIAL
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
                title="Fechar"
              >
                ✕
              </button>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Nome do Autor */}
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">
                  Seu Nome ou Pseudónimo
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Ex.: Miguel Ângelo"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Título da Publicação */}
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">
                  Título da Publicação (Opcional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex.: Novidades de Engenharia de Software"
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Conteúdo / Mensagem */}
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">
                  Mensagem / Descrição <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="O que gostaria de partilhar com a comunidade?"
                  rows={4}
                  required
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Campo para Link de Mídia (YouTube ou Google Fotos) */}
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">
                  Link Multimédia (YouTube ou Google Fotos)
                </label>
                <input
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="Cole aqui o link do vídeo do YouTube ou álbum do Google Fotos..."
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Indicador de Pré-visualização Detectada */}
              {detectedYouTubeId && (
                <div className="flex items-center gap-2 rounded-xl bg-red-600/10 border border-red-500/20 p-2.5 text-xs text-red-400">
                  <span>▶️</span>
                  <span>Vídeo do YouTube detectado! Será executado dentro da publicação com link direto.</span>
                </div>
              )}

              {detectedGooglePhotos && (
                <div className="flex items-center gap-2 rounded-xl bg-blue-600/10 border border-blue-500/20 p-2.5 text-xs text-blue-400">
                  <span>📷</span>
                  <span>Link do Google Fotos detectado! Será integrado na publicação.</span>
                </div>
              )}

              {error && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2 rounded-lg">
                  {error}
                </p>
              )}

              {/* Botões de Ação */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-neutral-800 px-4 py-2 text-xs font-medium text-neutral-400 hover:bg-neutral-900 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !content.trim()}
                  className="rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2 text-xs font-bold text-white transition-all shadow-md hover:shadow-blue-900/30 active:scale-95 disabled:opacity-50"
                >
                  {loading ? "A publicar..." : "Publicar Agora"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
