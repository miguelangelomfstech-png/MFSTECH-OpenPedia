import Link from "next/link";
import { db, articles, revisions, users, eq, and, desc } from "@wiki/db";
import { slugify, NAMESPACES, type Namespace } from "@wiki/shared";
import { getViewer } from "@/lib/viewer";
import { ArticleTabs } from "@/components/ArticleTabs";
import { restoreRevision } from "@/app/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Revision history", robots: { index: false } };
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ ns?: string }> };

export default async function HistoryPage({ params, searchParams }: Props) {
  const slug = slugify(decodeURIComponent((await params).slug));
  const sp = await searchParams;
  const ns = (NAMESPACES as readonly string[]).includes(sp.ns ?? "") ? (sp.ns as Namespace) : "main";
  const { user } = await getViewer();
  const [a] = await db.select().from(articles).where(and(eq(articles.namespace, ns), eq(articles.slug, slug)));
  const revs = a
    ? await db.select({
        id: revisions.id, parentId: revisions.parentId, createdAt: revisions.createdAt, summary: revisions.summary,
        size: revisions.size, minor: revisions.isMinor, revert: revisions.isRevert, author: users.name,
      }).from(revisions).leftJoin(users, eq(users.id, revisions.authorId))
        .where(eq(revisions.articleId, a.id)).orderBy(desc(revisions.createdAt)).limit(200)
    : [];

  return (
    <>
      <ArticleTabs slug={slug} active="history" ns={ns} />
      <h1 className="mb-6 font-serif text-3xl font-bold">Revision history: {a?.title ?? slug}</h1>
      {!revs.length && <p className="text-muted">No history.</p>}
      <ul className="card divide-y divide-line">
        {revs.map((r, i) => {
          const prev = revs[i + 1];
          return (
            <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 p-3 text-sm">
              <time dateTime={r.createdAt.toISOString()} className="tabular-nums">{r.createdAt.toISOString().slice(0, 16).replace("T", " ")}</time>
              <span className="font-semibold">{r.author ?? "Anonymous"}</span>
              <span className="text-muted tabular-nums">{r.size.toLocaleString()} bytes{prev && ` (${r.size - prev.size >= 0 ? "+" : ""}${r.size - prev.size})`}</span>
              {r.minor && <span title="Minor edit">m</span>}
              {r.revert && <span className="text-muted">↩ restore</span>}
              <span className="min-w-0 flex-1 truncate text-muted">{r.summary && `— ${r.summary}`}</span>
              {prev && <Link className="text-accent underline" href={`/wiki/${slug}/diff?from=${prev.id}&to=${r.id}`}>diff</Link>}
              {i > 0 && user && (
                <form action={restoreRevision}>
                  <input type="hidden" name="revisionId" value={r.id} />
                  <button className="text-accent underline">restore</button>
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
