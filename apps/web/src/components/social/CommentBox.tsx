"use client";

import React, { useState } from "react";

export interface CommentData {
  id: string;
  postId: string;
  authorName: string;
  authorEmail?: string | null;
  content: string;
  likesCount: number;
  createdAt: string | Date;
}

interface CommentBoxProps {
  postId: string;
  initialComments?: CommentData[];
}

export function CommentBox({ postId, initialComments = [] }: CommentBoxProps) {
  const [comments, setComments] = useState<CommentData[]>(initialComments);
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/social/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          content: content.trim(),
          authorName: authorName.trim() || "Membro da Comunidade",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Erro ao publicar comentário.");
      }

      setComments((prev) => [json.data, ...prev]);
      setContent("");
    } catch (err: any) {
      setError(err.message || "Não foi possível enviar o comentário.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const res = await fetch(`/api/social/comments?id=${commentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch {
      // Ignora erro
    }
  };

  return (
    <div className="mt-4 border-t border-neutral-800/80 pt-4" data-testid="comments-section">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
          Comentários ({comments.length})
        </h4>
        <span className="text-[11px] text-neutral-500">
          Participe da conversa
        </span>
      </div>

      {/* Formulário de Envio de Comentário */}
      <form onSubmit={handleSubmit} className="space-y-2 mb-4" data-testid="comment-form">
        <div className="flex gap-2">
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Seu nome (opcional)"
            className="w-1/3 rounded-xl border border-neutral-800 bg-neutral-900/90 px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escreva um comentário profissional..."
            required
            className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900/90 px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-bold text-white transition-all shadow-md hover:shadow-blue-900/30 active:scale-95 disabled:opacity-50 shrink-0"
          >
            {loading ? "A enviar..." : "Comentar"}
          </button>
        </div>

        {error && (
          <p className="text-[11px] text-red-400">{error}</p>
        )}
      </form>

      {/* Lista de Comentários */}
      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
        {comments.length === 0 ? (
          <p className="text-xs text-neutral-500 italic py-2">
            Ainda não há comentários. Seja o primeiro a comentar!
          </p>
        ) : (
          comments.map((comment) => {
            const dateStr = typeof comment.createdAt === "string" 
              ? new Date(comment.createdAt).toLocaleDateString("pt-PT", {
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "2-digit",
                  month: "short",
                })
              : "Agora mesmo";

            return (
              <div
                key={comment.id}
                className="group relative rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-3 hover:bg-neutral-900/70 transition-colors"
                data-testid="comment-item"
              >
                <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-neutral-200">{comment.authorName}</span>
                    <span>•</span>
                    <span className="text-neutral-500">{dateStr}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="opacity-0 group-hover:opacity-100 text-[10px] text-neutral-500 hover:text-red-400 transition-opacity"
                    title="Remover comentário"
                  >
                    Eliminar
                  </button>
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed break-words">
                  {comment.content}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
