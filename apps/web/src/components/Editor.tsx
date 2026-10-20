"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { saveArticle, previewMarkdown } from "@/app/actions";
import { AiResearchModal } from "./AiResearchModal";

type Props = {
  ns: "main" | "talk" | "category";
  title: string;
  titleLocked: boolean;
  initial: string;
  baseRevisionId: string | null;
};

const TOOLS: [string, string, string, string][] = [
  ["B", "Bold", "**", "**"], ["I", "Italic", "*", "*"], ["Link", "Internal link", "[[", "]]"],
  ["H2", "Heading", "\n## ", ""], ["Cite", "Citation", "[^1]", ""], ["File", "Embed image or video", "[[File:", "|Caption]]"],
  ["Cat", "Category", "[[Category:", "]]"],
];

export function Editor({ ns, title, titleLocked, initial, baseRevisionId }: Props) {
  const [state, action, pending] = useActionState(saveArticle, undefined);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, start] = useTransition();
  const [titleVal, setTitleVal] = useState(title === "sandbox" || title === "new" ? "" : title);
  const ta = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  function wrap(before: string, after: string) {
    const el = ta.current!;
    const { selectionStart: s, selectionEnd: e, value } = el;
    el.setRangeText(before + value.slice(s, e) + after, s, e, "select");
    el.focus();
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="ns" value={ns} />
      <input type="hidden" name="baseRevisionId" value={baseRevisionId ?? ""} />
      {titleLocked ? <input type="hidden" name="title" value={title} /> : (
        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-semibold">Title</label>
          <input
            ref={titleInputRef}
            id="title"
            name="title"
            required
            maxLength={200}
            value={titleVal}
            onChange={(e) => setTitleVal(e.target.value)}
            placeholder="Título do artigo / Article title..."
            className="input"
          />
        </div>
      )}
      <div role="toolbar" aria-label="Formatting" className="flex flex-wrap items-center gap-1">
        {TOOLS.map(([label, aria, b, a]) => (
          <button key={label} type="button" className="btn !min-h-9 !px-3" aria-label={aria} onClick={() => wrap(b, a)}>{label}</button>
        ))}
        <div className="ml-auto">
          <AiResearchModal
            triggerClassName="btn !min-h-9 !px-3 border-accent/50 bg-accent/15 text-accent font-semibold hover:bg-accent hover:text-accent-ink"
            triggerLabel="✨ Pesquisa IA / AI Assistant"
            onInsert={(txt, suggestedTitle) => {
              if (suggestedTitle && !titleLocked) {
                setTitleVal(suggestedTitle);
                if (titleInputRef.current) {
                  titleInputRef.current.value = suggestedTitle;
                }
              }
              const el = ta.current;
              if (el) {
                const { selectionStart: s, selectionEnd: e } = el;
                el.setRangeText(txt + "\n\n", s, e, "end");
                el.focus();
              }
            }}
          />
        </div>
      </div>
      <div>
        <label htmlFor="content" className="mb-1 block text-sm font-semibold">Content (Markdown, limited HTML)</label>
        <textarea ref={ta} id="content" name="content" required rows={22} defaultValue={initial}
          className="input font-mono text-sm leading-relaxed" spellCheck />
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <label htmlFor="summary" className="mb-1 block text-sm font-semibold">Edit summary</label>
          <input id="summary" name="summary" maxLength={500} className="input" placeholder="What did you change?" />
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="minor" /> Minor edit</label>
      </div>
      <p className="text-sm text-muted">
        By saving you agree to release your contribution under CC BY-SA 4.0. Link pages with <code>[[Title]]</code>,
        embed media with <code>[[File:Name.jpg|Caption]]</code>, cite with footnotes <code>[^1]</code>.
      </p>
      {state?.error && <p role="alert" className="card border-red p-3 text-red">{state.error}</p>}
      <div className="flex gap-2">
        <button id="save-article-btn" className="btn btn-primary" disabled={pending}>{pending ? "Saving…" : "Save changes"}</button>
        <button type="button" className="btn" disabled={busy}
          onClick={() => start(async () => setPreview(await previewMarkdown(ta.current!.value)))}>
          {busy ? "Rendering…" : "Preview"}
        </button>
      </div>
      {preview !== null && (
        <section aria-label="Preview" className="card p-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Preview</h2>
          <div className="wiki-body" dangerouslySetInnerHTML={{ __html: preview }} />
        </section>
      )}
    </form>
  );
}
