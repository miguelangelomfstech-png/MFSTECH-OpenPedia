import Link from "next/link";
import { redirect } from "next/navigation";
import { db, watchlist, articles, notifications, eq, desc } from "@wiki/db";
import { getViewer } from "@/lib/viewer";
import { markNotificationsRead } from "@/app/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Watchlist" };

export default async function WatchlistPage() {
  const { user } = await getViewer();
  if (!user) redirect("/login?next=/watchlist");
  const watched = await db.select({ title: articles.title, slug: articles.slug, ns: articles.namespace, at: articles.updatedAt })
    .from(watchlist).innerJoin(articles, eq(articles.id, watchlist.articleId))
    .where(eq(watchlist.userId, user.id)).orderBy(desc(articles.updatedAt));
  const notes = await db.select({ id: notifications.id, message: notifications.message, read: notifications.read, at: notifications.createdAt, slug: articles.slug })
    .from(notifications).leftJoin(articles, eq(articles.id, notifications.articleId))
    .where(eq(notifications.userId, user.id)).orderBy(desc(notifications.createdAt)).limit(30);
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <section aria-labelledby="notes">
        <div className="mb-3 flex items-center justify-between">
          <h1 id="notes" className="font-serif text-3xl font-bold">Notifications</h1>
          <form action={markNotificationsRead}><button className="btn !min-h-8 text-xs">Mark all read</button></form>
        </div>
        <ul className="card divide-y divide-line">
          {notes.map((n) => (
            <li key={n.id} className={`p-3 text-sm ${n.read ? "text-muted" : "font-semibold"}`}>
              {n.slug ? <Link className="underline" href={`/wiki/${n.slug}/history`}>{n.message}</Link> : n.message}
            </li>
          ))}
          {!notes.length && <li className="p-3 text-muted">Nothing yet.</li>}
        </ul>
      </section>
      <section aria-labelledby="watched">
        <h2 id="watched" className="mb-3 font-serif text-3xl font-bold">Watched pages</h2>
        <ul className="card divide-y divide-line">
          {watched.map((w) => (
            <li key={w.slug + w.ns} className="flex justify-between p-3 text-sm">
              <Link className="text-accent underline" href={w.ns === "talk" ? `/wiki/${w.slug}/talk` : `/wiki/${w.slug}`}>{w.title}</Link>
              <time className="text-muted" dateTime={w.at.toISOString()}>{w.at.toISOString().slice(0, 10)}</time>
            </li>
          ))}
          {!watched.length && <li className="p-3 text-muted">Use “Watch” on any article.</li>}
        </ul>
      </section>
    </div>
  );
}
