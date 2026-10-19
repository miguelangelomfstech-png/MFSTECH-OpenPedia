import Link from "next/link";
import { notFound } from "next/navigation";
import { db, categories, articleCategories, articles, revisions, eq, and, asc } from "@wiki/db";
import { slugify } from "@wiki/shared";
import { getArticle, renderContent } from "@/lib/content";
import { ArticleTabs } from "@/components/ArticleTabs";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = slugify(decodeURIComponent((await params).slug));
  const [cat] = await db.select().from(categories).where(eq(categories.slug, slug));
  if (!cat) notFound();
  const sub = await db.select().from(categories).where(eq(categories.parentId, cat.id)).orderBy(asc(categories.title));
  const parent = cat.parentId ? (await db.select().from(categories).where(eq(categories.id, cat.parentId)))[0] : null;
  const members = await db.select({ title: articles.title, slug: articles.slug }).from(articleCategories)
    .innerJoin(articles, eq(articles.id, articleCategories.articleId))
    .where(and(eq(articleCategories.categoryId, cat.id), eq(articles.namespace, "main"))).orderBy(asc(articles.title));
  const desc = await getArticle("category", slug);
  const body = desc ? await renderContent(desc.revision.content) : null;

  return (
    <>
      <ArticleTabs slug={slug} active="article" ns="category" />
      {parent && <p className="mb-2 text-sm"><Link className="text-accent underline" href={`/category/${parent.slug}`}>← {parent.title}</Link></p>}
      <h1 className="font-serif text-4xl font-bold">Category: {cat.title}</h1>
      {body && <div className="wiki-body mt-4" dangerouslySetInnerHTML={{ __html: body.html }} />}
      {sub.length > 0 && (
        <section aria-labelledby="sub" className="mt-8">
          <h2 id="sub" className="font-semibold">Subcategories</h2>
          <ul className="mt-2 grid gap-2 sm:grid-cols-3">
            {sub.map((s) => <li key={s.id}><Link className="card block p-3 text-accent underline" href={`/category/${s.slug}`}>{s.title}</Link></li>)}
          </ul>
        </section>
      )}
      <section aria-labelledby="pages" className="mt-8">
        <h2 id="pages" className="font-semibold">Pages ({members.length})</h2>
        <ul className="mt-2 columns-1 gap-8 sm:columns-2 lg:columns-3">
          {members.map((m) => <li key={m.slug} className="py-0.5"><Link className="text-accent underline" href={`/wiki/${m.slug}`}>{m.title}</Link></li>)}
        </ul>
      </section>
    </>
  );
}
