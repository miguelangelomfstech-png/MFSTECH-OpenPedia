import Link from "next/link";
import { publicUrl } from "@wiki/shared";
import { searchArticles, searchMedia, type ArticleHit, type MediaHit } from "@/lib/search";
import { getT } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata = { title: "Search", robots: { index: false } };

type Props = { searchParams: Promise<{ q?: string; type?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const { q = "", type = "articles" } = await searchParams;
  const t = await getT();
  let error = false;
  let articleHits: ArticleHit[] = [];
  let mediaHits: MediaHit[] = [];
  let total = 0;

  if (q.trim()) {
    try {
      if (type === "media") {
        const r = await searchMedia(q, { limit: 36 });
        mediaHits = r.hits;
        total = r.total;
      } else {
        const r = await searchArticles(q, { limit: 25, namespace: "main" });
        articleHits = r.hits;
        total = r.total;
      }
    } catch {
      error = true;
    }
  }

  return (
    <div>
      <h1 className="font-serif text-3xl font-bold">{t("search")}</h1>
      <form action="/search" className="mt-4 flex gap-2" role="search">
        <label className="sr-only" htmlFor="q">Query</label>
        <input
          id="q"
          name="q"
          defaultValue={q}
          className="input"
          placeholder={t("searchPlaceholder")}
          autoFocus
        />
        <input type="hidden" name="type" value={type} />
        <button className="btn btn-primary">{t("search")}</button>
      </form>

      <nav aria-label="Result type" className="mt-4 flex gap-2 text-sm">
        <Link
          href={`/search?q=${encodeURIComponent(q)}&type=articles`}
          aria-current={type === "articles" ? "page" : undefined}
          className={`btn !min-h-8 !py-1 ${type === "articles" ? "btn-primary" : ""}`}
        >
          {t("articlesTab")}
        </Link>
        <Link
          href={`/search?q=${encodeURIComponent(q)}&type=media`}
          aria-current={type === "media" ? "page" : undefined}
          className={`btn !min-h-8 !py-1 ${type === "media" ? "btn-primary" : ""}`}
        >
          {t("mediaTab")}
        </Link>
      </nav>

      {error && <p role="alert" className="card mt-6 p-4 text-red">{t("searchUnavailable")}</p>}
      {q && !error && (
        <p className="mt-4 text-sm text-muted" aria-live="polite">
          {total} {t("resultsFor")} “{q}”
        </p>
      )}

      {type === "articles" ? (
        <ul className="mt-4 space-y-4">
          {articleHits.map((h) => (
            <li key={h.slug} className="card p-4">
              <Link className="font-serif text-xl font-semibold text-accent underline" href={`/wiki/${h.slug}`}>
                {h.title}
              </Link>
              <p
                className="mt-1 text-sm text-muted"
                dangerouslySetInnerHTML={{ __html: sanitizeMark(h._formatted?.excerpt ?? h.excerpt) }}
              />
              {h.categories && h.categories.length > 0 && (
                <p className="mt-1 text-xs text-muted">{h.categories.join(" · ")}</p>
              )}
            </li>
          ))}
          {q && !error && !articleHits.length && (
            <li className="text-muted">
              {t("noResults")}{" "}
              <Link className="text-accent underline" href={`/wiki/${encodeURIComponent(q.replace(/\s+/g, "-").toLowerCase())}/edit`}>
                {t("createPageQuestion")} “{q}”?
              </Link>
            </li>
          )}
        </ul>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {mediaHits.map((m) => (
            <li key={m.slug}>
              <Link href={`/file/${m.slug}`} className="card block overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {m.thumbKey && (
                  <img
                    src={publicUrl(m.thumbKey)}
                    alt={m.title}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover"
                  />
                )}
                <span className="block truncate p-2 text-xs">
                  {m.kind === "video" ? "▶ " : ""}
                  {m.title}
                </span>
              </Link>
            </li>
          ))}
          {q && !error && !mediaHits.length && (
            <li className="col-span-full text-muted">{t("noResults")}</li>
          )}
        </ul>
      )}
    </div>
  );
}

/** Highlights are the only HTML we trust: escape everything else. */
function sanitizeMark(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/&lt;(\/?)mark>/g, "<$1mark>");
}
