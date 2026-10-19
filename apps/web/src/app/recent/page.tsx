import Link from "next/link";
import { db, articles, revisions, users, eq, and, desc } from "@wiki/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Recent changes" };

export default async function Recent() {
  const rows = await db.select({
    id: revisions.id, parentId: revisions.parentId, at: revisions.createdAt, summary: revisions.summary, size: revisions.size,
    title: articles.title, slug: articles.slug, ns: articles.namespace, author: users.name, flagged: revisions.flagged,
  }).from(revisions).innerJoin(articles, eq(articles.id, revisions.articleId))
    .leftJoin(users, eq(users.id, revisions.authorId)).orderBy(desc(revisions.createdAt)).limit(100);
  return (
    <>
      <h1 className="mb-6 font-serif text-3xl font-bold">Recent changes</h1>
      <ul className="card divide-y divide-line">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap gap-x-3 p-3 text-sm">
            <time className="tabular-nums text-muted" dateTime={r.at.toISOString()}>{r.at.toISOString().slice(5, 16).replace("T", " ")}</time>
            <Link className="font-semibold text-accent underline" href={r.ns === "talk" ? `/wiki/${r.slug}/talk` : r.ns === "category" ? `/category/${r.slug}` : `/wiki/${r.slug}`}>
              {r.ns === "talk" ? "Talk: " : r.ns === "category" ? "Category: " : ""}{r.title}
            </Link>
            {r.parentId && <Link className="text-muted underline" href={`/wiki/${r.slug}/diff?from=${r.parentId}&to=${r.id}`}>diff</Link>}
            <span>{r.author ?? "Anonymous"}</span>
            <span className="text-muted">{r.summary && `— ${r.summary}`}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
