import Link from "next/link";
import { getArticle, renderContent } from "@/lib/content";
import { getViewer } from "@/lib/viewer";
import { canEdit } from "@wiki/db";
import { slugify } from "@wiki/shared";
import { ArticleTabs } from "@/components/ArticleTabs";

export const dynamic = "force-dynamic";
export const metadata = { title: "Talk page", robots: { index: false } };

export default async function TalkPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = slugify(decodeURIComponent((await params).slug));
  const { actor } = await getViewer();
  const data = await getArticle("talk", slug);
  const rendered = data ? await renderContent(data.revision.content) : null;
  return (
    <>
      <ArticleTabs slug={slug} active="talk" />
      <h1 className="mb-4 font-serif text-3xl font-bold">Talk: {data?.article.title ?? slug.replace(/-/g, " ")}</h1>
      {rendered ? <div className="wiki-body" dangerouslySetInnerHTML={{ __html: rendered.html }} />
        : <p className="text-muted">No discussion has started yet.</p>}
      {canEdit(actor, data?.article.protection ?? "none") && (
        <Link className="btn btn-primary mt-6" href={`/wiki/${slug}/edit?ns=talk`}>{data ? "Add to discussion" : "Start a discussion"}</Link>
      )}
    </>
  );
}
