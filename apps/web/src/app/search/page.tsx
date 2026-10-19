import Link from "next/link";
import { meili, INDEX_ARTICLES, INDEX_MEDIA, publicUrl } from "@wiki/shared";

export const dynamic = "force-dynamic";
export const metadata = { title: "Search", robots: { index: false } };

type Props = { searchParams: Promise<{ q?: string; type?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const { q = "", type = "articles" } = await searchParams;
  let error = false;
  let articleHits: { title: string; slug: string; excerpt: string; categories: string[]; _formatted?: { excerpt?: string } }[] = [];
  let mediaHits: { title: string; slug: string; kind: string; thumbKey: string | null }[] = [];
  let total = 0;
  if (q.trim()) {
    try {
      if (type === "media") {
        const r = await meili().index(INDEX_MEDIA).search(q, { limit: 36 });
        mediaHits = r.hits as typeof mediaHits; total = r.estimatedTotalHits ?? 0;
      } else {
        const r = await meili().index(INDEX_ARTICLES).search(q, {
          limit: 25, attributesToHighlight: ["excerpt"], highlightPreTag: "<mark>", highlightPostTag: "</mark>",
          attributesToCrop: ["excerpt"], cropLength: 40,
        });
        articleHits = r.hits as typeof articleHits; total = r.estimatedTotalHits ?? 0;
      }
    } catch { error = true; }
  }
  return (
    <div>
      <h1 className="font-serif text-3xl font-bold">Search</h1>
      <form action="/search" className="mt-4 flex gap-2" role="search">
        <label className="sr-only" htmlFor="q">Query</label>
        <input id="q" name="q" defaultValue={q} className="input" autoFocus />
        <input type="hidden" name="type" value={type} />
        <button className="btn btn-primary">Search</button>
      </form>
      <nav aria-label="Result type" className="mt-4 flex gap-2 text-sm">
        {["articles", "media"].map((k) => (
          <Link key={k} href={`/search?q=${encodeURIComponent(q)}&type=${k}`} aria-current={type === k ? "page" : undefined}
            className={`btn !min-h-8 !py-1 ${type === k ? "btn-primary" : ""}`}>{k === "articles" ? "Articles" : "Images & videos"}</Link>
        ))}
      </nav>
      {error && <p role="alert" className="card mt-6 p-4 text-red">Search is temporarily unavailable.</p>}
      {q && !error && <p className="mt-4 text-sm text-muted" aria-live="polite">{total} results for “{q}”</p>}
      {type === "articles" ? (
        <ul className="mt-4 space-y-4">
          {articleHits.map((h) => (
            <li key={h.slug} className="card p-4">
              <Link className="font-serif text-xl font-semibold text-accent underline" href={`/wiki/${h.slug}`}>{h.title}</Link>
              <p className="mt-1 text-sm text-muted" dangerouslySetInnerHTML={{ __html: sanitizeMark(h._formatted?.excerpt ?? h.excerpt) }} />
              {h.categories?.length > 0 && <p className="mt-1 text-xs text-muted">{h.categories.join(" · ")}</p>}
            </li>
          ))}
          {q && !error && !articleHits.length && (
            <li className="text-muted">No results. <Link className="text-accent underline" href={`/wiki/${encodeURIComponent(q.replace(/\s+/g, "-").toLowerCase())}/edit`}>Create the page “{q}”</Link>?</li>
          )}
        </ul>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {mediaHits.map((m) => (
            <li key={m.slug}>
              <Link href={`/file/${m.slug}`} className="card block overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {m.thumbKey && <img src={publicUrl(m.thumbKey)} alt={m.title} loading="lazy" className="aspect-[4/3] w-full object-cover" />}
                <span className="block truncate p-2 text-xs">{m.kind === "video" ? "▶ " : ""}{m.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Meilisearch highlights are the only HTML we trust: escape everything else. */
function sanitizeMark(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/&lt;(\/?)mark>/g, "<$1mark>");
}
