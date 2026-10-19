import Link from "next/link";
import { notFound } from "next/navigation";
import { db, users, revisions, articles, eq, desc } from "@wiki/db";
import { getViewer } from "@/lib/viewer";
import { isAdmin } from "@wiki/db";
import { blockUser } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function UserPage({ params }: { params: Promise<{ name: string }> }) {
  const name = decodeURIComponent((await params).name);
  const [u] = await db.select().from(users).where(eq(users.name, name));
  if (!u) notFound();
  const { actor } = await getViewer();
  const contribs = await db.select({
    id: revisions.id, parentId: revisions.parentId, at: revisions.createdAt, summary: revisions.summary,
    title: articles.title, slug: articles.slug, ns: articles.namespace,
  }).from(revisions).innerJoin(articles, eq(articles.id, revisions.articleId))
    .where(eq(revisions.authorId, u.id)).orderBy(desc(revisions.createdAt)).limit(100);

  return (
    <>
      <h1 className="font-serif text-4xl font-bold">{u.name}</h1>
      <p className="mt-2 text-muted">{u.role} · {u.editCount} edits · joined {u.createdAt.toISOString().slice(0, 10)}</p>
      {u.blockedUntil && u.blockedUntil > new Date() && <p className="card mt-3 p-3 text-red">Blocked until {u.blockedUntil.toISOString().slice(0, 10)}: {u.blockReason}</p>}
      {isAdmin(actor) && (
        <form action={blockUser} className="card mt-4 flex flex-wrap items-end gap-2 p-3 text-sm">
          <input type="hidden" name="userId" value={u.id} />
          <label>Block days (0 = unblock)<input name="days" type="number" min={0} defaultValue={7} className="input !w-24" /></label>
          <label className="flex-1">Reason<input name="reason" className="input" /></label>
          <button className="btn btn-danger">Apply</button>
        </form>
      )}
      <h2 className="mb-3 mt-8 font-semibold">Contributions</h2>
      <ul className="card divide-y divide-line">
        {contribs.map((c) => (
          <li key={c.id} className="flex flex-wrap gap-3 p-3 text-sm">
            <time className="tabular-nums text-muted" dateTime={c.at.toISOString()}>{c.at.toISOString().slice(0, 16).replace("T", " ")}</time>
            <Link className="font-semibold text-accent underline" href={`/wiki/${c.slug}`}>{c.title}</Link>
            {c.parentId && <Link className="underline" href={`/wiki/${c.slug}/diff?from=${c.parentId}&to=${c.id}`}>diff</Link>}
            <span className="text-muted">{c.summary}</span>
          </li>
        ))}
        {!contribs.length && <li className="p-3 text-muted">No contributions yet.</li>}
      </ul>
    </>
  );
}
