import Link from "next/link";
import { db, articles, revisions, media, mediaRenditions, eq, and, desc, isNull } from "@wiki/db";
import { toPlainText, publicUrl } from "@wiki/shared";
import { getT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function Home() {
  const t = await getT();
  const [featured] = await db
    .select({ title: articles.title, slug: articles.slug, content: revisions.content })
    .from(articles).innerJoin(revisions, eq(revisions.id, articles.currentRevisionId))
    .where(and(eq(articles.featured, true), eq(articles.namespace, "main")))
    .orderBy(desc(articles.featuredAt)).limit(1);
  const recent = await db.select({ title: articles.title, slug: articles.slug, at: articles.updatedAt })
    .from(articles).where(and(eq(articles.namespace, "main"), isNull(articles.redirectToSlug)))
    .orderBy(desc(articles.updatedAt)).limit(10);
  const latestMedia = await db.select({ filename: media.filename, slug: media.slug, kind: media.kind, thumb: mediaRenditions.key })
    .from(media).innerJoin(mediaRenditions, and(eq(mediaRenditions.mediaId, media.id), eq(mediaRenditions.label, "thumb-400")))
    .where(eq(media.status, "ready")).orderBy(desc(media.createdAt)).limit(6);

  return (
    <div className="space-y-12">
      <section className="rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-8 text-white shadow-lg sm:p-14">
        <div className="mb-4 inline-flex items-center gap-2.5 rounded-full bg-white/10 px-3.5 py-1.5 backdrop-blur ring-1 ring-white/20">
          <img
            src="/mfstech_logo.jpg"
            alt="MFSTECH"
            className="h-6 w-6 rounded-full object-cover"
          />
          <span className="text-xs font-semibold uppercase tracking-wider text-white">MFSTECH-OpenPedia</span>
        </div>
        <h1 className="font-serif text-4xl font-bold tracking-tight sm:text-6xl">{t("heroTitle")}</h1>
        <p className="mt-4 max-w-xl text-lg text-white/90">{t("heroSubtitle")}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/wiki/sandbox/edit" className="btn !border-white !bg-white !text-indigo-900">{t("startWriting")}</Link>
          <Link href="/recent" className="btn !border-white/60 !bg-transparent !text-white">{t("recent")}</Link>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        {featured && (
          <section aria-labelledby="featured" className="card p-6">
            <h2 id="featured" className="text-sm font-semibold uppercase tracking-wide text-accent">★ {t("featured")}</h2>
            <h3 className="mt-2 font-serif text-3xl font-bold"><Link href={`/wiki/${featured.slug}`}>{featured.title}</Link></h3>
            <p className="wiki-body mt-3 text-muted">{toPlainText(featured.content).slice(0, 360)}…</p>
            <Link className="mt-3 inline-block font-semibold text-accent underline" href={`/wiki/${featured.slug}`}>{t("readFullArticle")}</Link>
          </section>
        )}
        <section aria-labelledby="recent" className="card p-6">
          <h2 id="recent" className="font-semibold">{t("recentlyUpdated")}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {recent.map((r) => (
              <li key={r.slug} className="flex justify-between gap-2">
                <Link className="text-accent underline" href={`/wiki/${r.slug}`}>{r.title}</Link>
                <time className="text-muted" dateTime={r.at.toISOString()}>{r.at.toISOString().slice(5, 10)}</time>
              </li>
            ))}
            {!recent.length && <li className="text-muted">No articles yet. Run <code>pnpm db:seed</code>.</li>}
          </ul>
        </section>
      </div>

      {latestMedia.length > 0 && (
        <section aria-labelledby="media">
          <h2 id="media" className="mb-4 font-semibold">{t("newMedia")}</h2>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {latestMedia.map((m) => (
              <li key={m.slug}>
                <Link href={`/file/${m.slug}`} className="card block overflow-hidden transition hover:-translate-y-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={publicUrl(m.thumb)} alt={m.filename} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                  <span className="block truncate p-2 text-xs">{m.kind === "video" ? "▶ " : ""}{m.filename}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
