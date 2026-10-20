"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { dict, type Locale } from "@/lib/i18n-config";

type Props = {
  currentLocale?: Locale;
  onInsert?: (text: string, title?: string) => void;
  triggerClassName?: string;
  triggerLabel?: string;
};

export function AiResearchModal({
  currentLocale = "pt",
  onInsert,
  triggerClassName,
  triggerLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"article" | "summary" | "bullet">("article");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [suggestedTitle, setSuggestedTitle] = useState("");
  const [perplexityUrl, setPerplexityUrl] = useState("");
  const [duckduckgoUrl, setDuckduckgoUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const t = dict[currentLocale] ?? dict.pt;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  async function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    setCopied(false);
    setResult("");
    setSuggestedTitle("");

    try {
      const res = await fetch("/api/ai-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), mode, language: currentLocale }),
      });

      if (!res.ok) throw new Error("Falha na requisição");
      const data = await res.json();
      setResult(data.text);
      setSuggestedTitle(data.title || "");
      setPerplexityUrl(data.perplexityUrl);
      setDuckduckgoUrl(data.duckduckgoUrl);
    } catch {
      setResult("Ocorreu um erro ao consultar a IA gratuita. Pode consultar diretamente pelos links externos abaixo.");
      setPerplexityUrl(`https://www.perplexity.ai/search?q=${encodeURIComponent(query.trim())}`);
      setDuckduckgoUrl(`https://duckduckgo.com/?q=${encodeURIComponent(query.trim())}&ia=chat`);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(result);
      } else {
        throw new Error("Clipboard API not available");
      }
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = result;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    // Auto-close modal after copying so user can immediately paste onto the site
    setTimeout(() => {
      setCopied(false);
      setOpen(false);
    }, 600);
  }

  function handleInsert() {
    const finalTitle = suggestedTitle || "";
    if (onInsert && result) {
      onInsert(result, finalTitle);
      setOpen(false);
    } else {
      // Find editor title input and content textarea if on edit page
      const titleInput = document.getElementById("title") as HTMLInputElement | null;
      if (titleInput && finalTitle && !titleInput.disabled && !titleInput.readOnly) {
        titleInput.value = finalTitle;
        titleInput.dispatchEvent(new Event("input", { bubbles: true }));
        titleInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
      const ta = document.getElementById("content") as HTMLTextAreaElement | null;
      if (ta && result) {
        const { selectionStart: s, selectionEnd: e } = ta;
        ta.setRangeText(result + "\n\n", s, e, "end");
        ta.focus();
        setOpen(false);
      } else {
        handleCopy();
      }
    }
  }

  return (
    <>
      <button
        type="button"
        id="open-ai-research-btn"
        onClick={() => setOpen(true)}
        className={
          triggerClassName ??
          "btn inline-flex items-center gap-1.5 border-accent/40 bg-accent/10 text-accent font-semibold hover:bg-accent hover:text-accent-ink transition-colors"
        }
        title={t.aiResearchTitle}
      >
        <span aria-hidden="true" className="text-sm">✨</span>
        <span>{triggerLabel ?? t.aiResearch}</span>
      </button>

      {open &&
        mounted &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-modal-title"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[100] overflow-y-auto bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
          >
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6 text-center">
            <div
              className="card relative my-auto flex flex-col w-full max-w-2xl max-h-[85vh] overflow-hidden border border-accent/40 bg-bg shadow-2xl rounded-2xl p-5 sm:p-7 text-left transform transition-all"
              onClick={(e) => e.stopPropagation()}
            >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-line pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 text-accent text-sm">
                    ✨
                  </span>
                  <h2 id="ai-modal-title" className="text-lg font-bold font-serif tracking-tight text-ink">
                    {t.aiResearchTitle}
                  </h2>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  {t.aiResearchSubtitle}
                </p>
              </div>
              <button
                type="button"
                id="close-ai-modal-btn"
                onClick={() => setOpen(false)}
                className="btn !min-h-8 !w-8 !p-0 rounded-full text-muted hover:text-ink hover:bg-surface text-base font-bold transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSearch} className="mt-4 space-y-3">
              <div>
                <label htmlFor="ai-query-input" className="sr-only">
                  {t.aiPlaceholder}
                </label>
                <div className="flex gap-2">
                  <input
                    id="ai-query-input"
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t.aiPlaceholder}
                    autoFocus
                    required
                    className="input flex-1"
                  />
                  <button
                    type="submit"
                    disabled={loading || !query.trim()}
                    className="btn btn-primary shrink-0"
                  >
                    {loading ? "..." : t.aiSearchBtn}
                  </button>
                </div>
              </div>

              {/* Mode Options */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-muted font-medium">Formato:</span>
                <button
                  type="button"
                  onClick={() => setMode("article")}
                  className={`btn !min-h-7 !py-0.5 !px-2.5 text-xs ${mode === "article" ? "btn-primary" : ""}`}
                >
                  📄 {t.aiModeArticle}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("summary")}
                  className={`btn !min-h-7 !py-0.5 !px-2.5 text-xs ${mode === "summary" ? "btn-primary" : ""}`}
                >
                  📝 {t.aiModeSummary}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("bullet")}
                  className={`btn !min-h-7 !py-0.5 !px-2.5 text-xs ${mode === "bullet" ? "btn-primary" : ""}`}
                >
                  📌 {t.aiModeBullets}
                </button>
              </div>
            </form>

            {/* Loading Indicator */}
            {loading && (
              <div className="mt-6 flex flex-col items-center justify-center p-8 space-y-3 text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                <p className="text-sm font-medium text-muted">A pesquisar com IA gratuita e factual...</p>
              </div>
            )}

            {/* Result Area */}
            {result && !loading && (
              <div className="mt-4 flex-1 flex flex-col min-h-0 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                      {t.aiResearch}
                    </span>
                    {suggestedTitle && (
                      <span className="text-xs text-ink">
                        <strong className="text-accent font-semibold">{t.aiSuggestedTitle}:</strong>{" "}
                        <span id="ai-suggested-title" className="font-semibold">{suggestedTitle}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      id="ai-copy-btn"
                      onClick={handleCopy}
                      className="btn !min-h-8 !py-1 !px-3 text-xs bg-accent/15 text-accent font-semibold hover:bg-accent hover:text-accent-ink"
                    >
                      {copied ? `✓ ${t.aiCopied}` : `📋 ${t.aiCopyBtn}`}
                    </button>
                    <button
                      type="button"
                      id="ai-insert-btn"
                      onClick={handleInsert}
                      className="btn btn-primary !min-h-8 !py-1 !px-3 text-xs font-semibold shadow-xs"
                    >
                      📥 {t.aiInsertEditor}
                    </button>
                  </div>
                </div>

                <textarea
                  readOnly
                  value={result}
                  rows={9}
                  className="input font-mono text-xs leading-relaxed bg-surface/50 resize-y"
                />

                {/* External Free AI Links */}
                <div className="border-t border-line pt-3">
                  <p className="text-xs text-muted mb-2 font-medium">{t.aiFreeExternal}:</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {perplexityUrl && (
                      <a
                        href={perplexityUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn !min-h-7 !py-0.5 !px-2.5 text-xs text-accent underline"
                      >
                        🌐 Perplexity AI (Web Search) ↗
                      </a>
                    )}
                    {duckduckgoUrl && (
                      <a
                        href={duckduckgoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn !min-h-7 !py-0.5 !px-2.5 text-xs text-accent underline"
                      >
                        🦆 DuckDuckGo AI Chat ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Initial State Helper */}
            {!result && !loading && (
              <div className="mt-6 border-t border-line pt-4">
                <p className="text-xs text-muted font-medium mb-2">{t.aiFreeExternal}:</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <a
                    href="https://www.perplexity.ai"
                    target="_blank"
                    rel="noreferrer"
                    className="btn !min-h-7 !py-0.5 !px-2.5 text-xs text-accent underline"
                  >
                    🌐 Perplexity AI (Grátis) ↗
                  </a>
                  <a
                    href="https://duckduckgo.com/?q=DuckDuckGo+AI+Chat&ia=chat"
                    target="_blank"
                    rel="noreferrer"
                    className="btn !min-h-7 !py-0.5 !px-2.5 text-xs text-accent underline"
                  >
                    🦆 DuckDuckGo AI (Grátis) ↗
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>,
      document.body
    )}
  </>
);
}
