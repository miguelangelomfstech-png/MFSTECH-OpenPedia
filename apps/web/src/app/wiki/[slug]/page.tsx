import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { db, articles, articleCategories, categories, watchlist, eq, and, canEdit, isAdmin } from "@wiki/db";
import { slugify } from "@wiki/shared";
import { getArticle, renderContent } from "@/lib/content";
import { getViewer } from "@/lib/viewer";
import { getT } from "@/lib/i18n";
import { ArticleTabs } from "@/components/ArticleTabs";
import { setFeatured, setProtection, toggleWatch } from "@/app/actions";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ from?: string; error?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getArticle("main", slugify(decodeURIComponent(slug)));
  if (!data) return { title: "Page not found" };
  const text = data.revision.content.replace(/[#*_`>\[\]]/g, "").slice(0, 160);
  return {
    title: data.article.title, description: text,
    alternates: { canonical: `/wiki/${data.article.slug}` },
    openGraph: { title: data.article.title, description: text, type: "article" },
  };
}

export default async function ArticlePage({ params, searchParams }: Props) {
  const slug = slugify(decodeURIComponent((await params).slug));
  const sp = await searchParams;
  const t = await getT();
  const data = await getArticle("main", slug);
  const { user, actor } = await getViewer();

  if (!data) {
    return (
      <>
        <ArticleTabs slug={slug} active="article" />
        <h1 className="font-serif text-4xl font-bold">{decodeURIComponent((await params).slug).replace(/[-_]/g, " ")}</h1>
        <p className="mt-4 text-muted">This page does not exist yet.</p>
        <Link href={`/wiki/${slug}/edit`} className="btn btn-primary mt-4">Create this page</Link>
      </>
    );
  }
  const { article, revision } = data;

  if (article.redirectToSlug && !sp.from) {
    const target = await getArticle("main", article.redirectToSlug);
    if (target && target.article.id !== article.id) redirect(`/wiki/${article.redirectToSlug}?from=${slug}`);
  }

  const { html, toc } = await renderContent(revision.content);
  const cats = await db.select({ slug: categories.slug, title: categories.title }).from(articleCategories)
    .innerJoin(categories, eq(categories.id, articleCategories.categoryId))
    .where(eq(articleCategories.articleId, article.id));
  const watching = user
    ? (await db.select().from(watchlist).where(and(eq(watchlist.userId, user.id), eq(watchlist.articleId, article.id)))).length > 0
    : false;
  const editable = canEdit(actor, article.protection);

  const jsonLd = {
    "@context": "https://schema.org", "@type": "Article", headline: article.title,
    dateModified: article.updatedAt.toISOString(), datePublished: article.createdAt.toISOString(),
    inLanguage: "en", license: "https://creativecommons.org/licenses/by-sa/4.0/",
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ArticleTabs slug={slug} active="article" />
      {sp.from && <p className="mb-3 text-sm text-muted">(Redirected from {sp.from.replace(/-/g, " ")})</p>}
      {sp.error && <p role="alert" className="card mb-4 p-3 text-red">{sp.error}</p>}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="font-serif text-4xl font-bold tracking-tight">{article.title}</h1>
        <div className="flex flex-wrap gap-2">
          {article.featured && <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-ink">★ {t("featured")}</span>}
          {article.protection !== "none" && <span className="rounded-full border border-line px-3 py-1 text-xs" title="Editing is restricted">🔒 {article.protection}-protected</span>}
          {user && (
            <form action={toggleWatch}>
              <input type="hidden" name="articleId" value={article.id} />
              <button className="btn !min-h-8 !py-1 text-xs">{watching ? t("unwatch") : t("watch")}</button>
            </form>
          )}
        </div>
      </div>
      {!editable && <p className="mt-2 text-sm text-muted">You cannot edit this page. You can still discuss it on the talk page.</p>}

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_16rem]">
        <div className="min-w-0">
          <div className="wiki-body" dangerouslySetInnerHTML={{ __html: html }} />
          {cats.length > 0 && (
            <nav aria-label="Categories" className="card mt-10 p-4 text-sm">
              <strong>Categories:</strong>{" "}
              {cats.map((c, i) => (
                <span key={c.slug}>{i > 0 && " · "}<Link className="text-accent underline" href={`/category/${c.slug}`}>{c.title}</Link></span>
              ))}
            </nav>
          )}
          <p className="mt-4 text-xs text-muted">Last edited {revision.createdAt.toISOString().slice(0, 10)} by {revision.authorName ?? "an anonymous contributor"}.</p>
        </div>
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          {toc.length > 1 && (
            <nav aria-label="Table of contents" className="card p-4 text-sm">
              <h2 className="mb-2 font-semibold">Contents</h2>
              <ol className="space-y-1">
                {toc.map((i) => (
                  <li key={i.id} style={{ paddingLeft: `${(i.depth - 2) * 0.9}rem` }}>
                    <a className="text-muted hover:text-accent" href={`#${i.id}`}>{i.text}</a>
                  </li>
                ))}
              </ol>
            </nav>
          )}
          {isAdmin(actor) && (
            <section aria-label="Admin tools" className="card space-y-3 p-4 text-sm">
              <h2 className="font-semibold">Admin</h2>
              <form action={setProtection} className="flex gap-2">
                <input type="hidden" name="articleId" value={article.id} />
                <select name="level" defaultValue={article.protection} className="input !min-h-8 !py-1" aria-label="Protection level">
                  <option value="none">None</option><option value="semi">Semi</option><option value="full">Full</option>
                </select>
                <button className="btn !min-h-8 !py-1">Protect</button>
              </form>
              <form action={setFeatured}>
                <input type="hidden" name="articleId" value={article.id} />
                <input type="hidden" name="featured" value={article.featured ? "0" : "1"} />
                <button className="btn !min-h-8 !py-1">{article.featured ? "Unfeature" : "Feature"}</button>
              </form>
            </section>
          )}
        </aside>
      </div>
    </article>
  );
}
